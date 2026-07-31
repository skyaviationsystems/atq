-- Hardening for scoped authorization, tenant-safe role assignment, retained
-- evidence, private object mutation, and approved Supabase invitation mapping.

create or replace function app.valid_permission_scope(p_scope jsonb)
returns boolean
language plpgsql
immutable
set search_path = pg_catalog
as $$
declare
  scope_key text;
  scope_value jsonb;
  element text;
begin
  if p_scope is null or jsonb_typeof(p_scope) <> 'object' then
    return false;
  end if;

  for scope_key, scope_value in
    select key, value from jsonb_each(p_scope)
  loop
    if scope_key not in ('fleet_ids', 'base_ids', 'program_ids') then
      return false;
    end if;

    if jsonb_typeof(scope_value) <> 'array'
       or jsonb_array_length(scope_value) = 0 then
      return false;
    end if;

    for element in select jsonb_array_elements_text(scope_value)
    loop
      begin
        perform element::uuid;
      exception when invalid_text_representation then
        return false;
      end;
    end loop;
  end loop;

  return true;
end;
$$;

alter table app.user_profiles
  add constraint user_profiles_organization_id_id_key
  unique (organization_id, id);

alter table app.roles
  add constraint roles_organization_id_id_key
  unique (organization_id, id);

alter table app.role_assignments
  add constraint role_assignments_scope_is_valid
  check (app.valid_permission_scope(scope)),
  add constraint role_assignments_user_same_organization_fk
  foreign key (organization_id, user_profile_id)
  references app.user_profiles (organization_id, id),
  add constraint role_assignments_role_same_organization_fk
  foreign key (organization_id, role_id)
  references app.roles (organization_id, id),
  add constraint role_assignments_delegator_same_organization_fk
  foreign key (organization_id, delegated_by)
  references app.user_profiles (organization_id, id);

create or replace function app.validate_role_permission_organization()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, app
as $$
declare
  role_organization_id uuid;
  grantor_organization_id uuid;
begin
  select r.organization_id
    into role_organization_id
  from app.roles r
  where r.id = new.role_id;

  if role_organization_id is null then
    raise exception 'role does not exist' using errcode = '23503';
  end if;

  if new.granted_by is not null then
    select up.organization_id
      into grantor_organization_id
    from app.user_profiles up
    where up.id = new.granted_by;

    if grantor_organization_id is distinct from role_organization_id then
      raise exception 'role permission grantor must belong to the role organization'
        using errcode = '23514';
    end if;
  end if;

  return new;
end;
$$;

create trigger role_permissions_validate_organization
before insert or update on app.role_permissions
for each row execute function app.validate_role_permission_organization();

-- An organization-wide assignment is represented only by exactly {}. A scope
-- containing a dimension key is restrictive; an empty array is invalid rather
-- than being interpreted as "all."
create or replace function app.has_permission(
  requested_permission text,
  requested_organization_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, app
as $$
  select exists (
    select 1
    from app.role_assignments ra
    join app.role_permissions rp on rp.role_id = ra.role_id
    join app.permissions p on p.id = rp.permission_id
    where ra.user_profile_id = app.current_user_id()
      and ra.organization_id = requested_organization_id
      and p.code = requested_permission
      and ra.valid_from <= statement_timestamp()
      and (ra.valid_to is null or ra.valid_to > statement_timestamp())
      and ra.scope = '{}'::jsonb
  )
$$;

create or replace function app.has_scoped_permission(
  requested_permission text,
  requested_organization_id uuid,
  requested_fleet_id uuid default null,
  requested_base_id uuid default null,
  requested_program_id uuid default null
)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, app
as $$
  select exists (
    select 1
    from app.role_assignments ra
    join app.role_permissions rp on rp.role_id = ra.role_id
    join app.permissions p on p.id = rp.permission_id
    where ra.user_profile_id = app.current_user_id()
      and ra.organization_id = requested_organization_id
      and p.code = requested_permission
      and ra.valid_from <= statement_timestamp()
      and (ra.valid_to is null or ra.valid_to > statement_timestamp())
      and (
        not (ra.scope ? 'fleet_ids')
        or (
          requested_fleet_id is not null
          and (ra.scope -> 'fleet_ids') ? requested_fleet_id::text
        )
      )
      and (
        not (ra.scope ? 'base_ids')
        or (
          requested_base_id is not null
          and (ra.scope -> 'base_ids') ? requested_base_id::text
        )
      )
      and (
        not (ra.scope ? 'program_ids')
        or (
          requested_program_id is not null
          and (ra.scope -> 'program_ids') ? requested_program_id::text
        )
      )
  )
$$;

create or replace function app.can_access_person(
  requested_permission text,
  requested_organization_id uuid,
  requested_person_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, app
as $$
  select
    app.has_permission(requested_permission, requested_organization_id)
    or exists (
      select 1
      from app.positions p
      join app.position_versions pv on pv.position_id = p.id
      where p.organization_id = requested_organization_id
        and p.person_id = requested_person_id
        and pv.organization_id = requested_organization_id
        and pv.superseded_at is null
        and pv.valid_from <= current_date
        and (pv.valid_to is null or pv.valid_to > current_date)
        and app.has_scoped_permission(
          requested_permission,
          requested_organization_id,
          pv.fleet_id,
          pv.base_id,
          null
        )
    )
$$;

create or replace function app.can_access_position(
  requested_permission text,
  requested_organization_id uuid,
  requested_position_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, app
as $$
  select exists (
    select 1
    from app.positions p
    where p.id = requested_position_id
      and p.organization_id = requested_organization_id
      and app.can_access_person(
        requested_permission,
        requested_organization_id,
        p.person_id
      )
  )
$$;

create or replace function app.can_access_curriculum(
  requested_permission text,
  requested_organization_id uuid,
  requested_curriculum_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, app
as $$
  select exists (
    select 1
    from app.curricula c
    where c.id = requested_curriculum_id
      and c.organization_id = requested_organization_id
      and app.has_scoped_permission(
        requested_permission,
        requested_organization_id,
        c.fleet_id,
        null,
        c.program_id
      )
  )
$$;

create or replace function app.can_access_curriculum_version(
  requested_permission text,
  requested_organization_id uuid,
  requested_curriculum_version_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, app
as $$
  select exists (
    select 1
    from app.curriculum_versions cv
    where cv.id = requested_curriculum_version_id
      and cv.organization_id = requested_organization_id
      and app.can_access_curriculum(
        requested_permission,
        requested_organization_id,
        cv.curriculum_id
      )
  )
$$;

create or replace function app.can_access_event(
  requested_permission text,
  requested_organization_id uuid,
  requested_event_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, app
as $$
  select exists (
    select 1
    from app.training_event_versions tev
    where tev.training_event_id = requested_event_id
      and tev.organization_id = requested_organization_id
      and tev.superseded_at is null
      and (
        not tev.covert
        or app.has_scoped_permission(
          'no_notice:' || case
            when requested_permission like '%:write' then 'write'
            else 'read'
          end,
          requested_organization_id,
          tev.fleet_id,
          tev.location_base_id,
          tev.program_id
        )
      )
      and (
        app.has_permission(requested_permission, requested_organization_id)
        or app.has_scoped_permission(
          requested_permission,
          requested_organization_id,
          tev.fleet_id,
          tev.location_base_id,
          tev.program_id
        )
      )
  )
$$;

create or replace function app.can_access_form(
  requested_permission text,
  requested_organization_id uuid,
  requested_form_instance_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, app
as $$
  select exists (
    select 1
    from app.form_instances fi
    join app.program_resolution_log prl
      on prl.id = fi.program_resolution_id
     and prl.organization_id = fi.organization_id
    left join app.training_event_versions tev
      on tev.training_event_id = fi.training_event_id
     and tev.organization_id = fi.organization_id
     and tev.superseded_at is null
    where fi.id = requested_form_instance_id
      and fi.organization_id = requested_organization_id
      and (fi.training_event_id is null or tev.training_event_id is not null)
      and (
        not coalesce(tev.covert, false)
        or app.has_scoped_permission(
          'no_notice:' || case
            when requested_permission like '%:write' then 'write'
            else 'read'
          end,
          requested_organization_id,
          prl.fleet_id,
          tev.location_base_id,
          prl.program_id
        )
      )
      and (
        app.has_permission(requested_permission, requested_organization_id)
        or app.has_scoped_permission(
          requested_permission,
          requested_organization_id,
          prl.fleet_id,
          tev.location_base_id,
          prl.program_id
        )
      )
  )
$$;

create or replace function app.can_access_requirement(
  requested_permission text,
  requested_organization_id uuid,
  requested_requirement_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, app
as $$
  select
    app.has_permission(requested_permission, requested_organization_id)
    or exists (
      select 1
      from app.requirement_versions rv
      where rv.requirement_id = requested_requirement_id
        and rv.organization_id = requested_organization_id
        and rv.superseded_at is null
        and app.has_scoped_permission(
          requested_permission,
          requested_organization_id,
          rv.fleet_id,
          null,
          rv.program_id
        )
    )
$$;

create or replace function app.can_access_task(
  requested_permission text,
  requested_organization_id uuid,
  requested_task_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, app
as $$
  select
    app.has_permission(requested_permission, requested_organization_id)
    or exists (
      select 1
      from app.curriculum_task_allocations cta
      join app.curriculum_versions cv on cv.id = cta.curriculum_version_id
      where cta.task_id = requested_task_id
        and cta.organization_id = requested_organization_id
        and app.can_access_curriculum(
          requested_permission,
          requested_organization_id,
          cv.curriculum_id
        )
    )
$$;

create or replace function app.can_access_form_definition(
  requested_permission text,
  requested_organization_id uuid,
  requested_form_definition_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, app
as $$
  select
    app.has_permission(requested_permission, requested_organization_id)
    or exists (
      select 1
      from app.form_bindings fb
      join app.form_binding_versions fbv on fbv.form_binding_id = fb.id
      where fb.form_definition_id = requested_form_definition_id
        and fb.organization_id = requested_organization_id
        and fbv.organization_id = requested_organization_id
        and fbv.superseded_at is null
        and app.has_scoped_permission(
          requested_permission,
          requested_organization_id,
          fbv.fleet_id,
          null,
          fbv.program_id
        )
  )
$$;

create or replace function app.can_access_program_override(
  requested_permission text,
  requested_organization_id uuid,
  requested_override_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, app
as $$
  select
    app.has_permission(requested_permission, requested_organization_id)
    or exists (
      select 1
      from app.program_assignment_overrides pao
      join app.program_assignment_override_versions paov
        on paov.override_id = pao.id
       and paov.organization_id = pao.organization_id
      where pao.id = requested_override_id
        and pao.organization_id = requested_organization_id
        and paov.superseded_at is null
        and app.has_scoped_permission(
          requested_permission,
          requested_organization_id,
          pao.fleet_id,
          null,
          paov.program_id
        )
    )
$$;

create or replace function app.record_qualification_outcome_and_enqueue(
  p_organization_id uuid,
  p_person_id uuid,
  p_requirement_id uuid,
  p_source_form_instance_id uuid,
  p_source_form_revision_id uuid,
  p_source_event_id uuid,
  p_outcome_type text,
  p_effective_at timestamptz,
  p_expires_at timestamptz,
  p_outcome_payload jsonb,
  p_rule_version_id uuid,
  p_idempotency_key uuid
)
returns uuid
language plpgsql
security definer
set search_path = pg_catalog, app, integration
as $$
declare
  outcome_id uuid;
  existing app.qualification_outcome_events%rowtype;
begin
  if not app.can_access_requirement(
    'qualification:write',
    p_organization_id,
    p_requirement_id
  ) then
    raise exception 'qualification:write permission is required for this requirement scope'
      using errcode = '42501';
  end if;

  if p_source_form_instance_id is not null
     and not app.can_access_form(
       'records:write',
       p_organization_id,
       p_source_form_instance_id
     ) then
    raise exception 'records:write permission is required for the source form scope'
      using errcode = '42501';
  end if;

  insert into app.qualification_outcome_events (
    organization_id, person_id, requirement_id, source_form_instance_id,
    source_form_revision_id, source_event_id, outcome_type, effective_at,
    expires_at, outcome_payload, rule_version_id, idempotency_key, recorded_by
  )
  values (
    p_organization_id, p_person_id, p_requirement_id, p_source_form_instance_id,
    p_source_form_revision_id, p_source_event_id, p_outcome_type, p_effective_at,
    p_expires_at, p_outcome_payload, p_rule_version_id, p_idempotency_key,
    app.current_user_id()
  )
  on conflict (organization_id, idempotency_key) do nothing
  returning id into outcome_id;

  if outcome_id is null then
    select *
      into existing
    from app.qualification_outcome_events qoe
    where qoe.organization_id = p_organization_id
      and qoe.idempotency_key = p_idempotency_key;

    if existing.id is null then
      raise exception 'idempotent qualification outcome could not be loaded';
    end if;

    if existing.person_id <> p_person_id
       or existing.requirement_id <> p_requirement_id
       or existing.outcome_type <> p_outcome_type
       or existing.effective_at <> p_effective_at
       or existing.outcome_payload <> p_outcome_payload then
      raise exception 'idempotency key was previously used for a different qualification outcome'
        using errcode = '23505';
    end if;

    outcome_id := existing.id;
  end if;

  perform integration.enqueue_outbox(
    p_organization_id,
    'qualification',
    outcome_id,
    'qualification.' || lower(p_outcome_type) || '.v1',
    jsonb_build_object(
      'outcomeEventId', outcome_id,
      'personId', p_person_id,
      'requirementId', p_requirement_id,
      'effectiveAt', p_effective_at
    ) || p_outcome_payload,
    p_idempotency_key,
    jsonb_build_object('schemaVersion', 1)
  );

  return outcome_id;
end;
$$;

-- Add scoped policies alongside existing global policies. PostgreSQL combines
-- permissive policies with OR; has_permission now recognizes only exact global
-- assignments, while these policies authorize only a matching row scope.
create policy fleets_scoped_select on app.fleets
for select using (
  app.has_scoped_permission('org:read', organization_id, id, null, null)
);
create policy fleets_scoped_write on app.fleets
for all using (
  app.has_scoped_permission('org:write', organization_id, id, null, null)
) with check (
  app.has_scoped_permission('org:write', organization_id, id, null, null)
);

create policy bases_scoped_select on app.bases
for select using (
  app.has_scoped_permission('org:read', organization_id, null, id, null)
);
create policy bases_scoped_write on app.bases
for all using (
  app.has_scoped_permission('org:write', organization_id, null, id, null)
) with check (
  app.has_scoped_permission('org:write', organization_id, null, id, null)
);

create policy training_devices_scoped_select on app.training_devices
for select using (
  app.has_scoped_permission('org:read', organization_id, fleet_id, location_base_id, null)
);
create policy training_devices_scoped_write on app.training_devices
for all using (
  app.has_scoped_permission('org:write', organization_id, fleet_id, location_base_id, null)
) with check (
  app.has_scoped_permission('org:write', organization_id, fleet_id, location_base_id, null)
);

create policy training_device_versions_scoped_select
on app.training_device_versions for select
using (
  exists (
    select 1 from app.training_devices td
    where td.id = training_device_versions.training_device_id
      and td.organization_id = training_device_versions.organization_id
      and app.has_scoped_permission(
        'org:read',
        training_device_versions.organization_id,
        td.fleet_id,
        td.location_base_id,
        null
      )
  )
);
create policy training_device_versions_scoped_write
on app.training_device_versions for all
using (
  exists (
    select 1 from app.training_devices td
    where td.id = training_device_versions.training_device_id
      and td.organization_id = training_device_versions.organization_id
      and app.has_scoped_permission(
        'org:write',
        training_device_versions.organization_id,
        td.fleet_id,
        td.location_base_id,
        null
      )
  )
) with check (
  exists (
    select 1 from app.training_devices td
    where td.id = training_device_versions.training_device_id
      and td.organization_id = training_device_versions.organization_id
      and app.has_scoped_permission(
        'org:write',
        training_device_versions.organization_id,
        td.fleet_id,
        td.location_base_id,
        null
      )
  )
);

create policy people_scoped_select on app.people
for select using (app.can_access_person('people:read', organization_id, id));
create policy people_scoped_write on app.people
for all using (app.can_access_person('people:write', organization_id, id))
with check (app.can_access_person('people:write', organization_id, id));

create policy person_sensitive_profiles_scoped_select
on app.person_sensitive_profiles for select
using (
  app.can_access_person(
    'people:sensitive:read', organization_id, person_id
  )
);
create policy person_sensitive_profiles_scoped_write
on app.person_sensitive_profiles for all
using (
  app.can_access_person(
    'people:sensitive:write', organization_id, person_id
  )
) with check (
  app.can_access_person(
    'people:sensitive:write', organization_id, person_id
  )
);

do $$
declare
  policy_target record;
begin
  for policy_target in
    select * from (values
      ('person_external_identifiers', 'person_id'),
      ('person_versions', 'person_id'),
      ('instructor_authorizations', 'person_id')
    ) as targets(table_name, person_column)
  loop
    execute format(
      'create policy %I on app.%I for select using
       (app.can_access_person(''people:read'', organization_id, %I))',
      policy_target.table_name || '_scoped_select',
      policy_target.table_name,
      policy_target.person_column
    );
    execute format(
      'create policy %I on app.%I for all using
       (app.can_access_person(''people:write'', organization_id, %I))
       with check (app.can_access_person(''people:write'', organization_id, %I))',
      policy_target.table_name || '_scoped_write',
      policy_target.table_name,
      policy_target.person_column,
      policy_target.person_column
    );
  end loop;
end;
$$;

create policy positions_scoped_select on app.positions
for select using (app.can_access_person('people:read', organization_id, person_id));
create policy positions_scoped_write on app.positions
for all using (app.can_access_person('people:write', organization_id, person_id))
with check (app.can_access_person('people:write', organization_id, person_id));

create policy position_versions_scoped_select on app.position_versions
for select using (app.can_access_position('people:read', organization_id, position_id));
create policy position_versions_scoped_write on app.position_versions
for all using (app.can_access_position('people:write', organization_id, position_id))
with check (app.can_access_position('people:write', organization_id, position_id));

create policy instructor_authorization_versions_scoped_select
on app.instructor_authorization_versions for select
using (
  app.has_scoped_permission(
    'people:read', organization_id, fleet_id, null, program_id
  )
);
create policy instructor_authorization_versions_scoped_write
on app.instructor_authorization_versions for all
using (
  app.has_scoped_permission(
    'people:write', organization_id, fleet_id, null, program_id
  )
) with check (
  app.has_scoped_permission(
    'people:write', organization_id, fleet_id, null, program_id
  )
);

create policy programs_scoped_select on app.programs
for select using (
  app.has_scoped_permission('program:read', organization_id, null, null, id)
);
create policy programs_scoped_write on app.programs
for all using (
  app.has_scoped_permission('program:write', organization_id, null, null, id)
) with check (
  app.has_scoped_permission('program:write', organization_id, null, null, id)
);

create policy program_versions_scoped_select on app.program_versions
for select using (
  app.has_scoped_permission('program:read', organization_id, null, null, program_id)
);
create policy program_versions_scoped_write on app.program_versions
for all using (
  app.has_scoped_permission('program:write', organization_id, null, null, program_id)
) with check (
  app.has_scoped_permission('program:write', organization_id, null, null, program_id)
);

create policy program_transition_rules_scoped_select on app.program_transition_rules
for select using (
  app.has_scoped_permission(
    'program:read', organization_id, fleet_id, null, target_program_id
  )
);
create policy program_transition_rules_scoped_write on app.program_transition_rules
for all using (
  app.has_scoped_permission(
    'program:write', organization_id, fleet_id, null, target_program_id
  )
) with check (
  app.has_scoped_permission(
    'program:write', organization_id, fleet_id, null, target_program_id
  )
);

create policy program_transition_rule_versions_scoped_select
on app.program_transition_rule_versions for select
using (
  exists (
    select 1 from app.program_transition_rules ptr
    where ptr.id = program_transition_rule_versions.transition_rule_id
      and ptr.organization_id = program_transition_rule_versions.organization_id
      and app.has_scoped_permission(
        'program:read',
        program_transition_rule_versions.organization_id,
        ptr.fleet_id,
        null,
        ptr.target_program_id
      )
  )
);
create policy program_transition_rule_versions_scoped_write
on app.program_transition_rule_versions for all
using (
  exists (
    select 1 from app.program_transition_rules ptr
    where ptr.id = program_transition_rule_versions.transition_rule_id
      and ptr.organization_id = program_transition_rule_versions.organization_id
      and app.has_scoped_permission(
        'program:write',
        program_transition_rule_versions.organization_id,
        ptr.fleet_id,
        null,
        ptr.target_program_id
      )
  )
) with check (
  exists (
    select 1 from app.program_transition_rules ptr
    where ptr.id = program_transition_rule_versions.transition_rule_id
      and ptr.organization_id = program_transition_rule_versions.organization_id
      and app.has_scoped_permission(
        'program:write',
        program_transition_rule_versions.organization_id,
        ptr.fleet_id,
        null,
        ptr.target_program_id
      )
  )
);

create policy program_assignment_overrides_scoped_select
on app.program_assignment_overrides for select
using (
  app.can_access_program_override(
    'program:read',
    organization_id,
    id
  )
);
create policy program_assignment_overrides_scoped_write
on app.program_assignment_overrides for all
using (
  app.can_access_program_override(
    'program:write',
    organization_id,
    id
  )
) with check (
  app.can_access_program_override(
    'program:write',
    organization_id,
    id
  )
);

create policy program_assignment_override_versions_scoped_select
on app.program_assignment_override_versions for select
using (
  app.can_access_program_override(
    'program:read',
    organization_id,
    override_id
  )
);
create policy program_assignment_override_versions_scoped_write
on app.program_assignment_override_versions for all
using (
  app.can_access_program_override(
    'program:write',
    organization_id,
    override_id
  )
) with check (
  app.can_access_program_override(
    'program:write',
    organization_id,
    override_id
  )
);

create policy curricula_scoped_select on app.curricula
for select using (
  app.has_scoped_permission('program:read', organization_id, fleet_id, null, program_id)
);
create policy curricula_scoped_write on app.curricula
for all using (
  app.has_scoped_permission('program:write', organization_id, fleet_id, null, program_id)
) with check (
  app.has_scoped_permission('program:write', organization_id, fleet_id, null, program_id)
);

create policy curriculum_versions_scoped_select on app.curriculum_versions
for select using (
  app.can_access_curriculum('program:read', organization_id, curriculum_id)
);
create policy curriculum_versions_scoped_write on app.curriculum_versions
for all using (
  app.can_access_curriculum('program:write', organization_id, curriculum_id)
) with check (
  app.can_access_curriculum('program:write', organization_id, curriculum_id)
);

create policy curriculum_nodes_scoped_select on app.curriculum_nodes
for select using (
  app.can_access_curriculum('program:read', organization_id, curriculum_id)
);
create policy curriculum_nodes_scoped_write on app.curriculum_nodes
for all using (
  app.can_access_curriculum('program:write', organization_id, curriculum_id)
) with check (
  app.can_access_curriculum('program:write', organization_id, curriculum_id)
);

create policy curriculum_node_versions_scoped_select on app.curriculum_node_versions
for select using (
  app.can_access_curriculum_version(
    'program:read', organization_id, curriculum_version_id
  )
);
create policy curriculum_node_versions_scoped_write on app.curriculum_node_versions
for all using (
  app.can_access_curriculum_version(
    'program:write', organization_id, curriculum_version_id
  )
) with check (
  app.can_access_curriculum_version(
    'program:write', organization_id, curriculum_version_id
  )
);

create policy curriculum_task_allocations_scoped_select
on app.curriculum_task_allocations for select
using (
  app.can_access_curriculum_version(
    'program:read', organization_id, curriculum_version_id
  )
);
create policy curriculum_task_allocations_scoped_write
on app.curriculum_task_allocations for all
using (
  app.can_access_curriculum_version(
    'program:write', organization_id, curriculum_version_id
  )
) with check (
  app.can_access_curriculum_version(
    'program:write', organization_id, curriculum_version_id
  )
);

create policy tasks_scoped_select on app.tasks
for select using (app.can_access_task('program:read', organization_id, id));
create policy tasks_scoped_write on app.tasks
for all using (app.can_access_task('program:write', organization_id, id))
with check (app.can_access_task('program:write', organization_id, id));

create policy task_versions_scoped_select on app.task_versions
for select using (app.can_access_task('program:read', organization_id, task_id));
create policy task_versions_scoped_write on app.task_versions
for all using (app.can_access_task('program:write', organization_id, task_id))
with check (app.can_access_task('program:write', organization_id, task_id));

create policy form_definitions_scoped_select on app.form_definitions
for select using (
  app.can_access_form_definition('program:read', organization_id, id)
);
create policy form_definitions_scoped_write on app.form_definitions
for all using (
  app.can_access_form_definition('program:write', organization_id, id)
) with check (
  app.can_access_form_definition('program:write', organization_id, id)
);

create policy form_definition_versions_scoped_select
on app.form_definition_versions for select
using (
  app.can_access_form_definition(
    'program:read', organization_id, form_definition_id
  )
);
create policy form_definition_versions_scoped_write
on app.form_definition_versions for all
using (
  app.can_access_form_definition(
    'program:write', organization_id, form_definition_id
  )
) with check (
  app.can_access_form_definition(
    'program:write', organization_id, form_definition_id
  )
);

create policy form_bindings_scoped_select on app.form_bindings
for select using (
  exists (
    select 1 from app.form_binding_versions fbv
    where fbv.form_binding_id = form_bindings.id
      and fbv.organization_id = form_bindings.organization_id
      and fbv.superseded_at is null
      and app.has_scoped_permission(
        'program:read',
        form_bindings.organization_id,
        fbv.fleet_id,
        null,
        fbv.program_id
      )
  )
);
create policy form_bindings_scoped_write on app.form_bindings
for all using (
  exists (
    select 1 from app.form_binding_versions fbv
    where fbv.form_binding_id = form_bindings.id
      and fbv.organization_id = form_bindings.organization_id
      and fbv.superseded_at is null
      and app.has_scoped_permission(
        'program:write',
        form_bindings.organization_id,
        fbv.fleet_id,
        null,
        fbv.program_id
      )
  )
) with check (
  exists (
    select 1 from app.form_binding_versions fbv
    where fbv.form_binding_id = form_bindings.id
      and fbv.organization_id = form_bindings.organization_id
      and fbv.superseded_at is null
      and app.has_scoped_permission(
        'program:write',
        form_bindings.organization_id,
        fbv.fleet_id,
        null,
        fbv.program_id
      )
  )
);

create policy form_binding_versions_scoped_select
on app.form_binding_versions for select
using (
  app.has_scoped_permission(
    'program:read', organization_id, fleet_id, null, program_id
  )
);
create policy form_binding_versions_scoped_write
on app.form_binding_versions for all
using (
  app.has_scoped_permission(
    'program:write', organization_id, fleet_id, null, program_id
  )
) with check (
  app.has_scoped_permission(
    'program:write', organization_id, fleet_id, null, program_id
  )
);

create policy program_resolution_log_scoped_select
on app.program_resolution_log for select
using (
  app.has_scoped_permission(
    'program:read', organization_id, fleet_id, null, program_id
  )
);
create policy program_resolution_log_scoped_write
on app.program_resolution_log for all
using (
  app.has_scoped_permission(
    'program:write', organization_id, fleet_id, null, program_id
  )
) with check (
  app.has_scoped_permission(
    'program:write', organization_id, fleet_id, null, program_id
  )
);

create policy requirements_scoped_select on app.requirements
for select using (
  app.can_access_requirement('program:read', organization_id, id)
);
create policy requirements_scoped_write on app.requirements
for all using (
  app.can_access_requirement('program:write', organization_id, id)
) with check (
  app.can_access_requirement('program:write', organization_id, id)
);

create policy requirement_versions_scoped_select on app.requirement_versions
for select using (
  app.has_scoped_permission(
    'program:read', organization_id, fleet_id, null, program_id
  )
);
create policy requirement_versions_scoped_write on app.requirement_versions
for all using (
  app.has_scoped_permission(
    'program:write', organization_id, fleet_id, null, program_id
  )
) with check (
  app.has_scoped_permission(
    'program:write', organization_id, fleet_id, null, program_id
  )
);

create policy training_events_scoped_select on app.training_events
for select using (app.can_access_event('records:read', organization_id, id));
create policy training_events_scoped_write on app.training_events
for all using (app.can_access_event('records:write', organization_id, id))
with check (app.can_access_event('records:write', organization_id, id));

create policy training_event_versions_scoped_select
on app.training_event_versions for select
using (
  (
    not covert
    or app.has_scoped_permission(
      'no_notice:read', organization_id, fleet_id, location_base_id, program_id
    )
  )
  and app.has_scoped_permission(
    'records:read', organization_id, fleet_id, location_base_id, program_id
  )
);
create policy training_event_versions_scoped_write
on app.training_event_versions for all
using (
  (
    not covert
    or app.has_scoped_permission(
      'no_notice:write', organization_id, fleet_id, location_base_id, program_id
    )
  )
  and app.has_scoped_permission(
    'records:write', organization_id, fleet_id, location_base_id, program_id
  )
) with check (
  (
    not covert
    or app.has_scoped_permission(
      'no_notice:write', organization_id, fleet_id, location_base_id, program_id
    )
  )
  and app.has_scoped_permission(
    'records:write', organization_id, fleet_id, location_base_id, program_id
  )
);

create policy event_participants_scoped_select on app.event_participants
for select using (
  app.can_access_event('records:read', organization_id, training_event_id)
);
create policy event_participants_scoped_write on app.event_participants
for all using (
  app.can_access_event('records:write', organization_id, training_event_id)
) with check (
  app.can_access_event('records:write', organization_id, training_event_id)
);

create policy event_participant_versions_scoped_select
on app.event_participant_versions for select
using (
  exists (
    select 1 from app.event_participants ep
    where ep.id = event_participant_versions.event_participant_id
      and ep.organization_id = event_participant_versions.organization_id
      and app.can_access_event(
        'records:read',
        event_participant_versions.organization_id,
        ep.training_event_id
      )
  )
);
create policy event_participant_versions_scoped_write
on app.event_participant_versions for all
using (
  exists (
    select 1 from app.event_participants ep
    where ep.id = event_participant_versions.event_participant_id
      and ep.organization_id = event_participant_versions.organization_id
      and app.can_access_event(
        'records:write',
        event_participant_versions.organization_id,
        ep.training_event_id
      )
  )
) with check (
  exists (
    select 1 from app.event_participants ep
    where ep.id = event_participant_versions.event_participant_id
      and ep.organization_id = event_participant_versions.organization_id
      and app.can_access_event(
        'records:write',
        event_participant_versions.organization_id,
        ep.training_event_id
      )
  )
);

create policy device_serviceability_checks_scoped_select
on app.device_serviceability_checks for select
using (
  app.can_access_event('records:read', organization_id, training_event_id)
);
create policy device_serviceability_checks_scoped_write
on app.device_serviceability_checks for all
using (
  app.can_access_event('records:write', organization_id, training_event_id)
) with check (
  app.can_access_event('records:write', organization_id, training_event_id)
);

create policy form_instances_scoped_select on app.form_instances
for select using (app.can_access_form('records:read', organization_id, id));
create policy form_instances_scoped_write on app.form_instances
for all using (app.can_access_form('records:write', organization_id, id))
with check (app.can_access_form('records:write', organization_id, id));

do $$
declare
  policy_target text;
begin
  foreach policy_target in array array[
    'form_instance_revisions',
    'form_instance_state_events',
    'form_subjects',
    'grading_attempts',
    'signatures',
    'form_amendments'
  ]
  loop
    execute format(
      'create policy %I on app.%I for select using
       (app.can_access_form(''records:read'', organization_id, form_instance_id))',
      policy_target || '_scoped_select',
      policy_target
    );
    execute format(
      'create policy %I on app.%I for all using
       (app.can_access_form(''records:write'', organization_id, form_instance_id))
       with check (
         app.can_access_form(''records:write'', organization_id, form_instance_id)
       )',
      policy_target || '_scoped_write',
      policy_target
    );
  end loop;
end;
$$;

create policy grades_scoped_select on app.grades
for select using (
  exists (
    select 1 from app.grading_attempts ga
    where ga.id = grades.grading_attempt_id
      and ga.organization_id = grades.organization_id
      and app.can_access_form(
        'records:read', grades.organization_id, ga.form_instance_id
      )
  )
);
create policy grades_scoped_write on app.grades
for all using (
  exists (
    select 1 from app.grading_attempts ga
    where ga.id = grades.grading_attempt_id
      and ga.organization_id = grades.organization_id
      and app.can_access_form(
        'records:write', grades.organization_id, ga.form_instance_id
      )
  )
) with check (
  exists (
    select 1 from app.grading_attempts ga
    where ga.id = grades.grading_attempt_id
      and ga.organization_id = grades.organization_id
      and app.can_access_form(
        'records:write', grades.organization_id, ga.form_instance_id
      )
  )
);

create policy signature_revocations_scoped_select
on app.signature_revocations for select
using (
  exists (
    select 1 from app.signatures s
    where s.id = signature_revocations.signature_id
      and s.organization_id = signature_revocations.organization_id
      and app.can_access_form(
        'records:read',
        signature_revocations.organization_id,
        s.form_instance_id
      )
  )
);
create policy signature_revocations_scoped_insert
on app.signature_revocations for insert
with check (
  exists (
    select 1 from app.signatures s
    where s.id = signature_revocations.signature_id
      and s.organization_id = signature_revocations.organization_id
      and app.can_access_form(
        'records:write',
        signature_revocations.organization_id,
        s.form_instance_id
      )
  )
);

-- Replace the earlier broad record policies. The scoped policies above also
-- accept exact global assignments, but preserve covert-event gates.
do $$
declare
  policy_target text;
begin
  foreach policy_target in array array[
    'training_events',
    'training_event_versions',
    'event_participants',
    'event_participant_versions',
    'device_serviceability_checks',
    'form_instances',
    'form_instance_revisions',
    'form_instance_state_events',
    'form_subjects',
    'grading_attempts',
    'grades',
    'signatures',
    'signature_revocations',
    'form_amendments'
  ]
  loop
    execute format(
      'drop policy if exists %I on app.%I',
      policy_target || '_select',
      policy_target
    );
    execute format(
      'drop policy if exists %I on app.%I',
      policy_target || '_write',
      policy_target
    );
  end loop;
end;
$$;

create policy record_attachments_scoped_select on app.record_attachments
for select using (
  (
    form_instance_id is not null
    and app.can_access_form(
      'records:read', organization_id, form_instance_id
    )
  )
  or (
    form_instance_id is null
    and person_id is not null
    and app.can_access_person(
      'records:read', organization_id, person_id
    )
  )
);
create policy record_attachments_scoped_insert on app.record_attachments
for insert with check (
  (
    form_instance_id is not null
    and app.can_access_form(
      'records:write', organization_id, form_instance_id
    )
  )
  or (
    form_instance_id is null
    and person_id is not null
    and app.can_access_person(
      'records:write', organization_id, person_id
    )
  )
);

do $$
declare
  policy_target text;
begin
  foreach policy_target in array array[
    'qualification_outcome_events',
    'qualification_projections',
    'qualification_exceptions'
  ]
  loop
    execute format(
      'create policy %I on app.%I for select using
       (app.can_access_requirement(
         ''qualification:read'', organization_id, requirement_id
       ))',
      policy_target || '_scoped_select',
      policy_target
    );
    execute format(
      'create policy %I on app.%I for all using
       (app.can_access_requirement(
         ''qualification:write'', organization_id, requirement_id
       ))
       with check (
         app.can_access_requirement(
           ''qualification:write'', organization_id, requirement_id
         )
       )',
      policy_target || '_scoped_write',
      policy_target
    );
  end loop;
end;
$$;

create policy no_notice_programs_scoped_select on app.no_notice_programs
for select using (
  app.has_scoped_permission(
    'no_notice:read', organization_id, fleet_id, null, null
  )
);
create policy no_notice_programs_scoped_write on app.no_notice_programs
for all using (
  app.has_scoped_permission(
    'no_notice:write', organization_id, fleet_id, null, null
  )
) with check (
  app.has_scoped_permission(
    'no_notice:write', organization_id, fleet_id, null, null
  )
);

create policy no_notice_assignments_scoped_select on app.no_notice_assignments
for select using (
  exists (
    select 1 from app.no_notice_programs nnp
    where nnp.id = no_notice_assignments.no_notice_program_id
      and nnp.organization_id = no_notice_assignments.organization_id
      and app.has_scoped_permission(
        'no_notice:read',
        no_notice_assignments.organization_id,
        nnp.fleet_id,
        null,
        null
      )
  )
);
create policy no_notice_assignments_scoped_write on app.no_notice_assignments
for all using (
  exists (
    select 1 from app.no_notice_programs nnp
    where nnp.id = no_notice_assignments.no_notice_program_id
      and nnp.organization_id = no_notice_assignments.organization_id
      and app.has_scoped_permission(
        'no_notice:write',
        no_notice_assignments.organization_id,
        nnp.fleet_id,
        null,
        null
      )
  )
) with check (
  exists (
    select 1 from app.no_notice_programs nnp
    where nnp.id = no_notice_assignments.no_notice_program_id
      and nnp.organization_id = no_notice_assignments.organization_id
      and app.has_scoped_permission(
        'no_notice:write',
        no_notice_assignments.organization_id,
        nnp.fleet_id,
        null,
        null
      )
  )
);

create policy no_notice_evaluations_scoped_select on app.no_notice_evaluations
for select using (
  exists (
    select 1
    from app.no_notice_assignments nna
    join app.no_notice_programs nnp on nnp.id = nna.no_notice_program_id
    where nna.id = no_notice_evaluations.no_notice_assignment_id
      and nna.organization_id = no_notice_evaluations.organization_id
      and nnp.organization_id = no_notice_evaluations.organization_id
      and app.has_scoped_permission(
        'no_notice:read',
        no_notice_evaluations.organization_id,
        nnp.fleet_id,
        null,
        null
      )
  )
);
create policy no_notice_evaluations_scoped_write on app.no_notice_evaluations
for all using (
  exists (
    select 1
    from app.no_notice_assignments nna
    join app.no_notice_programs nnp on nnp.id = nna.no_notice_program_id
    where nna.id = no_notice_evaluations.no_notice_assignment_id
      and nna.organization_id = no_notice_evaluations.organization_id
      and nnp.organization_id = no_notice_evaluations.organization_id
      and app.has_scoped_permission(
        'no_notice:write',
        no_notice_evaluations.organization_id,
        nnp.fleet_id,
        null,
        null
      )
  )
) with check (
  exists (
    select 1
    from app.no_notice_assignments nna
    join app.no_notice_programs nnp on nnp.id = nna.no_notice_program_id
    where nna.id = no_notice_evaluations.no_notice_assignment_id
      and nna.organization_id = no_notice_evaluations.organization_id
      and nnp.organization_id = no_notice_evaluations.organization_id
      and app.has_scoped_permission(
        'no_notice:write',
        no_notice_evaluations.organization_id,
        nnp.fleet_id,
        null,
        null
      )
  )
);

do $$
declare
  policy_target record;
begin
  for policy_target in
    select * from (values
      ('special_tracking_enrollments', 'person_id'),
      ('remediation_plans', 'person_id'),
      ('trb_cases', 'person_id')
    ) as targets(table_name, person_column)
  loop
    execute format(
      'create policy %I on app.%I for select using
       (app.can_access_person(
         ''special_tracking:read'', organization_id, %I
       ))',
      policy_target.table_name || '_scoped_select',
      policy_target.table_name,
      policy_target.person_column
    );
    execute format(
      'create policy %I on app.%I for all using
       (app.can_access_person(
         ''special_tracking:write'', organization_id, %I
       ))
       with check (
         app.can_access_person(
           ''special_tracking:write'', organization_id, %I
         )
       )',
      policy_target.table_name || '_scoped_write',
      policy_target.table_name,
      policy_target.person_column,
      policy_target.person_column
    );
  end loop;
end;
$$;

create policy special_tracking_criterion_events_scoped_select
on app.special_tracking_criterion_events for select
using (
  exists (
    select 1 from app.special_tracking_enrollments ste
    where ste.id = special_tracking_criterion_events.special_tracking_enrollment_id
      and ste.organization_id = special_tracking_criterion_events.organization_id
      and app.can_access_person(
        'special_tracking:read',
        special_tracking_criterion_events.organization_id,
        ste.person_id
      )
  )
);
create policy special_tracking_criterion_events_scoped_write
on app.special_tracking_criterion_events for all
using (
  exists (
    select 1 from app.special_tracking_enrollments ste
    where ste.id = special_tracking_criterion_events.special_tracking_enrollment_id
      and ste.organization_id = special_tracking_criterion_events.organization_id
      and app.can_access_person(
        'special_tracking:write',
        special_tracking_criterion_events.organization_id,
        ste.person_id
      )
  )
) with check (
  exists (
    select 1 from app.special_tracking_enrollments ste
    where ste.id = special_tracking_criterion_events.special_tracking_enrollment_id
      and ste.organization_id = special_tracking_criterion_events.organization_id
      and app.can_access_person(
        'special_tracking:write',
        special_tracking_criterion_events.organization_id,
        ste.person_id
      )
  )
);

create policy special_tracking_exit_event_sets_scoped_select
on app.special_tracking_exit_event_sets for select
using (
  exists (
    select 1 from app.special_tracking_enrollments ste
    where ste.id = special_tracking_exit_event_sets.special_tracking_enrollment_id
      and ste.organization_id = special_tracking_exit_event_sets.organization_id
      and app.can_access_person(
        'special_tracking:read',
        special_tracking_exit_event_sets.organization_id,
        ste.person_id
      )
  )
);
create policy special_tracking_exit_event_sets_scoped_write
on app.special_tracking_exit_event_sets for all
using (
  exists (
    select 1 from app.special_tracking_enrollments ste
    where ste.id = special_tracking_exit_event_sets.special_tracking_enrollment_id
      and ste.organization_id = special_tracking_exit_event_sets.organization_id
      and app.can_access_person(
        'special_tracking:write',
        special_tracking_exit_event_sets.organization_id,
        ste.person_id
      )
  )
) with check (
  exists (
    select 1 from app.special_tracking_enrollments ste
    where ste.id = special_tracking_exit_event_sets.special_tracking_enrollment_id
      and ste.organization_id = special_tracking_exit_event_sets.organization_id
      and app.can_access_person(
        'special_tracking:write',
        special_tracking_exit_event_sets.organization_id,
        ste.person_id
      )
  )
);

create policy trb_decisions_scoped_select on app.trb_decisions
for select using (
  exists (
    select 1 from app.trb_cases tc
    where tc.id = trb_decisions.trb_case_id
      and tc.organization_id = trb_decisions.organization_id
      and app.can_access_person(
        'special_tracking:read', trb_decisions.organization_id, tc.person_id
      )
  )
);
create policy trb_decisions_scoped_write on app.trb_decisions
for all using (
  exists (
    select 1 from app.trb_cases tc
    where tc.id = trb_decisions.trb_case_id
      and tc.organization_id = trb_decisions.organization_id
      and app.can_access_person(
        'special_tracking:write', trb_decisions.organization_id, tc.person_id
      )
  )
) with check (
  exists (
    select 1 from app.trb_cases tc
    where tc.id = trb_decisions.trb_case_id
      and tc.organization_id = trb_decisions.organization_id
      and app.can_access_person(
        'special_tracking:write', trb_decisions.organization_id, tc.person_id
      )
  )
);

create policy trb_hr_dispositions_scoped_select
on app.trb_hr_dispositions for select
using (
  exists (
    select 1 from app.trb_cases tc
    where tc.id = trb_hr_dispositions.trb_case_id
      and tc.organization_id = trb_hr_dispositions.organization_id
      and app.can_access_person(
        'special_tracking:hr:read',
        trb_hr_dispositions.organization_id,
        tc.person_id
      )
  )
);
create policy trb_hr_dispositions_scoped_write
on app.trb_hr_dispositions for all
using (
  exists (
    select 1 from app.trb_cases tc
    where tc.id = trb_hr_dispositions.trb_case_id
      and tc.organization_id = trb_hr_dispositions.organization_id
      and app.can_access_person(
        'special_tracking:hr:write',
        trb_hr_dispositions.organization_id,
        tc.person_id
      )
  )
) with check (
  exists (
    select 1 from app.trb_cases tc
    where tc.id = trb_hr_dispositions.trb_case_id
      and tc.organization_id = trb_hr_dispositions.organization_id
      and app.can_access_person(
        'special_tracking:hr:write',
        trb_hr_dispositions.organization_id,
        tc.person_id
      )
  )
);

-- Seal retained attachment metadata and amendment links. New scan, hold,
-- disposition, or workflow facts are appended as separate evidence events.
alter table app.record_attachments
  add constraint record_attachments_organization_id_id_key
  unique (organization_id, id);

create table app.record_attachment_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references app.organizations(id),
  record_attachment_id uuid not null,
  event_type text not null check (event_type in (
    'scan_clean', 'scan_quarantined', 'scan_failed',
    'retention_extended', 'legal_hold_applied', 'legal_hold_released',
    'disposition_approved'
  )),
  event_payload jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default statement_timestamp(),
  actor_user_id uuid,
  authority_reference text,
  idempotency_key uuid not null,
  unique (organization_id, idempotency_key),
  foreign key (organization_id, record_attachment_id)
    references app.record_attachments (organization_id, id),
  foreign key (organization_id, actor_user_id)
    references app.user_profiles (organization_id, id)
);

alter table app.record_attachment_events enable row level security;

create policy record_attachment_events_select
on app.record_attachment_events for select
using (
  exists (
    select 1 from app.record_attachments ra
    where ra.id = record_attachment_events.record_attachment_id
      and ra.organization_id = record_attachment_events.organization_id
      and (
        (
          ra.form_instance_id is not null
          and app.can_access_form(
            'records:read',
            record_attachment_events.organization_id,
            ra.form_instance_id
          )
        )
        or (
          ra.form_instance_id is null
          and ra.person_id is not null
          and app.can_access_person(
            'records:read',
            record_attachment_events.organization_id,
            ra.person_id
          )
        )
      )
  )
);

create policy record_attachment_events_insert
on app.record_attachment_events for insert
with check (
  exists (
    select 1 from app.record_attachments ra
    where ra.id = record_attachment_events.record_attachment_id
      and ra.organization_id = record_attachment_events.organization_id
      and (
        (
          ra.form_instance_id is not null
          and app.can_access_form(
            'records:write',
            record_attachment_events.organization_id,
            ra.form_instance_id
          )
        )
        or (
          ra.form_instance_id is null
          and ra.person_id is not null
          and app.can_access_person(
            'records:write',
            record_attachment_events.organization_id,
            ra.person_id
          )
        )
      )
  )
);

create or replace function app.validate_record_attachment_evidence()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, app
as $$
begin
  if new.form_instance_id is null
     and new.person_id is null
     and new.classification <> 'audit' then
    raise exception 'a non-audit attachment must belong to a form or person'
      using errcode = '23514';
  end if;

  if new.form_instance_id is not null
     and not exists (
       select 1 from app.form_instances fi
       where fi.id = new.form_instance_id
         and fi.organization_id = new.organization_id
     ) then
    raise exception 'attachment form must belong to the same organization'
      using errcode = '23514';
  end if;

  if new.person_id is not null
     and not exists (
       select 1 from app.people p
       where p.id = new.person_id
         and p.organization_id = new.organization_id
     ) then
    raise exception 'attachment person must belong to the same organization'
      using errcode = '23514';
  end if;

  if new.created_by is not null
     and not exists (
       select 1 from app.user_profiles up
       where up.id = new.created_by
         and up.organization_id = new.organization_id
     ) then
    raise exception 'attachment creator must belong to the same organization'
      using errcode = '23514';
  end if;

  if split_part(new.object_key, '/', 1) <> new.organization_id::text
     or split_part(new.object_key, '/', 2) <> new.classification then
    raise exception 'attachment object key must begin with organization/classification'
      using errcode = '23514';
  end if;

  if octet_length(new.content_hash) <> 32 then
    raise exception 'attachment content_hash must be a SHA-256 digest'
      using errcode = '23514';
  end if;

  return new;
end;
$$;

create or replace function app.validate_form_amendment_evidence()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, app
as $$
declare
  prior_form_id uuid;
  amended_form_id uuid;
  prior_organization_id uuid;
  amended_organization_id uuid;
begin
  if new.approved_by is null or new.approved_at is null then
    raise exception 'only finalized, approved amendments may enter retained evidence'
      using errcode = '23514';
  end if;

  if new.prior_revision_id = new.amended_revision_id then
    raise exception 'an amendment must reference distinct prior and amended revisions'
      using errcode = '23514';
  end if;

  select fir.form_instance_id, fir.organization_id
    into prior_form_id, prior_organization_id
  from app.form_instance_revisions fir
  where fir.id = new.prior_revision_id;

  select fir.form_instance_id, fir.organization_id
    into amended_form_id, amended_organization_id
  from app.form_instance_revisions fir
  where fir.id = new.amended_revision_id;

  if prior_form_id is null
     or amended_form_id is null
     or prior_form_id <> new.form_instance_id
     or amended_form_id <> new.form_instance_id
     or prior_organization_id <> new.organization_id
     or amended_organization_id <> new.organization_id then
    raise exception 'amendment revisions must belong to the stated form and organization'
      using errcode = '23514';
  end if;

  if not exists (
    select 1 from app.user_profiles up
    where up.id = new.requested_by
      and up.organization_id = new.organization_id
  ) or not exists (
    select 1 from app.user_profiles up
    where up.id = new.approved_by
      and up.organization_id = new.organization_id
  ) then
    raise exception 'amendment requester and approver must belong to the same organization'
      using errcode = '23514';
  end if;

  return new;
end;
$$;

create trigger record_attachments_validate_evidence
before insert on app.record_attachments
for each row execute function app.validate_record_attachment_evidence();

create trigger form_amendments_validate_evidence
before insert on app.form_amendments
for each row execute function app.validate_form_amendment_evidence();

create trigger record_attachments_immutable
before update or delete on app.record_attachments
for each row execute function audit.reject_mutation();

create trigger form_amendments_immutable
before update or delete on app.form_amendments
for each row execute function audit.reject_mutation();

create trigger record_attachment_events_immutable
before update or delete on app.record_attachment_events
for each row execute function audit.reject_mutation();

create trigger record_attachments_audit
after insert or update or delete on app.record_attachments
for each row execute function audit.capture_row_change();

create trigger form_amendments_audit
after insert or update or delete on app.form_amendments
for each row execute function audit.capture_row_change();

create trigger record_attachment_events_audit
after insert or update or delete on app.record_attachment_events
for each row execute function audit.capture_row_change();

create or replace function app.can_access_attachment_values(
  requested_permission text,
  classification_action text,
  requested_organization_id uuid,
  requested_classification text,
  requested_form_instance_id uuid,
  requested_person_id uuid
)
returns boolean
language plpgsql
stable
security definer
set search_path = pg_catalog, app
as $$
declare
  base_allowed boolean;
  classification_permission text;
  classification_allowed boolean;
begin
  if classification_action not in ('read', 'write') then
    return false;
  end if;

  base_allowed := case
    when requested_form_instance_id is not null then
      app.can_access_form(
        requested_permission,
        requested_organization_id,
        requested_form_instance_id
      )
    when requested_person_id is not null then
      app.can_access_person(
        requested_permission,
        requested_organization_id,
        requested_person_id
      )
    else
      app.has_permission(requested_permission, requested_organization_id)
  end;

  if not coalesce(base_allowed, false) then
    return false;
  end if;

  classification_permission := case requested_classification
    when 'sensitive' then 'people:sensitive:' || classification_action
    when 'no-notice' then 'no_notice:' || classification_action
    when 'special-tracking' then 'special_tracking:' || classification_action
    when 'audit' then 'audit:' || classification_action
    when 'records' then null
    else '__deny__'
  end;

  if classification_permission is null then
    return true;
  end if;
  if classification_permission = '__deny__' then
    return false;
  end if;

  classification_allowed := case
    when requested_form_instance_id is not null then
      app.can_access_form(
        classification_permission,
        requested_organization_id,
        requested_form_instance_id
      )
    when requested_person_id is not null then
      app.can_access_person(
        classification_permission,
        requested_organization_id,
        requested_person_id
      )
    else
      app.has_permission(classification_permission, requested_organization_id)
  end;

  return coalesce(classification_allowed, false);
end;
$$;

drop policy if exists record_attachments_select on app.record_attachments;
drop policy if exists record_attachments_write on app.record_attachments;
drop policy if exists record_attachments_scoped_select on app.record_attachments;
drop policy if exists record_attachments_scoped_insert on app.record_attachments;

create policy record_attachments_hardened_select
on app.record_attachments for select
using (
  app.can_access_attachment_values(
    'records:read',
    'read',
    organization_id,
    classification,
    form_instance_id,
    person_id
  )
);

create policy record_attachments_hardened_insert
on app.record_attachments for insert
with check (
  app.can_access_attachment_values(
    'records:write',
    'write',
    organization_id,
    classification,
    form_instance_id,
    person_id
  )
);

drop policy if exists record_attachment_events_select
on app.record_attachment_events;
drop policy if exists record_attachment_events_insert
on app.record_attachment_events;

create policy record_attachment_events_hardened_select
on app.record_attachment_events for select
using (
  exists (
    select 1
    from app.record_attachments ra
    where ra.id = record_attachment_events.record_attachment_id
      and ra.organization_id = record_attachment_events.organization_id
      and app.can_access_attachment_values(
        'records:read',
        'read',
        record_attachment_events.organization_id,
        ra.classification,
        ra.form_instance_id,
        ra.person_id
      )
  )
);

create policy record_attachment_events_hardened_insert
on app.record_attachment_events for insert
with check (
  exists (
    select 1
    from app.record_attachments ra
    where ra.id = record_attachment_events.record_attachment_id
      and ra.organization_id = record_attachment_events.organization_id
      and app.can_access_attachment_values(
        'records:evidence:write',
        'write',
        record_attachment_events.organization_id,
        ra.classification,
        ra.form_instance_id,
        ra.person_id
      )
  )
);

create or replace function app.can_access_storage_object(
  p_bucket_id text,
  p_object_key text,
  p_action text
)
returns boolean
language plpgsql
stable
security definer
set search_path = pg_catalog, app
as $$
declare
  path_organization_id uuid;
  path_classification text;
  attachment app.record_attachments%rowtype;
  base_permission text;
  classification_action text;
  unregistered_permission text;
begin
  if p_bucket_id not in ('atq-records', 'atq-evidence') then
    return false;
  end if;

  begin
    path_organization_id := split_part(p_object_key, '/', 1)::uuid;
  exception when invalid_text_representation then
    return false;
  end;

  if path_organization_id <> app.current_organization_id() then
    return false;
  end if;

  select *
    into attachment
  from app.record_attachments ra
  where ra.bucket_id = p_bucket_id
    and ra.object_key = p_object_key;

  if attachment.id is not null then
    if p_action = 'delete' then
      return false;
    end if;
    base_permission := case
      when p_action = 'read' then 'records:read'
      when p_action = 'write' then 'records:write'
      else '__deny__'
    end;
    classification_action := case
      when p_action = 'read' then 'read'
      when p_action = 'write' then 'write'
      else '__deny__'
    end;

    return app.can_access_attachment_values(
      base_permission,
      classification_action,
      attachment.organization_id,
      attachment.classification,
      attachment.form_instance_id,
      attachment.person_id
    );
  end if;

  -- An unregistered object has no row context, so only an organization-wide
  -- permission can authorize staging or orphan cleanup. Scoped callers use a
  -- server-issued upload URL after the server checks their domain row.
  path_classification := split_part(p_object_key, '/', 2);
  unregistered_permission := case
    when path_classification = 'no-notice' then 'no_notice:' || p_action
    when path_classification = 'special-tracking' then 'special_tracking:' || p_action
    when path_classification = 'sensitive' then 'people:sensitive:' || p_action
    when path_classification = 'audit' then 'audit:' || p_action
    when path_classification = 'records' then 'records:' || p_action
    else '__deny__'
  end;

  return unregistered_permission <> '__deny__'
    and app.has_permission(unregistered_permission, path_organization_id);
end;
$$;

create or replace function app.storage_object_is_retained(
  p_bucket_id text,
  p_object_key text
)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, app
as $$
  select
    p_bucket_id = 'atq-evidence'
    or split_part(p_object_key, '/', 2) = 'audit'
    or exists (
      select 1
      from app.record_attachments ra
      where ra.bucket_id = p_bucket_id
        and ra.object_key = p_object_key
    )
$$;

revoke all on function app.storage_object_is_retained(text, text) from public;

do $$
begin
  if exists (select 1 from pg_roles where rolname = 'authenticated') then
    grant select, insert on app.record_attachment_events to authenticated;
    grant execute on function app.storage_object_is_retained(text, text)
      to authenticated;
  end if;
  if exists (select 1 from pg_roles where rolname = 'service_role') then
    grant all on app.record_attachment_events to service_role;
    grant execute on function app.storage_object_is_retained(text, text)
      to service_role;
  end if;
end;
$$;

do $$
begin
  if to_regclass('storage.objects') is not null then
    execute 'drop policy if exists atq_storage_update on storage.objects';
    execute 'drop policy if exists atq_storage_delete on storage.objects';

    execute $policy$
      create policy atq_storage_update on storage.objects for update
      using (
        app.can_access_storage_object(bucket_id, name, 'write')
        and not app.storage_object_is_retained(bucket_id, name)
      )
      with check (
        app.can_access_storage_object(bucket_id, name, 'write')
        and not app.storage_object_is_retained(bucket_id, name)
      )
    $policy$;

    execute $policy$
      create policy atq_storage_delete on storage.objects for delete
      using (
        app.can_access_storage_object(bucket_id, name, 'delete')
        and not app.storage_object_is_retained(bucket_id, name)
      )
    $policy$;
  end if;
end;
$$;

-- Approved invitation registry. Sign-up remains disabled. A Supabase auth row
-- maps into app.user_profiles only when an unconsumed, approved, unexpired
-- request exists for its normalized email.
create table app.user_provisioning_requests (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references app.organizations(id),
  normalized_email text not null,
  display_name text not null,
  role_id uuid not null,
  scope jsonb not null default '{}'::jsonb
    check (app.valid_permission_scope(scope)),
  identity_provider text not null default 'supabase'
    check (identity_provider in ('supabase')),
  approval_source text not null default 'mapped_security_admin'
    check (approval_source in ('mapped_security_admin', 'operator_bootstrap')),
  requested_by uuid,
  approved_by uuid,
  approved_at timestamptz not null default statement_timestamp(),
  expires_at timestamptz not null,
  authority_reference text not null,
  consumed_at timestamptz,
  auth_subject uuid,
  user_profile_id uuid,
  created_at timestamptz not null default statement_timestamp(),
  check (normalized_email = lower(btrim(normalized_email))),
  check (position('@' in normalized_email) > 1),
  check (btrim(display_name) <> ''),
  check (btrim(authority_reference) <> ''),
  check (expires_at > approved_at),
  check (
    (
      approval_source = 'mapped_security_admin'
      and requested_by is not null
      and approved_by is not null
    )
    or (
      approval_source = 'operator_bootstrap'
      and requested_by is null
      and approved_by is null
    )
  ),
  unique (organization_id, normalized_email, consumed_at),
  foreign key (organization_id, role_id)
    references app.roles (organization_id, id),
  foreign key (organization_id, requested_by)
    references app.user_profiles (organization_id, id),
  foreign key (organization_id, approved_by)
    references app.user_profiles (organization_id, id),
  foreign key (organization_id, user_profile_id)
    references app.user_profiles (organization_id, id)
);

create unique index user_provisioning_one_open_request_uidx
  on app.user_provisioning_requests (normalized_email)
  where consumed_at is null;

create unique index user_provisioning_auth_subject_uidx
  on app.user_provisioning_requests (auth_subject)
  where auth_subject is not null;

alter table app.user_provisioning_requests enable row level security;

create policy user_provisioning_requests_select
on app.user_provisioning_requests for select
using (app.has_permission('security:admin', organization_id));

-- Break the first-administrator circular dependency without widening signup.
-- Only the function owner (SQL operator) and service_role receive EXECUTE.
-- It may create exactly one operator bootstrap request per organization.
create or replace function app.bootstrap_first_security_admin_invitation(
  p_organization_id uuid,
  p_email text,
  p_display_name text,
  p_role_id uuid,
  p_scope jsonb,
  p_expires_at timestamptz,
  p_authority_reference text
)
returns uuid
language plpgsql
security definer
set search_path = pg_catalog, app
as $$
declare
  request_id uuid;
  normalized text := lower(btrim(p_email));
begin
  -- Serialize bootstrap attempts for this organization.
  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(p_organization_id::text, 0)
  );

  if not app.valid_permission_scope(coalesce(p_scope, '{}'::jsonb)) then
    raise exception 'invalid role assignment scope' using errcode = '22023';
  end if;

  if not exists (
    select 1
    from app.roles r
    join app.role_permissions rp on rp.role_id = r.id
    join app.permissions p on p.id = rp.permission_id
    where r.id = p_role_id
      and r.organization_id = p_organization_id
      and p.code = 'security:admin'
  ) then
    raise exception 'bootstrap role must belong to the organization and grant security:admin'
      using errcode = '23514';
  end if;

  if exists (
    select 1
    from app.role_assignments ra
    join app.role_permissions rp on rp.role_id = ra.role_id
    join app.permissions p on p.id = rp.permission_id
    where ra.organization_id = p_organization_id
      and p.code = 'security:admin'
  ) then
    raise exception 'organization already has a security administrator'
      using errcode = '23514';
  end if;

  if exists (
    select 1
    from app.user_provisioning_requests upr
    where upr.organization_id = p_organization_id
      and upr.approval_source = 'operator_bootstrap'
  ) then
    raise exception 'organization already has an operator bootstrap request'
      using errcode = '23514';
  end if;

  insert into app.user_provisioning_requests (
    organization_id, normalized_email, display_name, role_id, scope,
    approval_source, requested_by, approved_by, expires_at,
    authority_reference
  )
  values (
    p_organization_id, normalized, btrim(p_display_name), p_role_id,
    coalesce(p_scope, '{}'::jsonb), 'operator_bootstrap', null, null,
    p_expires_at, p_authority_reference
  )
  returning id into request_id;

  return request_id;
end;
$$;

create or replace function app.approve_user_invitation(
  p_organization_id uuid,
  p_email text,
  p_display_name text,
  p_role_id uuid,
  p_scope jsonb,
  p_expires_at timestamptz,
  p_authority_reference text
)
returns uuid
language plpgsql
security definer
set search_path = pg_catalog, app
as $$
declare
  request_id uuid;
  normalized text := lower(btrim(p_email));
  actor_id uuid := app.current_user_id();
begin
  if not app.has_permission('security:admin', p_organization_id) then
    raise exception 'security:admin permission is required'
      using errcode = '42501';
  end if;

  if actor_id is null then
    raise exception 'an active mapped application user is required'
      using errcode = '42501';
  end if;

  if not app.valid_permission_scope(coalesce(p_scope, '{}'::jsonb)) then
    raise exception 'invalid role assignment scope' using errcode = '22023';
  end if;

  if not exists (
    select 1 from app.roles r
    where r.id = p_role_id
      and r.organization_id = p_organization_id
  ) then
    raise exception 'role does not belong to the requested organization'
      using errcode = '23514';
  end if;

  insert into app.user_provisioning_requests (
    organization_id, normalized_email, display_name, role_id, scope,
    requested_by, approved_by, expires_at, authority_reference
  )
  values (
    p_organization_id, normalized, btrim(p_display_name), p_role_id,
    coalesce(p_scope, '{}'::jsonb), actor_id, actor_id, p_expires_at,
    p_authority_reference
  )
  returning id into request_id;

  return request_id;
end;
$$;

create or replace function app.consume_approved_supabase_invitation(
  p_auth_subject uuid,
  p_email text,
  p_confirmed boolean
)
returns uuid
language plpgsql
security definer
set search_path = pg_catalog, app
as $$
declare
  provision app.user_provisioning_requests%rowtype;
  profile_id uuid;
begin
  if p_auth_subject is null or nullif(lower(btrim(p_email)), '') is null then
    return null;
  end if;

  select up.id
    into profile_id
  from app.user_profiles up
  where up.auth_subject = p_auth_subject;

  if profile_id is not null then
    if p_confirmed then
      update app.user_profiles
      set status = 'active',
          last_authenticated_at = statement_timestamp()
      where id = profile_id
        and status = 'invited';
    end if;
    return profile_id;
  end if;

  select *
    into provision
  from app.user_provisioning_requests upr
  where upr.normalized_email = lower(btrim(p_email))
    and upr.identity_provider = 'supabase'
    and upr.consumed_at is null
    and upr.expires_at > statement_timestamp()
  order by upr.approved_at
  for update skip locked
  limit 1;

  if provision.id is null then
    -- An auth identity without prior approval receives no app profile and
    -- therefore cannot satisfy any ATQ RLS policy.
    return null;
  end if;

  insert into app.user_profiles (
    organization_id, auth_subject, identity_provider, provider_subject,
    display_name, email, status, last_authenticated_at
  )
  values (
    provision.organization_id, p_auth_subject, 'supabase',
    p_auth_subject::text, provision.display_name, provision.normalized_email,
    case when p_confirmed then 'active' else 'invited' end,
    case when p_confirmed then statement_timestamp() else null end
  )
  returning id into profile_id;

  insert into app.role_assignments (
    organization_id, user_profile_id, role_id, scope, valid_from,
    delegated_by, authority_reference
  )
  values (
    provision.organization_id, profile_id, provision.role_id, provision.scope,
    provision.approved_at, provision.approved_by,
    provision.authority_reference
  );

  update app.user_provisioning_requests
  set consumed_at = statement_timestamp(),
      auth_subject = p_auth_subject,
      user_profile_id = profile_id
  where id = provision.id;

  return profile_id;
end;
$$;

create or replace function app.sync_approved_supabase_auth_user()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, app
as $$
begin
  perform app.consume_approved_supabase_invitation(
    new.id,
    new.email,
    new.email_confirmed_at is not null
  );
  return new;
end;
$$;

create trigger user_provisioning_requests_no_delete
before delete on app.user_provisioning_requests
for each row execute function audit.reject_mutation();

create trigger user_provisioning_requests_audit
after insert or update or delete on app.user_provisioning_requests
for each row execute function audit.capture_row_change();

do $$
begin
  if to_regclass('auth.users') is not null then
    execute 'drop trigger if exists atq_sync_approved_user on auth.users';
    execute $trigger$
      create trigger atq_sync_approved_user
      after insert or update of email, email_confirmed_at on auth.users
      for each row execute function app.sync_approved_supabase_auth_user()
    $trigger$;
  end if;
end;
$$;

revoke all on function app.valid_permission_scope(jsonb) from public;
revoke all on function app.has_permission(text, uuid) from public;
revoke all on function app.has_scoped_permission(text, uuid, uuid, uuid, uuid) from public;
revoke all on function app.can_access_person(text, uuid, uuid) from public;
revoke all on function app.can_access_position(text, uuid, uuid) from public;
revoke all on function app.can_access_curriculum(text, uuid, uuid) from public;
revoke all on function app.can_access_curriculum_version(text, uuid, uuid) from public;
revoke all on function app.can_access_event(text, uuid, uuid) from public;
revoke all on function app.can_access_form(text, uuid, uuid) from public;
revoke all on function app.can_access_requirement(text, uuid, uuid) from public;
revoke all on function app.can_access_task(text, uuid, uuid) from public;
revoke all on function app.can_access_form_definition(text, uuid, uuid) from public;
revoke all on function app.can_access_program_override(text, uuid, uuid) from public;
revoke all on function app.can_access_attachment_values(
  text, text, uuid, text, uuid, uuid
) from public;
revoke all on function app.validate_role_permission_organization() from public;
revoke all on function app.validate_record_attachment_evidence() from public;
revoke all on function app.validate_form_amendment_evidence() from public;
revoke all on function app.bootstrap_first_security_admin_invitation(
  uuid, text, text, uuid, jsonb, timestamptz, text
) from public;
revoke all on function app.approve_user_invitation(
  uuid, text, text, uuid, jsonb, timestamptz, text
) from public;
revoke all on function app.consume_approved_supabase_invitation(
  uuid, text, boolean
) from public;
revoke all on function app.sync_approved_supabase_auth_user() from public;

do $$
begin
  if exists (select 1 from pg_roles where rolname = 'authenticated') then
    grant select on app.user_provisioning_requests to authenticated;
    grant execute on function app.valid_permission_scope(jsonb) to authenticated;
    grant execute on function app.has_permission(text, uuid) to authenticated;
    grant execute on function app.has_scoped_permission(
      text, uuid, uuid, uuid, uuid
    ) to authenticated;
    grant execute on function app.can_access_person(text, uuid, uuid)
      to authenticated;
    grant execute on function app.can_access_position(text, uuid, uuid)
      to authenticated;
    grant execute on function app.can_access_curriculum(text, uuid, uuid)
      to authenticated;
    grant execute on function app.can_access_curriculum_version(text, uuid, uuid)
      to authenticated;
    grant execute on function app.can_access_event(text, uuid, uuid)
      to authenticated;
    grant execute on function app.can_access_form(text, uuid, uuid)
      to authenticated;
    grant execute on function app.can_access_requirement(text, uuid, uuid)
      to authenticated;
    grant execute on function app.can_access_task(text, uuid, uuid)
      to authenticated;
    grant execute on function app.can_access_form_definition(text, uuid, uuid)
      to authenticated;
    grant execute on function app.can_access_program_override(text, uuid, uuid)
      to authenticated;
    grant execute on function app.can_access_attachment_values(
      text, text, uuid, text, uuid, uuid
    ) to authenticated;
    grant execute on function app.approve_user_invitation(
      uuid, text, text, uuid, jsonb, timestamptz, text
    ) to authenticated;
  end if;

  if exists (select 1 from pg_roles where rolname = 'service_role') then
    grant all on app.user_provisioning_requests to service_role;
    grant execute on function app.valid_permission_scope(jsonb) to service_role;
    grant execute on function app.can_access_attachment_values(
      text, text, uuid, text, uuid, uuid
    ) to service_role;
    grant execute on function app.can_access_program_override(text, uuid, uuid)
      to service_role;
    grant execute on function app.bootstrap_first_security_admin_invitation(
      uuid, text, text, uuid, jsonb, timestamptz, text
    ) to service_role;
    grant execute on function app.consume_approved_supabase_invitation(
      uuid, text, boolean
    ) to service_role;
  end if;
end;
$$;

-- Authorization, deny-by-default RLS, immutable evidence, transactional outbox
-- helpers, and Supabase Storage policy scaffolding.

create table app.permissions (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  description text not null,
  sensitivity text not null default 'normal'
    check (sensitivity in ('normal', 'privileged', 'restricted'))
);

create table app.roles (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references app.organizations(id),
  code text not null,
  display_name text not null,
  system_role boolean not null default false,
  created_at timestamptz not null default statement_timestamp(),
  unique (organization_id, code)
);

create table app.role_permissions (
  role_id uuid not null references app.roles(id) on delete cascade,
  permission_id uuid not null references app.permissions(id) on delete cascade,
  granted_at timestamptz not null default statement_timestamp(),
  granted_by uuid references app.user_profiles(id),
  primary key (role_id, permission_id)
);

create table app.role_assignments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references app.organizations(id),
  user_profile_id uuid not null references app.user_profiles(id),
  role_id uuid not null references app.roles(id),
  -- Empty scope means organization-wide. Scoped assignments may contain arrays:
  -- {"fleet_ids":[],"base_ids":[],"program_ids":[]}.
  scope jsonb not null default '{}'::jsonb,
  valid_from timestamptz not null default statement_timestamp(),
  valid_to timestamptz,
  delegated_by uuid references app.user_profiles(id),
  authority_reference text,
  created_at timestamptz not null default statement_timestamp(),
  check (valid_to is null or valid_to > valid_from)
);

create index role_assignments_lookup_idx
  on app.role_assignments (user_profile_id, organization_id, valid_from, valid_to);

create table app.authorization_decisions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references app.organizations(id),
  user_profile_id uuid references app.user_profiles(id),
  permission_code text not null,
  decision text not null check (decision in ('allow', 'deny')),
  resource_type text,
  resource_id text,
  evaluated_scope jsonb not null default '{}'::jsonb,
  matched_role_assignment_ids uuid[] not null default '{}'::uuid[],
  reason text not null,
  evaluated_at timestamptz not null default statement_timestamp(),
  request_id text
);

create table app.signature_revocations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references app.organizations(id),
  signature_id uuid not null references app.signatures(id),
  reason text not null,
  revoked_at timestamptz not null default statement_timestamp(),
  revoked_by uuid not null references app.user_profiles(id),
  authority_reference text,
  unique (signature_id)
);

create or replace function app.current_auth_subject()
returns uuid
language plpgsql
stable
set search_path = pg_catalog
as $$
declare
  subject_text text;
begin
  subject_text := nullif(current_setting('request.jwt.claim.sub', true), '');
  if subject_text is null then
    return null;
  end if;
  return subject_text::uuid;
exception when invalid_text_representation then
  return null;
end;
$$;

create or replace function app.current_user_id()
returns uuid
language sql
stable
security definer
set search_path = pg_catalog, app
as $$
  select up.id
  from app.user_profiles up
  where up.auth_subject = app.current_auth_subject()
    and up.status = 'active'
  limit 1
$$;

create or replace function app.current_organization_id()
returns uuid
language sql
stable
security definer
set search_path = pg_catalog, app
as $$
  select up.organization_id
  from app.user_profiles up
  where up.id = app.current_user_id()
  limit 1
$$;

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
      and (
        ra.scope = '{}'::jsonb
        or (
          coalesce(jsonb_array_length(ra.scope -> 'fleet_ids'), 0) = 0
          and coalesce(jsonb_array_length(ra.scope -> 'base_ids'), 0) = 0
          and coalesce(jsonb_array_length(ra.scope -> 'program_ids'), 0) = 0
        )
      )
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
        coalesce(jsonb_array_length(ra.scope -> 'fleet_ids'), 0) = 0
        or (
          requested_fleet_id is not null
          and (ra.scope -> 'fleet_ids') ? requested_fleet_id::text
        )
      )
      and (
        coalesce(jsonb_array_length(ra.scope -> 'base_ids'), 0) = 0
        or (
          requested_base_id is not null
          and (ra.scope -> 'base_ids') ? requested_base_id::text
        )
      )
      and (
        coalesce(jsonb_array_length(ra.scope -> 'program_ids'), 0) = 0
        or (
          requested_program_id is not null
          and (ra.scope -> 'program_ids') ? requested_program_id::text
        )
      )
  )
$$;

revoke all on function app.current_user_id() from public;
revoke all on function app.current_organization_id() from public;
revoke all on function app.has_permission(text, uuid) from public;
revoke all on function app.has_scoped_permission(text, uuid, uuid, uuid, uuid) from public;

create or replace function audit.append_event(
  p_organization_id uuid,
  p_action text,
  p_entity_schema text,
  p_entity_table text,
  p_entity_id text,
  p_before_data jsonb default null,
  p_after_data jsonb default null,
  p_metadata jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = pg_catalog, app, audit, extensions
as $$
declare
  prior_hash bytea;
  next_sequence bigint;
  calculated_hash bytea;
  new_id uuid := gen_random_uuid();
  actor_id uuid := app.current_user_id();
  actor_sub text := current_setting('request.jwt.claim.sub', true);
  occurred timestamptz := statement_timestamp();
begin
  perform pg_advisory_xact_lock(hashtextextended(p_organization_id::text, 4871));

  select ae.sequence_number, ae.event_hash
    into next_sequence, prior_hash
  from audit.audit_events ae
  where ae.organization_id = p_organization_id
  order by ae.sequence_number desc
  limit 1;

  next_sequence := coalesce(next_sequence, 0) + 1;
  calculated_hash := extensions.digest(
    convert_to(
      concat_ws(
        '|',
        p_organization_id::text,
        next_sequence::text,
        coalesce(encode(prior_hash, 'hex'), ''),
        coalesce(actor_id::text, actor_sub, 'system'),
        p_action,
        p_entity_schema,
        p_entity_table,
        coalesce(p_entity_id, ''),
        occurred::text,
        coalesce(p_before_data::text, ''),
        coalesce(p_after_data::text, ''),
        coalesce(p_metadata::text, '{}')
      ),
      'UTF8'
    ),
    'sha256'
  );

  insert into audit.audit_events (
    id, organization_id, sequence_number, actor_user_id, actor_subject,
    action, entity_schema, entity_table, entity_id, occurred_at,
    request_id, before_data, after_data, metadata, previous_hash, event_hash
  )
  values (
    new_id, p_organization_id, next_sequence, actor_id, actor_sub,
    p_action, p_entity_schema, p_entity_table, p_entity_id, occurred,
    nullif(current_setting('request.headers', true), '')::jsonb ->> 'x-request-id',
    p_before_data, p_after_data, p_metadata, prior_hash, calculated_hash
  );

  return new_id;
end;
$$;

create or replace function audit.capture_row_change()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, app, audit
as $$
declare
  row_before jsonb;
  row_after jsonb;
  org_id uuid;
  entity_id text;
begin
  row_before := case when tg_op in ('UPDATE', 'DELETE') then to_jsonb(old) else null end;
  row_after := case when tg_op in ('INSERT', 'UPDATE') then to_jsonb(new) else null end;
  org_id := coalesce(
    nullif(row_after ->> 'organization_id', '')::uuid,
    nullif(row_before ->> 'organization_id', '')::uuid
  );
  entity_id := coalesce(row_after ->> 'id', row_before ->> 'id');

  perform audit.append_event(
    org_id,
    lower(tg_op),
    tg_table_schema,
    tg_table_name,
    entity_id,
    row_before,
    row_after,
    jsonb_build_object('trigger', tg_name)
  );

  return case when tg_op = 'DELETE' then old else new end;
end;
$$;

create or replace function audit.reject_mutation()
returns trigger
language plpgsql
set search_path = pg_catalog
as $$
begin
  raise exception 'append-only evidence in %.% cannot be updated or deleted',
    tg_table_schema, tg_table_name
    using errcode = '55000';
end;
$$;

create or replace function app.validate_signature_target()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, app
as $$
declare
  target_revision app.form_instance_revisions%rowtype;
begin
  select *
    into target_revision
  from app.form_instance_revisions fir
  where fir.id = new.form_revision_id;

  if target_revision.id is null
     or target_revision.organization_id <> new.organization_id
     or target_revision.form_instance_id <> new.form_instance_id then
    raise exception 'signature target does not belong to the stated form instance'
      using errcode = '23514';
  end if;

  if target_revision.content_hash <> new.signed_content_hash then
    raise exception 'signature hash does not match the immutable form revision'
      using errcode = '23514';
  end if;

  return new;
end;
$$;

create or replace function app.validate_grade_target()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, app
as $$
declare
  attempt_form_id uuid;
  revision_form_id uuid;
  attempt_organization_id uuid;
  revision_organization_id uuid;
begin
  select ga.form_instance_id, ga.organization_id
    into attempt_form_id, attempt_organization_id
  from app.grading_attempts ga
  where ga.id = new.grading_attempt_id;

  select fir.form_instance_id, fir.organization_id
    into revision_form_id, revision_organization_id
  from app.form_instance_revisions fir
  where fir.id = new.form_revision_id;

  if attempt_form_id is null
     or revision_form_id is null
     or attempt_form_id <> revision_form_id
     or attempt_organization_id <> new.organization_id
     or revision_organization_id <> new.organization_id then
    raise exception 'grade attempt and revision must belong to the same form and organization'
      using errcode = '23514';
  end if;

  return new;
end;
$$;

create trigger signatures_validate_target
before insert on app.signatures
for each row execute function app.validate_signature_target();

create trigger grades_validate_target
before insert on app.grades
for each row execute function app.validate_grade_target();

create trigger audit_events_immutable
before update or delete on audit.audit_events
for each row execute function audit.reject_mutation();

create trigger access_events_immutable
before update or delete on audit.access_events
for each row execute function audit.reject_mutation();

create trigger authorization_decisions_immutable
before update or delete on app.authorization_decisions
for each row execute function audit.reject_mutation();

create trigger form_instance_revisions_immutable
before update or delete on app.form_instance_revisions
for each row execute function audit.reject_mutation();

create trigger form_instance_state_events_immutable
before update or delete on app.form_instance_state_events
for each row execute function audit.reject_mutation();

create trigger grades_immutable
before update or delete on app.grades
for each row execute function audit.reject_mutation();

create trigger signatures_immutable
before update or delete on app.signatures
for each row execute function audit.reject_mutation();

create trigger signature_revocations_immutable
before update or delete on app.signature_revocations
for each row execute function audit.reject_mutation();

create trigger qualification_outcomes_immutable
before update or delete on app.qualification_outcome_events
for each row execute function audit.reject_mutation();

create trigger program_resolution_log_immutable
before update or delete on app.program_resolution_log
for each row execute function audit.reject_mutation();

create trigger st_criterion_events_immutable
before update or delete on app.special_tracking_criterion_events
for each row execute function audit.reject_mutation();

do $$
declare
  target_table text;
begin
  foreach target_table in array array[
    'programs',
    'program_versions',
    'curricula',
    'curriculum_versions',
    'tasks',
    'task_versions',
    'form_definitions',
    'form_definition_versions',
    'form_instances'
  ]
  loop
    execute format(
      'create trigger %I before delete on app.%I
       for each row execute function audit.reject_mutation()',
      target_table || '_no_hard_delete',
      target_table
    );
  end loop;
end;
$$;

do $$
declare
  target_table text;
begin
  foreach target_table in array array[
    'user_profiles',
    'person_versions',
    'person_sensitive_profiles',
    'position_versions',
    'program_versions',
    'program_transition_rule_versions',
    'program_assignment_override_versions',
    'curriculum_versions',
    'curriculum_node_versions',
    'curriculum_task_allocations',
    'task_versions',
    'form_definitions',
    'form_definition_versions',
    'form_binding_versions',
    'training_device_versions',
    'training_event_versions',
    'event_participant_versions',
    'device_serviceability_checks',
    'form_instances',
    'form_instance_revisions',
    'form_instance_state_events',
    'grading_attempts',
    'grades',
    'signatures',
    'signature_revocations',
    'requirement_versions',
    'qualification_outcome_events',
    'qualification_exceptions',
    'notifications',
    'notification_deliveries',
    'role_assignments',
    'no_notice_assignments',
    'no_notice_evaluations',
    'special_tracking_enrollments',
    'special_tracking_criterion_events',
    'remediation_plans',
    'trb_cases',
    'trb_decisions'
  ]
  loop
    execute format(
      'create trigger %I after insert or update or delete on app.%I
       for each row execute function audit.capture_row_change()',
      target_table || '_audit',
      target_table
    );
  end loop;
end;
$$;

create or replace function integration.enqueue_outbox(
  p_organization_id uuid,
  p_aggregate_type text,
  p_aggregate_id uuid,
  p_event_type text,
  p_payload jsonb,
  p_idempotency_key uuid,
  p_headers jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = pg_catalog, integration
as $$
declare
  message_id uuid;
begin
  insert into integration.outbox_messages (
    organization_id, aggregate_type, aggregate_id, event_type,
    payload, headers, idempotency_key
  )
  values (
    p_organization_id, p_aggregate_type, p_aggregate_id, p_event_type,
    p_payload, p_headers, p_idempotency_key
  )
  on conflict (organization_id, idempotency_key)
  do update set idempotency_key = excluded.idempotency_key
  returning id into message_id;

  return message_id;
end;
$$;

create or replace function integration.claim_outbox(
  p_worker_id uuid,
  p_limit integer default 25
)
returns setof integration.outbox_messages
language plpgsql
security definer
set search_path = pg_catalog, integration
as $$
begin
  if p_limit < 1 or p_limit > 250 then
    raise exception 'p_limit must be between 1 and 250';
  end if;

  return query
  with claimable as (
    select om.id
    from integration.outbox_messages om
    where om.status in ('pending', 'retry')
      and om.available_at <= statement_timestamp()
      and (om.locked_at is null or om.locked_at < statement_timestamp() - interval '5 minutes')
    order by om.created_at
    for update skip locked
    limit p_limit
  )
  update integration.outbox_messages om
  set status = 'processing',
      locked_at = statement_timestamp(),
      locked_by = p_worker_id,
      attempt_count = om.attempt_count + 1
  from claimable c
  where om.id = c.id
  returning om.*;
end;
$$;

create or replace function integration.complete_outbox(
  p_message_id uuid,
  p_worker_id uuid
)
returns void
language plpgsql
security definer
set search_path = pg_catalog, integration
as $$
begin
  update integration.outbox_messages
  set status = 'delivered',
      delivered_at = statement_timestamp(),
      locked_at = null,
      locked_by = null,
      last_error = null
  where id = p_message_id
    and status = 'processing'
    and locked_by = p_worker_id;

  if not found then
    raise exception 'outbox message is not owned by this worker';
  end if;
end;
$$;

create or replace function integration.fail_outbox(
  p_message_id uuid,
  p_worker_id uuid,
  p_error jsonb,
  p_retry_at timestamptz,
  p_dead_letter boolean default false
)
returns void
language plpgsql
security definer
set search_path = pg_catalog, integration
as $$
begin
  update integration.outbox_messages
  set status = case when p_dead_letter then 'dead_letter' else 'retry' end,
      available_at = case when p_dead_letter then available_at else p_retry_at end,
      locked_at = null,
      locked_by = null,
      last_error = p_error
  where id = p_message_id
    and status = 'processing'
    and locked_by = p_worker_id;

  if not found then
    raise exception 'outbox message is not owned by this worker';
  end if;
end;
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
  if not app.has_permission('qualification:write', p_organization_id) then
    raise exception 'qualification:write permission is required'
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

revoke all on function audit.append_event(uuid, text, text, text, text, jsonb, jsonb, jsonb) from public;
revoke all on function integration.enqueue_outbox(uuid, text, uuid, text, jsonb, uuid, jsonb) from public;
revoke all on function integration.claim_outbox(uuid, integer) from public;
revoke all on function integration.complete_outbox(uuid, uuid) from public;
revoke all on function integration.fail_outbox(uuid, uuid, jsonb, timestamptz, boolean) from public;
revoke all on function app.record_qualification_outcome_and_enqueue(
  uuid, uuid, uuid, uuid, uuid, uuid, text, timestamptz, timestamptz, jsonb, uuid, uuid
) from public;

-- First enable RLS everywhere. A table accidentally omitted from the policy
-- lists below is inaccessible, which is the intended failure mode.
do $$
declare
  relation record;
begin
  for relation in
    select schemaname, tablename
    from pg_tables
    where schemaname in ('app', 'audit', 'integration')
  loop
    execute format('alter table %I.%I enable row level security', relation.schemaname, relation.tablename);
  end loop;
end;
$$;

-- Ordinary organization configuration.
do $$
declare
  target_table text;
begin
  foreach target_table in array array[
    'fleets', 'bases', 'seats', 'curriculum_types',
    'reason_codes', 'training_devices', 'training_device_versions'
  ]
  loop
    execute format(
      'create policy %I on app.%I for select using
       (app.has_permission(''org:read'', organization_id))',
      target_table || '_select', target_table
    );
    execute format(
      'create policy %I on app.%I for all using
       (app.has_permission(''org:write'', organization_id))
       with check (app.has_permission(''org:write'', organization_id))',
      target_table || '_write', target_table
    );
  end loop;
end;
$$;

create policy organizations_select
on app.organizations for select
using (app.has_permission('org:read', id));

create policy organizations_write
on app.organizations for update
using (app.has_permission('org:write', id))
with check (app.has_permission('org:write', id));

-- People and ordinary position records.
do $$
declare
  target_table text;
begin
  foreach target_table in array array[
    'people', 'person_external_identifiers', 'person_versions',
    'positions', 'position_versions', 'instructor_authorizations',
    'instructor_authorization_versions'
  ]
  loop
    execute format(
      'create policy %I on app.%I for select using
       (app.has_permission(''people:read'', organization_id))',
      target_table || '_select', target_table
    );
    execute format(
      'create policy %I on app.%I for all using
       (app.has_permission(''people:write'', organization_id))
       with check (app.has_permission(''people:write'', organization_id))',
      target_table || '_write', target_table
    );
  end loop;
end;
$$;

create policy person_sensitive_select
on app.person_sensitive_profiles for select
using (app.has_permission('people:sensitive:read', organization_id));

create policy person_sensitive_write
on app.person_sensitive_profiles for all
using (app.has_permission('people:sensitive:write', organization_id))
with check (app.has_permission('people:sensitive:write', organization_id));

-- Program, curriculum, task, form-definition, and resolver configuration.
do $$
declare
  target_table text;
begin
  foreach target_table in array array[
    'programs', 'program_versions', 'program_transition_rules',
    'program_transition_rule_versions', 'program_assignment_overrides',
    'program_assignment_override_versions', 'curricula', 'curriculum_versions',
    'curriculum_nodes', 'curriculum_node_versions', 'tasks', 'task_versions',
    'curriculum_task_allocations', 'form_definitions', 'form_definition_versions',
    'form_bindings', 'form_binding_versions', 'program_resolution_log',
    'requirements', 'requirement_versions', 'retention_schedules', 'legal_holds'
  ]
  loop
    execute format(
      'create policy %I on app.%I for select using
       (app.has_permission(''program:read'', organization_id))',
      target_table || '_select', target_table
    );
    execute format(
      'create policy %I on app.%I for all using
       (app.has_permission(''program:write'', organization_id))
       with check (app.has_permission(''program:write'', organization_id))',
      target_table || '_write', target_table
    );
  end loop;
end;
$$;

-- Training and form records. Covert event-version rows require the additional
-- no-notice permission even when the user can otherwise read records.
do $$
declare
  target_table text;
begin
  foreach target_table in array array[
    'training_events', 'event_participants', 'event_participant_versions',
    'device_serviceability_checks', 'form_instances', 'form_instance_revisions',
    'form_instance_state_events', 'form_subjects', 'grading_attempts', 'grades',
    'signatures', 'signature_revocations', 'record_attachments', 'form_amendments'
  ]
  loop
    execute format(
      'create policy %I on app.%I for select using
       (app.has_permission(''records:read'', organization_id))',
      target_table || '_select', target_table
    );
    execute format(
      'create policy %I on app.%I for all using
       (app.has_permission(''records:write'', organization_id))
       with check (app.has_permission(''records:write'', organization_id))',
      target_table || '_write', target_table
    );
  end loop;
end;
$$;

create policy training_event_versions_select
on app.training_event_versions for select
using (
  app.has_permission('records:read', organization_id)
  and (not covert or app.has_permission('no_notice:read', organization_id))
);

create policy training_event_versions_write
on app.training_event_versions for all
using (
  app.has_permission('records:write', organization_id)
  and (not covert or app.has_permission('no_notice:write', organization_id))
)
with check (
  app.has_permission('records:write', organization_id)
  and (not covert or app.has_permission('no_notice:write', organization_id))
);

do $$
declare
  target_table text;
begin
  foreach target_table in array array[
    'qualification_outcome_events', 'qualification_projections', 'qualification_exceptions'
  ]
  loop
    execute format(
      'create policy %I on app.%I for select using
       (app.has_permission(''qualification:read'', organization_id))',
      target_table || '_select', target_table
    );
    execute format(
      'create policy %I on app.%I for all using
       (app.has_permission(''qualification:write'', organization_id))
       with check (app.has_permission(''qualification:write'', organization_id))',
      target_table || '_write', target_table
    );
  end loop;
end;
$$;

do $$
declare
  target_table text;
begin
  foreach target_table in array array[
    'notification_templates', 'notification_template_versions',
    'notifications', 'notification_deliveries'
  ]
  loop
    execute format(
      'create policy %I on app.%I for select using
       (app.has_permission(''notifications:read'', organization_id))',
      target_table || '_select', target_table
    );
    execute format(
      'create policy %I on app.%I for all using
       (app.has_permission(''notifications:write'', organization_id))
       with check (app.has_permission(''notifications:write'', organization_id))',
      target_table || '_write', target_table
    );
  end loop;
end;
$$;

do $$
declare
  target_table text;
begin
  foreach target_table in array array[
    'no_notice_programs', 'no_notice_assignments', 'no_notice_evaluations'
  ]
  loop
    execute format(
      'create policy %I on app.%I for select using
       (app.has_permission(''no_notice:read'', organization_id))',
      target_table || '_select', target_table
    );
    execute format(
      'create policy %I on app.%I for all using
       (app.has_permission(''no_notice:write'', organization_id))
       with check (app.has_permission(''no_notice:write'', organization_id))',
      target_table || '_write', target_table
    );
  end loop;
end;
$$;

do $$
declare
  target_table text;
begin
  foreach target_table in array array[
    'special_tracking_enrollments', 'special_tracking_criterion_events',
    'remediation_plans', 'special_tracking_exit_event_sets', 'trb_cases', 'trb_decisions'
  ]
  loop
    execute format(
      'create policy %I on app.%I for select using
       (app.has_permission(''special_tracking:read'', organization_id))',
      target_table || '_select', target_table
    );
    execute format(
      'create policy %I on app.%I for all using
       (app.has_permission(''special_tracking:write'', organization_id))
       with check (app.has_permission(''special_tracking:write'', organization_id))',
      target_table || '_write', target_table
    );
  end loop;
end;
$$;

create policy trb_hr_dispositions_select
on app.trb_hr_dispositions for select
using (app.has_permission('special_tracking:hr:read', organization_id));

create policy trb_hr_dispositions_write
on app.trb_hr_dispositions for all
using (app.has_permission('special_tracking:hr:write', organization_id))
with check (app.has_permission('special_tracking:hr:write', organization_id));

-- Authorization administration.
do $$
declare
  target_table text;
begin
  foreach target_table in array array[
    'permissions', 'roles', 'role_permissions', 'role_assignments', 'authorization_decisions'
  ]
  loop
    execute format(
      'create policy %I on app.%I for select using
       (app.has_permission(''security:admin'', %s))',
      target_table || '_select',
      target_table,
      case
        when target_table = 'permissions' then 'app.current_organization_id()'
        when target_table = 'role_permissions' then
          '(select r.organization_id from app.roles r where r.id = role_id)'
        else 'organization_id'
      end
    );
  end loop;
end;
$$;

create policy roles_write on app.roles for all
using (app.has_permission('security:admin', organization_id))
with check (app.has_permission('security:admin', organization_id));

create policy role_assignments_write on app.role_assignments for all
using (app.has_permission('security:admin', organization_id))
with check (app.has_permission('security:admin', organization_id));

create policy role_permissions_write on app.role_permissions for all
using (
  app.has_permission(
    'security:admin',
    (select r.organization_id from app.roles r where r.id = role_id)
  )
)
with check (
  app.has_permission(
    'security:admin',
    (select r.organization_id from app.roles r where r.id = role_id)
  )
);

create policy user_profiles_select on app.user_profiles for select
using (
  id = app.current_user_id()
  or app.has_permission('security:admin', organization_id)
  or app.has_permission('people:read', organization_id)
);

create policy user_profiles_write on app.user_profiles for all
using (app.has_permission('security:admin', organization_id))
with check (app.has_permission('security:admin', organization_id));

create policy audit_events_select on audit.audit_events for select
using (app.has_permission('audit:read', organization_id));

create policy access_events_select on audit.access_events for select
using (app.has_permission('audit:read', organization_id));

do $$
declare
  target_table text;
begin
  foreach target_table in array array[
    'outbox_messages', 'background_jobs', 'integration_sync_runs'
  ]
  loop
    execute format(
      'create policy %I on integration.%I for select using
       (app.has_permission(''integration:admin'', organization_id))',
      target_table || '_select', target_table
    );
  end loop;
end;
$$;

revoke all on all tables in schema app from public;
revoke all on all tables in schema audit from public;
revoke all on all tables in schema integration from public;
revoke all on all functions in schema app from public;
revoke all on all functions in schema audit from public;
revoke all on all functions in schema integration from public;

-- Supabase roles do not exist on plain RDS/Aurora. Grants are conditional so
-- the same migrations remain executable after migration to AWS.
do $$
begin
  if exists (select 1 from pg_roles where rolname = 'authenticated') then
    grant usage on schema app, audit, integration to authenticated;
    grant select, insert, update, delete on all tables in schema app to authenticated;
    grant select on all tables in schema audit to authenticated;
    grant select on all tables in schema integration to authenticated;
    grant execute on function app.current_user_id() to authenticated;
    grant execute on function app.current_organization_id() to authenticated;
    grant execute on function app.has_permission(text, uuid) to authenticated;
    grant execute on function app.has_scoped_permission(text, uuid, uuid, uuid, uuid) to authenticated;
    grant execute on function app.record_qualification_outcome_and_enqueue(
      uuid, uuid, uuid, uuid, uuid, uuid, text, timestamptz, timestamptz, jsonb, uuid, uuid
    ) to authenticated;
  end if;

  if exists (select 1 from pg_roles where rolname = 'service_role') then
    grant usage on schema app, audit, integration to service_role;
    grant all on all tables in schema app, audit, integration to service_role;
    grant execute on all functions in schema app, audit, integration to service_role;
  end if;
end;
$$;

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
  classification text;
  permission_code text;
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

  classification := split_part(p_object_key, '/', 2);
  permission_code := case
    when classification = 'no-notice' then 'no_notice:' || p_action
    when classification = 'special-tracking' then 'special_tracking:' || p_action
    when classification = 'sensitive' then 'people:sensitive:' || p_action
    when classification = 'audit' then 'audit:' || p_action
    else 'records:' || p_action
  end;

  return app.has_permission(permission_code, path_organization_id);
end;
$$;

revoke all on function app.can_access_storage_object(text, text, text) from public;

do $$
begin
  if exists (select 1 from pg_roles where rolname = 'authenticated') then
    grant execute on function app.can_access_storage_object(text, text, text) to authenticated;
  end if;
  if exists (select 1 from pg_roles where rolname = 'service_role') then
    grant execute on function app.can_access_storage_object(text, text, text) to service_role;
  end if;
end;
$$;

do $$
begin
  if to_regclass('storage.buckets') is not null
     and to_regclass('storage.objects') is not null then
    insert into storage.buckets (id, name, public)
    values
      ('atq-records', 'atq-records', false),
      ('atq-evidence', 'atq-evidence', false)
    on conflict (id) do update set public = false;

    execute 'drop policy if exists atq_storage_read on storage.objects';
    execute 'drop policy if exists atq_storage_insert on storage.objects';
    execute 'drop policy if exists atq_storage_update on storage.objects';
    execute 'drop policy if exists atq_storage_delete on storage.objects';

    execute $policy$
      create policy atq_storage_read on storage.objects for select
      using (app.can_access_storage_object(bucket_id, name, 'read'))
    $policy$;
    execute $policy$
      create policy atq_storage_insert on storage.objects for insert
      with check (app.can_access_storage_object(bucket_id, name, 'write'))
    $policy$;
    execute $policy$
      create policy atq_storage_update on storage.objects for update
      using (app.can_access_storage_object(bucket_id, name, 'write'))
      with check (app.can_access_storage_object(bucket_id, name, 'write'))
    $policy$;
    execute $policy$
      create policy atq_storage_delete on storage.objects for delete
      using (app.can_access_storage_object(bucket_id, name, 'delete'))
    $policy$;
  end if;
end;
$$;

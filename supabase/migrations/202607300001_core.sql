-- ATQ portable PostgreSQL foundation.
-- This migration intentionally avoids foreign keys to Supabase-owned auth tables.
-- Identity-provider subjects are mapped through app.user_profiles so the domain
-- can move to Cognito/Entra without rewriting business keys.

create schema if not exists extensions;
create schema if not exists app;
create schema if not exists audit;
create schema if not exists integration;

create extension if not exists pgcrypto with schema extensions;
create extension if not exists btree_gist with schema extensions;

create or replace function app.touch_updated_at()
returns trigger
language plpgsql
set search_path = pg_catalog
as $$
begin
  new.updated_at := statement_timestamp();
  return new;
end;
$$;

create table app.organizations (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code ~ '^[A-Z0-9_-]{2,32}$'),
  legal_name text not null,
  default_time_zone text not null default 'America/New_York',
  data_classification text not null default 'internal'
    check (data_classification in ('public', 'internal', 'confidential', 'restricted')),
  created_at timestamptz not null default statement_timestamp(),
  updated_at timestamptz not null default statement_timestamp()
);

create trigger organizations_touch_updated_at
before update on app.organizations
for each row execute function app.touch_updated_at();

create table app.user_profiles (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references app.organizations(id),
  auth_subject uuid unique,
  identity_provider text not null default 'supabase',
  provider_subject text,
  display_name text not null,
  email text,
  status text not null default 'active'
    check (status in ('invited', 'active', 'suspended', 'disabled')),
  last_authenticated_at timestamptz,
  created_at timestamptz not null default statement_timestamp(),
  updated_at timestamptz not null default statement_timestamp(),
  unique (identity_provider, provider_subject)
);

create index user_profiles_organization_idx
  on app.user_profiles (organization_id, status);

create trigger user_profiles_touch_updated_at
before update on app.user_profiles
for each row execute function app.touch_updated_at();

create table app.fleets (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references app.organizations(id),
  code text not null,
  display_name text not null,
  active boolean not null default true,
  created_at timestamptz not null default statement_timestamp(),
  unique (organization_id, code)
);

create table app.bases (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references app.organizations(id),
  code text not null,
  display_name text not null,
  iata_code text,
  time_zone text not null,
  active boolean not null default true,
  created_at timestamptz not null default statement_timestamp(),
  unique (organization_id, code)
);

create table app.seats (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references app.organizations(id),
  code text not null,
  display_name text not null,
  sort_order integer not null default 0,
  active boolean not null default true,
  unique (organization_id, code)
);

create table app.curriculum_types (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references app.organizations(id),
  code text not null,
  display_name text not null,
  transition_basis text not null default 'event_date'
    check (transition_basis in ('event_date', 'curriculum_start_date', 'cq_cycle_start_date')),
  active boolean not null default true,
  unique (organization_id, code)
);

create table app.reason_codes (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references app.organizations(id),
  code text not null,
  display_name text not null,
  category text not null,
  active boolean not null default true,
  unique (organization_id, code)
);

create table app.people (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references app.organizations(id),
  data_classification text not null default 'confidential'
    check (data_classification in ('internal', 'confidential', 'restricted')),
  source_system text,
  created_at timestamptz not null default statement_timestamp(),
  created_by uuid references app.user_profiles(id),
  retired_at timestamptz
);

create index people_organization_idx on app.people (organization_id);

create table app.person_external_identifiers (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references app.organizations(id),
  person_id uuid not null references app.people(id),
  source_system text not null,
  identifier_type text not null,
  identifier_value text not null,
  is_primary boolean not null default false,
  valid_from date not null default current_date,
  valid_to date,
  recorded_at timestamptz not null default statement_timestamp(),
  superseded_at timestamptz,
  check (valid_to is null or valid_to > valid_from),
  unique (organization_id, source_system, identifier_type, identifier_value)
);

create table app.person_versions (
  id uuid primary key default gen_random_uuid(),
  person_id uuid not null references app.people(id),
  organization_id uuid not null references app.organizations(id),
  given_name text not null,
  family_name text not null,
  preferred_name text,
  employment_status text not null
    check (employment_status in ('active', 'leave', 'inactive', 'terminated', 'synthetic')),
  seniority_number integer,
  valid_from date not null,
  valid_to date,
  recorded_at timestamptz not null default statement_timestamp(),
  superseded_at timestamptz,
  recorded_by uuid references app.user_profiles(id),
  change_reason text not null,
  source_record jsonb not null default '{}'::jsonb,
  valid_during daterange generated always as (daterange(valid_from, valid_to, '[)')) stored,
  system_during tstzrange generated always as (
    tstzrange(recorded_at, superseded_at, '[)')
  ) stored,
  check (valid_to is null or valid_to > valid_from),
  exclude using gist (person_id with =, valid_during with &&)
    where (superseded_at is null)
);

create index person_versions_current_idx
  on app.person_versions (organization_id, person_id)
  where superseded_at is null and valid_to is null;

-- Medical, credential, and HR-only attributes are deliberately separated from
-- ordinary person records so field-level access is enforceable by schema policy.
create table app.person_sensitive_profiles (
  id uuid primary key default gen_random_uuid(),
  person_id uuid not null references app.people(id),
  organization_id uuid not null references app.organizations(id),
  encrypted_payload jsonb not null default '{}'::jsonb,
  encryption_key_version text not null,
  valid_from date not null,
  valid_to date,
  recorded_at timestamptz not null default statement_timestamp(),
  superseded_at timestamptz,
  recorded_by uuid references app.user_profiles(id),
  valid_during daterange generated always as (daterange(valid_from, valid_to, '[)')) stored,
  check (valid_to is null or valid_to > valid_from),
  exclude using gist (person_id with =, valid_during with &&)
    where (superseded_at is null)
);

create table app.positions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references app.organizations(id),
  person_id uuid not null references app.people(id),
  created_at timestamptz not null default statement_timestamp(),
  created_by uuid references app.user_profiles(id)
);

create table app.position_versions (
  id uuid primary key default gen_random_uuid(),
  position_id uuid not null references app.positions(id),
  organization_id uuid not null references app.organizations(id),
  fleet_id uuid references app.fleets(id),
  seat_id uuid references app.seats(id),
  base_id uuid references app.bases(id),
  position_status text not null
    check (position_status in ('active', 'training', 'qualified', 'restricted', 'inactive')),
  is_instructor boolean not null default false,
  is_evaluator boolean not null default false,
  valid_from date not null,
  valid_to date,
  recorded_at timestamptz not null default statement_timestamp(),
  superseded_at timestamptz,
  recorded_by uuid references app.user_profiles(id),
  change_reason text not null,
  source_record jsonb not null default '{}'::jsonb,
  valid_during daterange generated always as (daterange(valid_from, valid_to, '[)')) stored,
  system_during tstzrange generated always as (
    tstzrange(recorded_at, superseded_at, '[)')
  ) stored,
  check (valid_to is null or valid_to > valid_from),
  exclude using gist (position_id with =, valid_during with &&)
    where (superseded_at is null)
);

create index position_versions_resolver_idx
  on app.position_versions (organization_id, fleet_id, seat_id, valid_from, valid_to)
  where superseded_at is null;

create table app.programs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references app.organizations(id),
  code text not null,
  program_type text not null check (program_type in ('NO', 'AQP')),
  display_name text not null,
  created_at timestamptz not null default statement_timestamp(),
  unique (organization_id, code)
);

create table app.program_versions (
  id uuid primary key default gen_random_uuid(),
  program_id uuid not null references app.programs(id),
  organization_id uuid not null references app.organizations(id),
  version_label text not null,
  lifecycle_status text not null
    check (lifecycle_status in ('proposed', 'approved', 'active', 'archived', 'withdrawn')),
  approval_reference text,
  reactivation_readiness text,
  config jsonb not null default '{}'::jsonb,
  valid_from date not null,
  valid_to date,
  recorded_at timestamptz not null default statement_timestamp(),
  superseded_at timestamptz,
  recorded_by uuid references app.user_profiles(id),
  valid_during daterange generated always as (daterange(valid_from, valid_to, '[)')) stored,
  check (valid_to is null or valid_to > valid_from),
  exclude using gist (program_id with =, valid_during with &&)
    where (superseded_at is null)
);

create table app.program_transition_rules (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references app.organizations(id),
  population_code text not null,
  fleet_id uuid references app.fleets(id),
  seat_id uuid references app.seats(id),
  curriculum_type_id uuid not null references app.curriculum_types(id),
  target_program_id uuid not null references app.programs(id),
  created_at timestamptz not null default statement_timestamp(),
  unique (organization_id, population_code, fleet_id, seat_id, curriculum_type_id)
);

create table app.program_transition_rule_versions (
  id uuid primary key default gen_random_uuid(),
  transition_rule_id uuid not null references app.program_transition_rules(id),
  organization_id uuid not null references app.organizations(id),
  phase text,
  transition_date date,
  implementation_status text not null
    check (implementation_status in ('estimated', 'planned', 'approved', 'implemented', 'paused', 'withdrawn')),
  authority_reference text,
  rule_config jsonb not null default '{}'::jsonb,
  valid_from date not null,
  valid_to date,
  recorded_at timestamptz not null default statement_timestamp(),
  superseded_at timestamptz,
  recorded_by uuid references app.user_profiles(id),
  change_reason text not null,
  valid_during daterange generated always as (daterange(valid_from, valid_to, '[)')) stored,
  system_during tstzrange generated always as (
    tstzrange(recorded_at, superseded_at, '[)')
  ) stored,
  check (valid_to is null or valid_to > valid_from),
  exclude using gist (transition_rule_id with =, valid_during with &&)
    where (superseded_at is null)
);

create table app.program_assignment_overrides (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references app.organizations(id),
  person_id uuid not null references app.people(id),
  fleet_id uuid references app.fleets(id),
  seat_id uuid references app.seats(id),
  curriculum_type_id uuid not null references app.curriculum_types(id),
  created_at timestamptz not null default statement_timestamp()
);

create table app.program_assignment_override_versions (
  id uuid primary key default gen_random_uuid(),
  override_id uuid not null references app.program_assignment_overrides(id),
  organization_id uuid not null references app.organizations(id),
  program_id uuid not null references app.programs(id),
  authority_reference text not null,
  reason text not null,
  approved_by uuid references app.user_profiles(id),
  approval_record_key text,
  valid_from date not null,
  valid_to date,
  recorded_at timestamptz not null default statement_timestamp(),
  superseded_at timestamptz,
  recorded_by uuid references app.user_profiles(id),
  valid_during daterange generated always as (daterange(valid_from, valid_to, '[)')) stored,
  system_during tstzrange generated always as (
    tstzrange(recorded_at, superseded_at, '[)')
  ) stored,
  check (valid_to is null or valid_to > valid_from),
  exclude using gist (override_id with =, valid_during with &&)
    where (superseded_at is null)
);

create table app.curricula (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references app.organizations(id),
  code text not null,
  program_id uuid not null references app.programs(id),
  fleet_id uuid references app.fleets(id),
  curriculum_type_id uuid not null references app.curriculum_types(id),
  created_at timestamptz not null default statement_timestamp(),
  unique (organization_id, code)
);

create table app.curriculum_versions (
  id uuid primary key default gen_random_uuid(),
  curriculum_id uuid not null references app.curricula(id),
  organization_id uuid not null references app.organizations(id),
  version_label text not null,
  title text not null,
  lifecycle_status text not null
    check (lifecycle_status in ('draft', 'review', 'approved', 'published', 'archived', 'withdrawn')),
  aqp_phase text,
  faa_approval_status text not null default 'not_required'
    check (faa_approval_status in ('not_required', 'pending', 'accepted', 'approved', 'superseded')),
  approval_reference text,
  seat_codes text[] not null default '{}'::text[],
  rule_snapshot jsonb not null default '{}'::jsonb,
  content_hash bytea,
  valid_from date not null,
  valid_to date,
  recorded_at timestamptz not null default statement_timestamp(),
  superseded_at timestamptz,
  recorded_by uuid references app.user_profiles(id),
  change_reason text not null,
  valid_during daterange generated always as (daterange(valid_from, valid_to, '[)')) stored,
  system_during tstzrange generated always as (
    tstzrange(recorded_at, superseded_at, '[)')
  ) stored,
  check (valid_to is null or valid_to > valid_from),
  unique (curriculum_id, version_label),
  exclude using gist (curriculum_id with =, valid_during with &&)
    where (superseded_at is null and lifecycle_status in ('approved', 'published'))
);

create index curriculum_versions_resolver_idx
  on app.curriculum_versions (organization_id, curriculum_id, valid_from, valid_to)
  where superseded_at is null and lifecycle_status in ('approved', 'published');

create table app.curriculum_nodes (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references app.organizations(id),
  curriculum_id uuid not null references app.curricula(id),
  stable_code text not null,
  created_at timestamptz not null default statement_timestamp(),
  unique (curriculum_id, stable_code)
);

create table app.curriculum_node_versions (
  id uuid primary key default gen_random_uuid(),
  curriculum_node_id uuid not null references app.curriculum_nodes(id),
  organization_id uuid not null references app.organizations(id),
  curriculum_version_id uuid not null references app.curriculum_versions(id),
  parent_node_id uuid references app.curriculum_nodes(id),
  node_type text not null
    check (node_type in ('segment', 'module', 'lesson', 'lesson_element')),
  outline_number text,
  module_code text,
  title text not null,
  sequence integer not null,
  planned_minutes integer,
  governing_citations jsonb not null default '[]'::jsonb,
  structured_rules jsonb not null default '[]'::jsonb,
  valid_from date not null,
  valid_to date,
  recorded_at timestamptz not null default statement_timestamp(),
  superseded_at timestamptz,
  recorded_by uuid references app.user_profiles(id),
  valid_during daterange generated always as (daterange(valid_from, valid_to, '[)')) stored,
  check (valid_to is null or valid_to > valid_from),
  check (planned_minutes is null or planned_minutes >= 0),
  unique (curriculum_version_id, curriculum_node_id)
);

create index curriculum_node_versions_tree_idx
  on app.curriculum_node_versions (curriculum_version_id, parent_node_id, sequence);

-- Internal UUID is the durable application key. vision_task_id is the globally
-- unique integration identity and can never be reused or mutated.
create table app.tasks (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references app.organizations(id),
  vision_task_id bigint not null,
  source_system text not null default 'VISION',
  created_at timestamptz not null default statement_timestamp(),
  unique (organization_id, vision_task_id)
);

create table app.task_versions (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references app.tasks(id),
  organization_id uuid not null references app.organizations(id),
  task_type text not null check (task_type in ('task', 'TPO', 'SPO', 'grading_item')),
  outline_number text,
  title text not null,
  criticality integer check (criticality between 1 and 5),
  currency_interval_months integer check (currency_interval_months is null or currency_interval_months > 0),
  performance_standard jsonb not null default '{}'::jsonb,
  observable_behaviors jsonb not null default '[]'::jsonb,
  source_revision text,
  valid_from date not null,
  valid_to date,
  recorded_at timestamptz not null default statement_timestamp(),
  superseded_at timestamptz,
  recorded_by uuid references app.user_profiles(id),
  valid_during daterange generated always as (daterange(valid_from, valid_to, '[)')) stored,
  system_during tstzrange generated always as (
    tstzrange(recorded_at, superseded_at, '[)')
  ) stored,
  check (valid_to is null or valid_to > valid_from),
  exclude using gist (task_id with =, valid_during with &&)
    where (superseded_at is null)
);

create table app.curriculum_task_allocations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references app.organizations(id),
  curriculum_version_id uuid not null references app.curriculum_versions(id),
  curriculum_node_id uuid not null references app.curriculum_nodes(id),
  task_id uuid not null references app.tasks(id),
  duty_position_code text,
  allocation_kind text not null
    check (allocation_kind in ('train', 'validate', 'evaluate', 'first_look', 'observe')),
  cycle_slot text,
  event_set_code text,
  sequence integer not null default 0,
  config jsonb not null default '{}'::jsonb,
  unique (curriculum_version_id, curriculum_node_id, task_id, duty_position_code, allocation_kind)
);

create table app.form_definitions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references app.organizations(id),
  code text not null,
  title text not null,
  owner_user_id uuid references app.user_profiles(id),
  created_at timestamptz not null default statement_timestamp(),
  unique (organization_id, code)
);

create table app.form_definition_versions (
  id uuid primary key default gen_random_uuid(),
  form_definition_id uuid not null references app.form_definitions(id),
  organization_id uuid not null references app.organizations(id),
  version_label text not null,
  lifecycle_status text not null
    check (lifecycle_status in ('draft', 'review', 'approved', 'published', 'retired')),
  schema_version integer not null default 1,
  form_schema jsonb not null,
  validation_schema jsonb not null default '{}'::jsonb,
  outcome_rules jsonb not null default '[]'::jsonb,
  print_schema jsonb not null default '{}'::jsonb,
  citations jsonb not null default '[]'::jsonb,
  content_hash bytea not null,
  valid_from date not null,
  valid_to date,
  recorded_at timestamptz not null default statement_timestamp(),
  superseded_at timestamptz,
  recorded_by uuid references app.user_profiles(id),
  approved_by uuid references app.user_profiles(id),
  approved_at timestamptz,
  valid_during daterange generated always as (daterange(valid_from, valid_to, '[)')) stored,
  check (valid_to is null or valid_to > valid_from),
  unique (form_definition_id, version_label),
  exclude using gist (form_definition_id with =, valid_during with &&)
    where (superseded_at is null and lifecycle_status in ('approved', 'published'))
);

create table app.form_bindings (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references app.organizations(id),
  form_definition_id uuid not null references app.form_definitions(id),
  curriculum_id uuid references app.curricula(id),
  created_at timestamptz not null default statement_timestamp()
);

create table app.form_binding_versions (
  id uuid primary key default gen_random_uuid(),
  form_binding_id uuid not null references app.form_bindings(id),
  organization_id uuid not null references app.organizations(id),
  form_definition_version_id uuid not null references app.form_definition_versions(id),
  program_id uuid not null references app.programs(id),
  fleet_id uuid references app.fleets(id),
  seat_id uuid references app.seats(id),
  curriculum_type_id uuid not null references app.curriculum_types(id),
  reason_code_id uuid references app.reason_codes(id),
  event_type text not null,
  priority integer not null default 100,
  constraints_json jsonb not null default '{}'::jsonb,
  valid_from date not null,
  valid_to date,
  recorded_at timestamptz not null default statement_timestamp(),
  superseded_at timestamptz,
  recorded_by uuid references app.user_profiles(id),
  valid_during daterange generated always as (daterange(valid_from, valid_to, '[)')) stored,
  check (valid_to is null or valid_to > valid_from),
  exclude using gist (form_binding_id with =, valid_during with &&)
    where (superseded_at is null)
);

create table app.program_resolution_log (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references app.organizations(id),
  person_id uuid not null references app.people(id),
  fleet_id uuid not null references app.fleets(id),
  seat_id uuid not null references app.seats(id),
  curriculum_type_id uuid not null references app.curriculum_types(id),
  event_date date not null,
  curriculum_start_date date,
  reason_code_id uuid references app.reason_codes(id),
  as_known_at timestamptz not null,
  input_snapshot jsonb not null,
  resolution_status text not null check (resolution_status in ('resolved', 'needs_review', 'unresolved')),
  program_id uuid references app.programs(id),
  curriculum_version_id uuid references app.curriculum_versions(id),
  form_definition_version_id uuid references app.form_definition_versions(id),
  rule_set_ref text,
  reasoning_chain jsonb not null,
  warnings jsonb not null default '[]'::jsonb,
  resolved_at timestamptz not null default statement_timestamp(),
  resolved_by uuid references app.user_profiles(id),
  resolver_version text not null,
  decision_hash bytea not null
);

create index program_resolution_log_replay_idx
  on app.program_resolution_log (organization_id, person_id, event_date, as_known_at);

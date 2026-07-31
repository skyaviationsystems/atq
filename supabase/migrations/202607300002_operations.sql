-- Operational records, qualifications, notifications, specialized programs,
-- audit evidence, and durable integration delivery.

create table app.training_devices (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references app.organizations(id),
  code text not null,
  display_name text not null,
  device_type text not null,
  fleet_id uuid references app.fleets(id),
  location_base_id uuid references app.bases(id),
  active boolean not null default true,
  created_at timestamptz not null default statement_timestamp(),
  unique (organization_id, code)
);

create table app.training_device_versions (
  id uuid primary key default gen_random_uuid(),
  training_device_id uuid not null references app.training_devices(id),
  organization_id uuid not null references app.organizations(id),
  qualification_status text not null
    check (qualification_status in ('qualified', 'restricted', 'not_for_training', 'inactive')),
  qualification_reference text,
  limitations jsonb not null default '[]'::jsonb,
  valid_from date not null,
  valid_to date,
  recorded_at timestamptz not null default statement_timestamp(),
  superseded_at timestamptz,
  recorded_by uuid references app.user_profiles(id),
  valid_during daterange generated always as (daterange(valid_from, valid_to, '[)')) stored,
  check (valid_to is null or valid_to > valid_from),
  exclude using gist (training_device_id with =, valid_during with &&)
    where (superseded_at is null)
);

create table app.training_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references app.organizations(id),
  source_system text,
  external_event_id text,
  created_at timestamptz not null default statement_timestamp(),
  created_by uuid references app.user_profiles(id)
);

create unique index training_events_external_identity_uidx
  on app.training_events (organization_id, source_system, external_event_id)
  where source_system is not null and external_event_id is not null;

create table app.training_event_versions (
  id uuid primary key default gen_random_uuid(),
  training_event_id uuid not null references app.training_events(id),
  organization_id uuid not null references app.organizations(id),
  event_type text not null,
  reason_code_id uuid references app.reason_codes(id),
  fleet_id uuid not null references app.fleets(id),
  curriculum_type_id uuid not null references app.curriculum_types(id),
  curriculum_version_id uuid references app.curriculum_versions(id),
  program_id uuid references app.programs(id),
  training_device_id uuid references app.training_devices(id),
  location_base_id uuid references app.bases(id),
  scheduled_start_at timestamptz not null,
  scheduled_end_at timestamptz not null,
  curriculum_start_date date,
  event_status text not null
    check (event_status in ('planned', 'assigned', 'ready', 'in_progress', 'completed', 'cancelled', 'no_show', 'reconciliation_hold')),
  covert boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
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
  check (scheduled_end_at > scheduled_start_at),
  check (valid_to is null or valid_to > valid_from),
  exclude using gist (training_event_id with =, valid_during with &&)
    where (superseded_at is null)
);

create index training_event_versions_schedule_idx
  on app.training_event_versions (organization_id, scheduled_start_at, event_status)
  where superseded_at is null;

create table app.event_participants (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references app.organizations(id),
  training_event_id uuid not null references app.training_events(id),
  person_id uuid not null references app.people(id),
  created_at timestamptz not null default statement_timestamp(),
  unique (training_event_id, person_id)
);

create table app.event_participant_versions (
  id uuid primary key default gen_random_uuid(),
  event_participant_id uuid not null references app.event_participants(id),
  organization_id uuid not null references app.organizations(id),
  participant_role text not null
    check (participant_role in ('student', 'instructor', 'evaluator', 'observer', 'records_reviewer')),
  duty_seat_id uuid references app.seats(id),
  assignment_status text not null
    check (assignment_status in ('tentative', 'assigned', 'confirmed', 'attended', 'absent', 'removed')),
  valid_from date not null,
  valid_to date,
  recorded_at timestamptz not null default statement_timestamp(),
  superseded_at timestamptz,
  recorded_by uuid references app.user_profiles(id),
  valid_during daterange generated always as (daterange(valid_from, valid_to, '[)')) stored,
  check (valid_to is null or valid_to > valid_from),
  exclude using gist (event_participant_id with =, valid_during with &&)
    where (superseded_at is null)
);

create table app.device_serviceability_checks (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references app.organizations(id),
  training_event_id uuid not null references app.training_events(id),
  training_device_id uuid not null references app.training_devices(id),
  checked_by uuid not null references app.user_profiles(id),
  checked_at timestamptz not null default statement_timestamp(),
  logbook_reviewed boolean not null,
  preflight_complete boolean not null,
  force_replication_verified boolean,
  serviceable boolean not null,
  discrepancy_summary text,
  evidence jsonb not null default '{}'::jsonb,
  check (
    serviceable = false
    or (logbook_reviewed and preflight_complete and coalesce(force_replication_verified, true))
  )
);

create table app.form_instances (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references app.organizations(id),
  training_event_id uuid references app.training_events(id),
  program_resolution_id uuid not null references app.program_resolution_log(id),
  form_definition_version_id uuid not null references app.form_definition_versions(id),
  subject_person_id uuid references app.people(id),
  current_state text not null default 'draft'
    check (current_state in (
      'draft', 'offline_draft', 'ready_for_signature', 'partially_signed',
      'submitted', 'qc_review', 'qc_returned', 'approved', 'amended',
      'voided', 'stale_version_quarantine', 'sync_conflict',
      'processing_failure', 'reconciliation_hold'
    )),
  current_revision integer not null default 0,
  lock_version integer not null default 0,
  client_instance_id uuid not null,
  originating_device_id text,
  synchronization_status text not null default 'server'
    check (synchronization_status in ('server', 'local_only', 'pending_upload', 'synced', 'conflict', 'failed')),
  owner_user_id uuid references app.user_profiles(id),
  due_at timestamptz,
  submitted_at timestamptz,
  approved_at timestamptz,
  created_at timestamptz not null default statement_timestamp(),
  updated_at timestamptz not null default statement_timestamp(),
  unique (organization_id, client_instance_id)
);

create index form_instances_queue_idx
  on app.form_instances (organization_id, current_state, due_at);

create trigger form_instances_touch_updated_at
before update on app.form_instances
for each row execute function app.touch_updated_at();

create table app.form_instance_revisions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references app.organizations(id),
  form_instance_id uuid not null references app.form_instances(id),
  revision_number integer not null check (revision_number > 0),
  revision_kind text not null
    check (revision_kind in ('initial', 'autosave', 'submission', 'qc_return', 'amendment', 'void')),
  payload jsonb not null,
  schema_snapshot jsonb not null,
  program_snapshot jsonb not null,
  authorization_snapshot jsonb not null default '{}'::jsonb,
  content_hash bytea not null,
  client_recorded_at timestamptz,
  recorded_at timestamptz not null default statement_timestamp(),
  recorded_by uuid references app.user_profiles(id),
  idempotency_key uuid not null,
  replaces_revision_id uuid references app.form_instance_revisions(id),
  unique (form_instance_id, revision_number),
  unique (organization_id, idempotency_key)
);

create index form_instance_revisions_form_idx
  on app.form_instance_revisions (form_instance_id, revision_number desc);

create table app.form_instance_state_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references app.organizations(id),
  form_instance_id uuid not null references app.form_instances(id),
  from_state text,
  to_state text not null,
  reason_code text,
  narrative text,
  revision_id uuid references app.form_instance_revisions(id),
  occurred_at timestamptz not null default statement_timestamp(),
  actor_user_id uuid references app.user_profiles(id),
  idempotency_key uuid not null,
  unique (organization_id, idempotency_key)
);

create table app.form_subjects (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references app.organizations(id),
  form_instance_id uuid not null references app.form_instances(id),
  person_id uuid references app.people(id),
  event_participant_id uuid references app.event_participants(id),
  subject_kind text not null check (subject_kind in ('individual', 'crew')),
  duty_seat_id uuid references app.seats(id),
  crew_key text,
  unique nulls not distinct (form_instance_id, person_id, subject_kind, crew_key)
);

create table app.grading_attempts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references app.organizations(id),
  form_instance_id uuid not null references app.form_instances(id),
  form_subject_id uuid not null references app.form_subjects(id),
  task_id uuid references app.tasks(id),
  grading_item_key text not null,
  event_set_code text,
  attempt_number integer not null check (attempt_number > 0),
  attempt_kind text not null
    check (attempt_kind in ('first_look', 'initial', 'repeat', 'remediation', 'recheck')),
  captured_before_training boolean not null default false,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default statement_timestamp(),
  created_by uuid references app.user_profiles(id),
  unique (form_instance_id, form_subject_id, grading_item_key, attempt_number)
);

create table app.grades (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references app.organizations(id),
  grading_attempt_id uuid not null references app.grading_attempts(id),
  form_revision_id uuid not null references app.form_instance_revisions(id),
  grade_scale_code text not null,
  overall_grade text,
  technical_proficiency smallint check (technical_proficiency between 1 and 5),
  procedural_compliance smallint check (procedural_compliance between 1 and 5),
  situational_awareness smallint check (situational_awareness between 1 and 5),
  crew_resource_management smallint check (crew_resource_management between 1 and 5),
  satisfactory boolean,
  waived boolean not null default false,
  waiver_authority text,
  narrative text,
  observable_behavior_codes text[] not null default '{}'::text[],
  captured_at timestamptz not null default statement_timestamp(),
  captured_by uuid references app.user_profiles(id),
  check (not waived or waiver_authority is not null),
  unique (grading_attempt_id, form_revision_id)
);

create index grades_revision_idx on app.grades (form_revision_id);

create table app.signatures (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references app.organizations(id),
  form_instance_id uuid not null references app.form_instances(id),
  form_revision_id uuid not null references app.form_instance_revisions(id),
  signer_user_id uuid references app.user_profiles(id),
  signer_person_id uuid references app.people(id),
  signer_role text not null,
  signature_method text not null
    check (signature_method in ('online_step_up', 'device_attestation', 'external_identity', 'approved_contingency')),
  signature_intent text not null,
  signed_content_hash bytea not null,
  identity_provider text,
  authentication_context jsonb not null default '{}'::jsonb,
  client_signed_at timestamptz,
  verified_at timestamptz,
  signed_at timestamptz not null default statement_timestamp(),
  revoked_at timestamptz,
  revocation_reason text,
  idempotency_key uuid not null,
  check (signer_user_id is not null or signer_person_id is not null),
  unique (organization_id, idempotency_key),
  unique (form_revision_id, signer_role, signer_person_id)
);

create table app.record_attachments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references app.organizations(id),
  form_instance_id uuid references app.form_instances(id),
  person_id uuid references app.people(id),
  bucket_id text not null,
  object_key text not null,
  original_file_name text,
  content_type text not null,
  byte_size bigint not null check (byte_size >= 0),
  content_hash bytea not null,
  classification text not null default 'records'
    check (classification in ('records', 'sensitive', 'no-notice', 'special-tracking', 'audit')),
  malware_scan_status text not null default 'pending'
    check (malware_scan_status in ('pending', 'clean', 'quarantined', 'failed')),
  created_at timestamptz not null default statement_timestamp(),
  created_by uuid references app.user_profiles(id),
  retention_until date,
  legal_hold boolean not null default false,
  unique (bucket_id, object_key)
);

create table app.form_amendments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references app.organizations(id),
  form_instance_id uuid not null references app.form_instances(id),
  prior_revision_id uuid not null references app.form_instance_revisions(id),
  amended_revision_id uuid not null references app.form_instance_revisions(id),
  amendment_reason text not null,
  requested_by uuid not null references app.user_profiles(id),
  approved_by uuid references app.user_profiles(id),
  approved_at timestamptz,
  batch_id uuid,
  created_at timestamptz not null default statement_timestamp(),
  unique (form_instance_id, amended_revision_id)
);

create table app.requirements (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references app.organizations(id),
  code text not null,
  requirement_type text not null
    check (requirement_type in ('qualification', 'currency', 'consolidation', 'training', 'credential', 'authorization')),
  created_at timestamptz not null default statement_timestamp(),
  unique (organization_id, code)
);

create table app.requirement_versions (
  id uuid primary key default gen_random_uuid(),
  requirement_id uuid not null references app.requirements(id),
  organization_id uuid not null references app.organizations(id),
  version_label text not null,
  title text not null,
  program_id uuid references app.programs(id),
  fleet_id uuid references app.fleets(id),
  seat_id uuid references app.seats(id),
  curriculum_type_id uuid references app.curriculum_types(id),
  deterministic_rule jsonb not null,
  calendar_convention text not null default 'end_of_month',
  citations jsonb not null default '[]'::jsonb,
  lifecycle_status text not null
    check (lifecycle_status in ('draft', 'approved', 'active', 'retired')),
  valid_from date not null,
  valid_to date,
  recorded_at timestamptz not null default statement_timestamp(),
  superseded_at timestamptz,
  recorded_by uuid references app.user_profiles(id),
  valid_during daterange generated always as (daterange(valid_from, valid_to, '[)')) stored,
  check (valid_to is null or valid_to > valid_from),
  unique (requirement_id, version_label),
  exclude using gist (requirement_id with =, valid_during with &&)
    where (superseded_at is null and lifecycle_status in ('approved', 'active'))
);

create table app.qualification_outcome_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references app.organizations(id),
  person_id uuid not null references app.people(id),
  requirement_id uuid not null references app.requirements(id),
  source_form_instance_id uuid references app.form_instances(id),
  source_form_revision_id uuid references app.form_instance_revisions(id),
  source_event_id uuid references app.training_events(id),
  outcome_type text not null
    check (outcome_type in ('grant', 'renew', 'suspend', 'revoke', 'restore', 'base_month_reset', 'extend', 'correct')),
  effective_at timestamptz not null,
  recorded_at timestamptz not null default statement_timestamp(),
  expires_at timestamptz,
  outcome_payload jsonb not null default '{}'::jsonb,
  rule_version_id uuid references app.requirement_versions(id),
  idempotency_key uuid not null,
  recorded_by uuid references app.user_profiles(id),
  unique (organization_id, idempotency_key)
);

create index qualification_outcome_events_rebuild_idx
  on app.qualification_outcome_events (organization_id, person_id, requirement_id, effective_at, recorded_at);

-- A disposable read model. It is rebuilt from qualification_outcome_events and
-- must never be treated as the regulatory evidence itself.
create table app.qualification_projections (
  organization_id uuid not null references app.organizations(id),
  person_id uuid not null references app.people(id),
  requirement_id uuid not null references app.requirements(id),
  status text not null
    check (status in ('not_held', 'in_progress', 'current', 'expiring', 'expired', 'suspended', 'revoked', 'unknown')),
  effective_at timestamptz,
  expires_at timestamptz,
  base_month smallint check (base_month between 1 and 12),
  last_outcome_event_id uuid references app.qualification_outcome_events(id),
  evidence_watermark timestamptz not null,
  computed_at timestamptz not null default statement_timestamp(),
  computation_version text not null,
  detail jsonb not null default '{}'::jsonb,
  primary key (person_id, requirement_id)
);

create index qualification_projections_status_idx
  on app.qualification_projections (organization_id, status, expires_at);

create table app.qualification_exceptions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references app.organizations(id),
  person_id uuid not null references app.people(id),
  requirement_id uuid not null references app.requirements(id),
  exception_type text not null
    check (exception_type in ('waiver', 'extension', 'deviation', 'restriction', 'limitation')),
  status text not null
    check (status in ('requested', 'approved', 'active', 'expired', 'denied', 'revoked')),
  authority_reference text,
  reason text not null,
  effective_from timestamptz not null,
  effective_to timestamptz,
  approved_by uuid references app.user_profiles(id),
  approval_evidence_key text,
  created_at timestamptz not null default statement_timestamp(),
  check (effective_to is null or effective_to > effective_from)
);

create table app.instructor_authorizations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references app.organizations(id),
  person_id uuid not null references app.people(id),
  created_at timestamptz not null default statement_timestamp()
);

create table app.instructor_authorization_versions (
  id uuid primary key default gen_random_uuid(),
  instructor_authorization_id uuid not null references app.instructor_authorizations(id),
  organization_id uuid not null references app.organizations(id),
  curriculum_id uuid references app.curricula(id),
  program_id uuid references app.programs(id),
  fleet_id uuid references app.fleets(id),
  seat_id uuid references app.seats(id),
  training_device_id uuid references app.training_devices(id),
  authorized_functions text[] not null,
  line_familiar boolean not null default false,
  authorization_status text not null
    check (authorization_status in ('pending', 'active', 'restricted', 'expired', 'revoked')),
  authority_reference text,
  valid_from date not null,
  valid_to date,
  recorded_at timestamptz not null default statement_timestamp(),
  superseded_at timestamptz,
  recorded_by uuid references app.user_profiles(id),
  valid_during daterange generated always as (daterange(valid_from, valid_to, '[)')) stored,
  check (valid_to is null or valid_to > valid_from),
  exclude using gist (instructor_authorization_id with =, valid_during with &&)
    where (superseded_at is null)
);

create table app.notification_templates (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references app.organizations(id),
  code text not null,
  purpose text not null,
  unique (organization_id, code)
);

create table app.notification_template_versions (
  id uuid primary key default gen_random_uuid(),
  notification_template_id uuid not null references app.notification_templates(id),
  organization_id uuid not null references app.organizations(id),
  channel text not null check (channel in ('in_app', 'email', 'sms', 'webhook')),
  subject_template text,
  body_template text not null,
  variable_schema jsonb not null default '{}'::jsonb,
  escalation_config jsonb not null default '{}'::jsonb,
  lifecycle_status text not null check (lifecycle_status in ('draft', 'active', 'retired')),
  valid_from date not null,
  valid_to date,
  recorded_at timestamptz not null default statement_timestamp(),
  superseded_at timestamptz,
  recorded_by uuid references app.user_profiles(id),
  valid_during daterange generated always as (daterange(valid_from, valid_to, '[)')) stored,
  check (valid_to is null or valid_to > valid_from),
  exclude using gist (notification_template_id with =, valid_during with &&)
    where (superseded_at is null and lifecycle_status = 'active')
);

create table app.notifications (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references app.organizations(id),
  notification_template_version_id uuid references app.notification_template_versions(id),
  notification_type text not null,
  regulatory boolean not null default false,
  source_entity_type text,
  source_entity_id uuid,
  payload jsonb not null,
  status text not null default 'pending'
    check (status in ('pending', 'queued', 'partially_delivered', 'delivered', 'failed', 'cancelled')),
  effective_action_at timestamptz,
  created_at timestamptz not null default statement_timestamp(),
  created_by uuid references app.user_profiles(id),
  idempotency_key uuid not null,
  unique (organization_id, idempotency_key)
);

create table app.notification_deliveries (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references app.organizations(id),
  notification_id uuid not null references app.notifications(id),
  channel text not null check (channel in ('in_app', 'email', 'sms', 'webhook')),
  recipient_user_id uuid references app.user_profiles(id),
  recipient_address text,
  delivery_status text not null default 'pending'
    check (delivery_status in ('pending', 'queued', 'sent', 'delivered', 'failed', 'acknowledged', 'cancelled')),
  provider_message_id text,
  attempt_count integer not null default 0,
  last_attempt_at timestamptz,
  delivered_at timestamptz,
  acknowledged_at timestamptz,
  failure_detail jsonb,
  next_attempt_at timestamptz,
  unique (notification_id, channel, recipient_user_id, recipient_address)
);

create table app.no_notice_programs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references app.organizations(id),
  program_year integer not null check (program_year between 2000 and 2200),
  fleet_id uuid not null references app.fleets(id),
  annual_target integer not null check (annual_target > 0),
  sampling_rules jsonb not null,
  lifecycle_status text not null
    check (lifecycle_status in ('draft', 'active', 'closed', 'archived')),
  created_at timestamptz not null default statement_timestamp(),
  created_by uuid references app.user_profiles(id),
  unique (organization_id, program_year, fleet_id)
);

-- Covert assignments are isolated so normal scheduling and record permissions
-- never expose evaluation targets before the evaluation occurs.
create table app.no_notice_assignments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references app.organizations(id),
  no_notice_program_id uuid not null references app.no_notice_programs(id),
  target_person_id uuid not null references app.people(id),
  evaluator_person_id uuid not null references app.people(id),
  planned_window_start date not null,
  planned_window_end date not null,
  geographic_region_code text,
  base_month smallint check (base_month between 1 and 12),
  assignment_status text not null
    check (assignment_status in ('proposed', 'approved', 'scheduled_covert', 'released', 'completed', 'cancelled')),
  released_at timestamptz,
  created_at timestamptz not null default statement_timestamp(),
  created_by uuid references app.user_profiles(id),
  check (planned_window_end >= planned_window_start)
);

create table app.no_notice_evaluations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references app.organizations(id),
  no_notice_assignment_id uuid not null references app.no_notice_assignments(id),
  training_event_id uuid references app.training_events(id),
  form_instance_id uuid references app.form_instances(id),
  occurred_at timestamptz not null,
  outcome text not null check (outcome in ('satisfactory', 'unsatisfactory', 'incomplete')),
  geography_snapshot jsonb not null,
  publications_audit jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default statement_timestamp()
);

create table app.special_tracking_enrollments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references app.organizations(id),
  person_id uuid not null references app.people(id),
  trigger_type text not null,
  trigger_evidence jsonb not null,
  entered_at timestamptz not null,
  window_start date not null,
  window_end date not null,
  enrollment_status text not null
    check (enrollment_status in ('pending_review', 'active', 'exit_pending', 'exited', 'reentered', 'removed')),
  authority_reference text,
  created_at timestamptz not null default statement_timestamp(),
  created_by uuid references app.user_profiles(id),
  check (window_end >= window_start)
);

create table app.special_tracking_criterion_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references app.organizations(id),
  special_tracking_enrollment_id uuid not null references app.special_tracking_enrollments(id),
  criterion_code text not null,
  source_form_instance_id uuid references app.form_instances(id),
  occurred_at timestamptz not null,
  points numeric(7, 2),
  evidence jsonb not null,
  recorded_at timestamptz not null default statement_timestamp(),
  idempotency_key uuid not null,
  unique (organization_id, idempotency_key)
);

create table app.remediation_plans (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references app.organizations(id),
  special_tracking_enrollment_id uuid references app.special_tracking_enrollments(id),
  person_id uuid not null references app.people(id),
  plan_status text not null
    check (plan_status in ('draft', 'approved', 'active', 'completed', 'cancelled')),
  objectives jsonb not null,
  required_events jsonb not null,
  effective_from date not null,
  due_date date,
  approved_by uuid references app.user_profiles(id),
  created_at timestamptz not null default statement_timestamp(),
  created_by uuid references app.user_profiles(id)
);

create table app.special_tracking_exit_event_sets (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references app.organizations(id),
  special_tracking_enrollment_id uuid not null references app.special_tracking_enrollments(id),
  sequence integer not null,
  training_event_id uuid references app.training_events(id),
  form_instance_id uuid references app.form_instances(id),
  outcome text check (outcome in ('satisfactory', 'unsatisfactory', 'incomplete')),
  completed_at timestamptz,
  unique (special_tracking_enrollment_id, sequence)
);

create table app.trb_cases (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references app.organizations(id),
  person_id uuid not null references app.people(id),
  special_tracking_enrollment_id uuid references app.special_tracking_enrollments(id),
  case_number text not null,
  case_status text not null
    check (case_status in ('open', 'review_scheduled', 'under_review', 'decision_pending', 'closed')),
  opened_at timestamptz not null,
  evidence_manifest jsonb not null default '[]'::jsonb,
  created_by uuid references app.user_profiles(id),
  unique (organization_id, case_number)
);

create table app.trb_decisions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references app.organizations(id),
  trb_case_id uuid not null references app.trb_cases(id),
  decision text not null
    check (decision in ('continue_training', 'additional_training', 'requalification', 'remove_from_program', 'refer_to_hr')),
  rationale text not null,
  conditions jsonb not null default '[]'::jsonb,
  decided_at timestamptz not null,
  decided_by uuid not null references app.user_profiles(id),
  approval_reference text,
  unique (trb_case_id, decided_at)
);

-- Employment disposition is intentionally partitioned from the training jacket.
create table app.trb_hr_dispositions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references app.organizations(id),
  trb_case_id uuid not null references app.trb_cases(id),
  encrypted_payload jsonb not null,
  encryption_key_version text not null,
  recorded_at timestamptz not null default statement_timestamp(),
  recorded_by uuid not null references app.user_profiles(id)
);

create table app.retention_schedules (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references app.organizations(id),
  record_class text not null,
  retention_months integer,
  archive_exempt boolean not null default false,
  disposition_review_required boolean not null default true,
  authority_citations jsonb not null default '[]'::jsonb,
  valid_from date not null,
  valid_to date,
  recorded_at timestamptz not null default statement_timestamp(),
  superseded_at timestamptz,
  check (retention_months is null or retention_months > 0),
  check (valid_to is null or valid_to > valid_from),
  unique (organization_id, record_class, valid_from)
);

create table app.legal_holds (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references app.organizations(id),
  hold_reference text not null,
  scope jsonb not null,
  status text not null check (status in ('active', 'released')),
  effective_at timestamptz not null,
  released_at timestamptz,
  created_by uuid not null references app.user_profiles(id),
  unique (organization_id, hold_reference)
);

create table integration.outbox_messages (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references app.organizations(id),
  aggregate_type text not null,
  aggregate_id uuid not null,
  event_type text not null,
  payload jsonb not null,
  headers jsonb not null default '{}'::jsonb,
  idempotency_key uuid not null,
  status text not null default 'pending'
    check (status in ('pending', 'processing', 'delivered', 'retry', 'dead_letter')),
  attempt_count integer not null default 0,
  available_at timestamptz not null default statement_timestamp(),
  locked_at timestamptz,
  locked_by uuid,
  delivered_at timestamptz,
  last_error jsonb,
  created_at timestamptz not null default statement_timestamp(),
  unique (organization_id, idempotency_key)
);

create index outbox_delivery_idx
  on integration.outbox_messages (status, available_at, created_at)
  where status in ('pending', 'retry');

create table integration.background_jobs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references app.organizations(id),
  job_type text not null,
  schedule_key text,
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'queued'
    check (status in ('queued', 'running', 'succeeded', 'failed', 'retry', 'dead_letter', 'cancelled')),
  idempotency_key uuid not null,
  attempt_count integer not null default 0,
  max_attempts integer not null default 8,
  available_at timestamptz not null default statement_timestamp(),
  locked_at timestamptz,
  locked_by uuid,
  completed_at timestamptz,
  last_error jsonb,
  created_at timestamptz not null default statement_timestamp(),
  unique nulls not distinct (organization_id, idempotency_key),
  check (max_attempts > 0)
);

create index background_jobs_claim_idx
  on integration.background_jobs (status, available_at, created_at)
  where status in ('queued', 'retry');

create table integration.integration_sync_runs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references app.organizations(id),
  integration_code text not null,
  direction text not null check (direction in ('inbound', 'outbound', 'bidirectional')),
  started_at timestamptz not null default statement_timestamp(),
  completed_at timestamptz,
  status text not null check (status in ('running', 'succeeded', 'partial', 'failed')),
  source_watermark text,
  target_watermark text,
  counts jsonb not null default '{}'::jsonb,
  error_summary jsonb
);

create table audit.audit_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references app.organizations(id),
  sequence_number bigint not null,
  actor_user_id uuid references app.user_profiles(id),
  actor_subject text,
  action text not null,
  entity_schema text not null,
  entity_table text not null,
  entity_id text,
  occurred_at timestamptz not null default statement_timestamp(),
  transaction_id bigint not null default txid_current(),
  request_id text,
  source_ip inet,
  user_agent text,
  before_data jsonb,
  after_data jsonb,
  metadata jsonb not null default '{}'::jsonb,
  previous_hash bytea,
  event_hash bytea not null,
  unique (organization_id, sequence_number),
  unique (organization_id, event_hash)
);

create index audit_events_entity_idx
  on audit.audit_events (organization_id, entity_table, entity_id, occurred_at);

create table audit.access_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references app.organizations(id),
  actor_user_id uuid references app.user_profiles(id),
  subject_person_id uuid references app.people(id),
  access_type text not null check (access_type in ('view', 'search', 'export', 'print', 'disclose')),
  purpose text not null,
  resource_type text not null,
  resource_id text,
  occurred_at timestamptz not null default statement_timestamp(),
  request_id text,
  source_ip inet,
  metadata jsonb not null default '{}'::jsonb
);

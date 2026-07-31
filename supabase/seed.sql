-- Synthetic demonstration data only.
-- Names, identifiers, Vision IDs, approvals, events, grades, and citations below
-- are invented for software testing and are not approved operational content.

begin;

insert into app.organizations (
  id, code, legal_name, default_time_zone, data_classification
) values (
  '10000000-0000-4000-8000-000000000001',
  'ATQ-DEMO',
  'Atlas Training Quality — Synthetic Demonstration',
  'America/New_York',
  'internal'
);

insert into app.user_profiles (
  id, organization_id, auth_subject, identity_provider, provider_subject,
  display_name, email, status
) values
  (
    '11000000-0000-4000-8000-000000000001',
    '10000000-0000-4000-8000-000000000001',
    '11111111-1111-4111-8111-111111111111',
    'demo', 'demo-admin', 'Morgan Admin (Synthetic)',
    'morgan.admin@example.invalid', 'active'
  ),
  (
    '11000000-0000-4000-8000-000000000002',
    '10000000-0000-4000-8000-000000000001',
    '22222222-2222-4222-8222-222222222222',
    'demo', 'demo-instructor', 'Taylor Instructor (Synthetic)',
    'taylor.instructor@example.invalid', 'active'
  ),
  (
    '11000000-0000-4000-8000-000000000003',
    '10000000-0000-4000-8000-000000000001',
    '33333333-3333-4333-8333-333333333333',
    'demo', 'demo-records', 'Avery Records (Synthetic)',
    'avery.records@example.invalid', 'active'
  );

insert into app.fleets (id, organization_id, code, display_name) values
  (
    '12000000-0000-4000-8000-000000000001',
    '10000000-0000-4000-8000-000000000001',
    'B747', 'Boeing 747'
  ),
  (
    '12000000-0000-4000-8000-000000000002',
    '10000000-0000-4000-8000-000000000001',
    'B777', 'Boeing 777'
  );

insert into app.bases (id, organization_id, code, display_name, iata_code, time_zone)
values
  (
    '13000000-0000-4000-8000-000000000001',
    '10000000-0000-4000-8000-000000000001',
    'ANC', 'Anchorage', 'ANC', 'America/Anchorage'
  ),
  (
    '13000000-0000-4000-8000-000000000002',
    '10000000-0000-4000-8000-000000000001',
    'CVG', 'Cincinnati', 'CVG', 'America/New_York'
  );

insert into app.seats (id, organization_id, code, display_name, sort_order) values
  (
    '14000000-0000-4000-8000-000000000001',
    '10000000-0000-4000-8000-000000000001',
    'CA', 'Captain', 10
  ),
  (
    '14000000-0000-4000-8000-000000000002',
    '10000000-0000-4000-8000-000000000001',
    'FO', 'First Officer', 20
  ),
  (
    '14000000-0000-4000-8000-000000000003',
    '10000000-0000-4000-8000-000000000001',
    'OBS', 'Observer', 30
  );

insert into app.curriculum_types (
  id, organization_id, code, display_name, transition_basis
) values
  (
    '15000000-0000-4000-8000-000000000001',
    '10000000-0000-4000-8000-000000000001',
    'CQ', 'Continuing Qualification', 'cq_cycle_start_date'
  ),
  (
    '15000000-0000-4000-8000-000000000002',
    '10000000-0000-4000-8000-000000000001',
    'QUAL', 'Qualification', 'curriculum_start_date'
  ),
  (
    '15000000-0000-4000-8000-000000000003',
    '10000000-0000-4000-8000-000000000001',
    'INDOC', 'Indoctrination', 'curriculum_start_date'
  );

insert into app.reason_codes (id, organization_id, code, display_name, category)
values
  (
    '16000000-0000-4000-8000-000000000001',
    '10000000-0000-4000-8000-000000000001',
    'ROUTINE', 'Routine recurrent event', 'routine'
  ),
  (
    '16000000-0000-4000-8000-000000000002',
    '10000000-0000-4000-8000-000000000001',
    'REQUAL', 'Requalification after interruption', 'requalification'
  );

insert into app.people (id, organization_id, data_classification, source_system, created_by)
values
  (
    '20000000-0000-4000-8000-000000000001',
    '10000000-0000-4000-8000-000000000001',
    'confidential', 'SYNTHETIC',
    '11000000-0000-4000-8000-000000000001'
  ),
  (
    '20000000-0000-4000-8000-000000000002',
    '10000000-0000-4000-8000-000000000001',
    'confidential', 'SYNTHETIC',
    '11000000-0000-4000-8000-000000000001'
  ),
  (
    '20000000-0000-4000-8000-000000000003',
    '10000000-0000-4000-8000-000000000001',
    'confidential', 'SYNTHETIC',
    '11000000-0000-4000-8000-000000000001'
  );

insert into app.person_external_identifiers (
  id, organization_id, person_id, source_system, identifier_type,
  identifier_value, is_primary, valid_from
) values
  (
    '20100000-0000-4000-8000-000000000001',
    '10000000-0000-4000-8000-000000000001',
    '20000000-0000-4000-8000-000000000001',
    'SYNTHETIC', 'employee_number', 'SYN-1001', true, '2025-01-01'
  ),
  (
    '20100000-0000-4000-8000-000000000002',
    '10000000-0000-4000-8000-000000000001',
    '20000000-0000-4000-8000-000000000002',
    'SYNTHETIC', 'employee_number', 'SYN-2001', true, '2025-01-01'
  ),
  (
    '20100000-0000-4000-8000-000000000003',
    '10000000-0000-4000-8000-000000000001',
    '20000000-0000-4000-8000-000000000003',
    'SYNTHETIC', 'employee_number', 'SYN-1002', true, '2025-01-01'
  );

insert into app.person_versions (
  id, person_id, organization_id, given_name, family_name, preferred_name,
  employment_status, valid_from, recorded_by, change_reason
) values
  (
    '21000000-0000-4000-8000-000000000001',
    '20000000-0000-4000-8000-000000000001',
    '10000000-0000-4000-8000-000000000001',
    'Jordan', 'Example', 'Jordan', 'synthetic', '2025-01-01',
    '11000000-0000-4000-8000-000000000001', 'Synthetic seed'
  ),
  (
    '21000000-0000-4000-8000-000000000002',
    '20000000-0000-4000-8000-000000000002',
    '10000000-0000-4000-8000-000000000001',
    'Taylor', 'Instructor', 'Taylor', 'synthetic', '2025-01-01',
    '11000000-0000-4000-8000-000000000001', 'Synthetic seed'
  ),
  (
    '21000000-0000-4000-8000-000000000003',
    '20000000-0000-4000-8000-000000000003',
    '10000000-0000-4000-8000-000000000001',
    'Riley', 'Sample', 'Riley', 'synthetic', '2025-01-01',
    '11000000-0000-4000-8000-000000000001', 'Synthetic seed'
  );

insert into app.positions (id, organization_id, person_id, created_by) values
  (
    '22000000-0000-4000-8000-000000000001',
    '10000000-0000-4000-8000-000000000001',
    '20000000-0000-4000-8000-000000000001',
    '11000000-0000-4000-8000-000000000001'
  ),
  (
    '22000000-0000-4000-8000-000000000002',
    '10000000-0000-4000-8000-000000000001',
    '20000000-0000-4000-8000-000000000002',
    '11000000-0000-4000-8000-000000000001'
  ),
  (
    '22000000-0000-4000-8000-000000000003',
    '10000000-0000-4000-8000-000000000001',
    '20000000-0000-4000-8000-000000000003',
    '11000000-0000-4000-8000-000000000001'
  );

insert into app.position_versions (
  id, position_id, organization_id, fleet_id, seat_id, base_id,
  position_status, is_instructor, is_evaluator, valid_from,
  recorded_by, change_reason
) values
  (
    '22100000-0000-4000-8000-000000000001',
    '22000000-0000-4000-8000-000000000001',
    '10000000-0000-4000-8000-000000000001',
    '12000000-0000-4000-8000-000000000001',
    '14000000-0000-4000-8000-000000000001',
    '13000000-0000-4000-8000-000000000001',
    'qualified', false, false, '2025-01-01',
    '11000000-0000-4000-8000-000000000001', 'Synthetic seed'
  ),
  (
    '22100000-0000-4000-8000-000000000002',
    '22000000-0000-4000-8000-000000000002',
    '10000000-0000-4000-8000-000000000001',
    '12000000-0000-4000-8000-000000000001',
    '14000000-0000-4000-8000-000000000001',
    '13000000-0000-4000-8000-000000000002',
    'qualified', true, true, '2025-01-01',
    '11000000-0000-4000-8000-000000000001', 'Synthetic seed'
  ),
  (
    '22100000-0000-4000-8000-000000000003',
    '22000000-0000-4000-8000-000000000003',
    '10000000-0000-4000-8000-000000000001',
    '12000000-0000-4000-8000-000000000001',
    '14000000-0000-4000-8000-000000000002',
    '13000000-0000-4000-8000-000000000002',
    'qualified', false, false, '2025-01-01',
    '11000000-0000-4000-8000-000000000001', 'Synthetic seed'
  );

insert into app.programs (id, organization_id, code, program_type, display_name)
values
  (
    '30000000-0000-4000-8000-000000000001',
    '10000000-0000-4000-8000-000000000001',
    'NO', 'NO', 'Subpart N&O'
  ),
  (
    '30000000-0000-4000-8000-000000000002',
    '10000000-0000-4000-8000-000000000001',
    'AQP', 'AQP', 'Advanced Qualification Program'
  );

insert into app.program_versions (
  id, program_id, organization_id, version_label, lifecycle_status,
  approval_reference, reactivation_readiness, valid_from, recorded_by
) values
  (
    '30100000-0000-4000-8000-000000000001',
    '30000000-0000-4000-8000-000000000001',
    '10000000-0000-4000-8000-000000000001',
    'DEMO-NO-1', 'active', 'SYNTHETIC-NOT-APPROVED',
    'Synthetic configuration is queryable', '2025-01-01',
    '11000000-0000-4000-8000-000000000001'
  ),
  (
    '30100000-0000-4000-8000-000000000002',
    '30000000-0000-4000-8000-000000000002',
    '10000000-0000-4000-8000-000000000001',
    'DEMO-AQP-1', 'active', 'SYNTHETIC-NOT-APPROVED',
    null, '2026-02-01',
    '11000000-0000-4000-8000-000000000001'
  );

insert into app.program_transition_rules (
  id, organization_id, population_code, fleet_id, curriculum_type_id, target_program_id
) values (
  '31000000-0000-4000-8000-000000000001',
  '10000000-0000-4000-8000-000000000001',
  'B747-PILOT-CQ',
  '12000000-0000-4000-8000-000000000001',
  '15000000-0000-4000-8000-000000000001',
  '30000000-0000-4000-8000-000000000002'
);

insert into app.program_transition_rule_versions (
  id, transition_rule_id, organization_id, phase, transition_date,
  implementation_status, authority_reference, rule_config, valid_from,
  recorded_by, change_reason
) values (
  '31100000-0000-4000-8000-000000000001',
  '31000000-0000-4000-8000-000000000001',
  '10000000-0000-4000-8000-000000000001',
  'III', '2026-02-01', 'implemented', 'SYNTHETIC-MATS',
  '{"basis":"cq_cycle_start_date","synthetic":true}'::jsonb,
  '2026-01-01',
  '11000000-0000-4000-8000-000000000001',
  'Synthetic B747 CQ transition'
);

insert into app.program_assignment_overrides (
  id, organization_id, person_id, fleet_id, seat_id, curriculum_type_id
) values (
  '31200000-0000-4000-8000-000000000001',
  '10000000-0000-4000-8000-000000000001',
  '20000000-0000-4000-8000-000000000003',
  '12000000-0000-4000-8000-000000000001',
  '14000000-0000-4000-8000-000000000002',
  '15000000-0000-4000-8000-000000000001'
);

insert into app.program_assignment_override_versions (
  id, override_id, organization_id, program_id, authority_reference, reason,
  approved_by, approval_record_key, valid_from, valid_to, recorded_by
) values (
  '31300000-0000-4000-8000-000000000001',
  '31200000-0000-4000-8000-000000000001',
  '10000000-0000-4000-8000-000000000001',
  '30000000-0000-4000-8000-000000000001',
  'SYNTHETIC-DEMO-AUTHORITY',
  'Demonstrates an approved individual override; not an operational decision.',
  '11000000-0000-4000-8000-000000000001',
  'atq-evidence/10000000-0000-4000-8000-000000000001/audit/demo-override.json',
  '2026-07-01', '2026-09-01',
  '11000000-0000-4000-8000-000000000001'
);

insert into app.curricula (
  id, organization_id, code, program_id, fleet_id, curriculum_type_id
) values
  (
    '32000000-0000-4000-8000-000000000001',
    '10000000-0000-4000-8000-000000000001',
    'SYN-B747-AQP-CQ',
    '30000000-0000-4000-8000-000000000002',
    '12000000-0000-4000-8000-000000000001',
    '15000000-0000-4000-8000-000000000001'
  ),
  (
    '32000000-0000-4000-8000-000000000002',
    '10000000-0000-4000-8000-000000000001',
    'SYN-B747-NO-CQ',
    '30000000-0000-4000-8000-000000000001',
    '12000000-0000-4000-8000-000000000001',
    '15000000-0000-4000-8000-000000000001'
  );

insert into app.curriculum_versions (
  id, curriculum_id, organization_id, version_label, title, lifecycle_status,
  aqp_phase, faa_approval_status, approval_reference, seat_codes,
  rule_snapshot, content_hash, valid_from, recorded_by, change_reason
) values
  (
    '32100000-0000-4000-8000-000000000001',
    '32000000-0000-4000-8000-000000000001',
    '10000000-0000-4000-8000-000000000001',
    'SYN-2026.1', 'Synthetic B747 AQP CQ', 'published',
    'III', 'pending', 'SYNTHETIC-NOT-APPROVED', array['CA', 'FO'],
    '{"synthetic":true,"cycle":"EP1"}'::jsonb,
    extensions.digest('synthetic-b747-aqp-cq-v1', 'sha256'),
    '2026-02-01',
    '11000000-0000-4000-8000-000000000001',
    'Synthetic seed'
  ),
  (
    '32100000-0000-4000-8000-000000000002',
    '32000000-0000-4000-8000-000000000002',
    '10000000-0000-4000-8000-000000000001',
    'SYN-2025.1', 'Synthetic B747 N&O Recurrent', 'published',
    null, 'not_required', 'SYNTHETIC-NOT-APPROVED', array['CA', 'FO'],
    '{"synthetic":true}'::jsonb,
    extensions.digest('synthetic-b747-no-cq-v1', 'sha256'),
    '2025-01-01',
    '11000000-0000-4000-8000-000000000001',
    'Synthetic seed'
  );

insert into app.curriculum_nodes (
  id, organization_id, curriculum_id, stable_code
) values
  ('32200000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', '32000000-0000-4000-8000-000000000001', 'SEG-FLIGHT'),
  ('32200000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000001', '32000000-0000-4000-8000-000000000001', 'MOD-EP1'),
  ('32200000-0000-4000-8000-000000000003', '10000000-0000-4000-8000-000000000001', '32000000-0000-4000-8000-000000000001', 'LESSON-MV'),
  ('32200000-0000-4000-8000-000000000004', '10000000-0000-4000-8000-000000000001', '32000000-0000-4000-8000-000000000001', 'ELEMENT-SYN-01'),
  ('32200000-0000-4000-8000-000000000005', '10000000-0000-4000-8000-000000000001', '32000000-0000-4000-8000-000000000002', 'NO-SEG-FLIGHT'),
  ('32200000-0000-4000-8000-000000000006', '10000000-0000-4000-8000-000000000001', '32000000-0000-4000-8000-000000000002', 'NO-MOD-RSYN'),
  ('32200000-0000-4000-8000-000000000007', '10000000-0000-4000-8000-000000000001', '32000000-0000-4000-8000-000000000002', 'NO-LESSON-PC');

insert into app.curriculum_node_versions (
  id, curriculum_node_id, organization_id, curriculum_version_id, parent_node_id,
  node_type, outline_number, module_code, title, sequence, planned_minutes,
  governing_citations, structured_rules, valid_from, recorded_by
) values
  ('32300000-0000-4000-8000-000000000001', '32200000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', '32100000-0000-4000-8000-000000000001', null, 'segment', '1', null, 'Synthetic flight segment', 1, 240, '[]', '[]', '2026-02-01', '11000000-0000-4000-8000-000000000001'),
  ('32300000-0000-4000-8000-000000000002', '32200000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000001', '32100000-0000-4000-8000-000000000001', '32200000-0000-4000-8000-000000000001', 'module', '1.1', 'SYN-EP1', 'Synthetic EP1 module', 1, 240, '[]', '[]', '2026-02-01', '11000000-0000-4000-8000-000000000001'),
  ('32300000-0000-4000-8000-000000000003', '32200000-0000-4000-8000-000000000003', '10000000-0000-4000-8000-000000000001', '32100000-0000-4000-8000-000000000001', '32200000-0000-4000-8000-000000000002', 'lesson', '1.1.1', null, 'Synthetic maneuvers lesson', 1, 120, '[]', '[]', '2026-02-01', '11000000-0000-4000-8000-000000000001'),
  ('32300000-0000-4000-8000-000000000004', '32200000-0000-4000-8000-000000000004', '10000000-0000-4000-8000-000000000001', '32100000-0000-4000-8000-000000000001', '32200000-0000-4000-8000-000000000003', 'lesson_element', '1.1.1.1', null, 'Synthetic evaluation element', 1, 30, '[]', '[]', '2026-02-01', '11000000-0000-4000-8000-000000000001'),
  ('32300000-0000-4000-8000-000000000005', '32200000-0000-4000-8000-000000000005', '10000000-0000-4000-8000-000000000001', '32100000-0000-4000-8000-000000000002', null, 'segment', '1', null, 'Synthetic recurrent segment', 1, 240, '[]', '[]', '2025-01-01', '11000000-0000-4000-8000-000000000001'),
  ('32300000-0000-4000-8000-000000000006', '32200000-0000-4000-8000-000000000006', '10000000-0000-4000-8000-000000000001', '32100000-0000-4000-8000-000000000002', '32200000-0000-4000-8000-000000000005', 'module', '1.1', 'RSYN.1', 'Synthetic recurrent module', 1, 240, '[]', '[]', '2025-01-01', '11000000-0000-4000-8000-000000000001'),
  ('32300000-0000-4000-8000-000000000007', '32200000-0000-4000-8000-000000000007', '10000000-0000-4000-8000-000000000001', '32100000-0000-4000-8000-000000000002', '32200000-0000-4000-8000-000000000006', 'lesson', '1.1.1', null, 'Synthetic proficiency lesson', 1, 120, '[]', '[]', '2025-01-01', '11000000-0000-4000-8000-000000000001');

insert into app.tasks (id, organization_id, vision_task_id, source_system)
values
  (
    '40000000-0000-4000-8000-000000000001',
    '10000000-0000-4000-8000-000000000001',
    9900001, 'VISION-SYNTHETIC'
  ),
  (
    '40000000-0000-4000-8000-000000000002',
    '10000000-0000-4000-8000-000000000001',
    9900002, 'VISION-SYNTHETIC'
  );

insert into app.task_versions (
  id, task_id, organization_id, task_type, outline_number, title,
  criticality, currency_interval_months, performance_standard,
  observable_behaviors, source_revision, valid_from, recorded_by
) values
  (
    '40100000-0000-4000-8000-000000000001',
    '40000000-0000-4000-8000-000000000001',
    '10000000-0000-4000-8000-000000000001',
    'task', 'SYN.1', 'Synthetic flight-path task', 4, 12,
    '{"notice":"Synthetic placeholder; no operational standard."}'::jsonb,
    '["SYN-COMMUNICATION"]'::jsonb, 'SYN-1', '2026-01-01',
    '11000000-0000-4000-8000-000000000001'
  ),
  (
    '40100000-0000-4000-8000-000000000002',
    '40000000-0000-4000-8000-000000000002',
    '10000000-0000-4000-8000-000000000001',
    'SPO', 'SYN.2', 'Synthetic crew-coordination objective', 3, 24,
    '{"notice":"Synthetic placeholder; no operational standard."}'::jsonb,
    '["SYN-TEAMWORK"]'::jsonb, 'SYN-1', '2026-01-01',
    '11000000-0000-4000-8000-000000000001'
  );

insert into app.curriculum_task_allocations (
  id, organization_id, curriculum_version_id, curriculum_node_id, task_id,
  duty_position_code, allocation_kind, cycle_slot, event_set_code, sequence
) values
  (
    '40200000-0000-4000-8000-000000000001',
    '10000000-0000-4000-8000-000000000001',
    '32100000-0000-4000-8000-000000000001',
    '32200000-0000-4000-8000-000000000004',
    '40000000-0000-4000-8000-000000000001',
    'CA', 'evaluate', 'EP1', 'SYN-SET-A', 1
  ),
  (
    '40200000-0000-4000-8000-000000000002',
    '10000000-0000-4000-8000-000000000001',
    '32100000-0000-4000-8000-000000000001',
    '32200000-0000-4000-8000-000000000004',
    '40000000-0000-4000-8000-000000000002',
    'CREW', 'evaluate', 'EP1', 'SYN-SET-A', 2
  );

insert into app.form_definitions (id, organization_id, code, title, owner_user_id)
values
  (
    '41000000-0000-4000-8000-000000000001',
    '10000000-0000-4000-8000-000000000001',
    'SYN-AQP-CQ-GRADE',
    'Synthetic AQP CQ Grade Sheet',
    '11000000-0000-4000-8000-000000000001'
  ),
  (
    '41000000-0000-4000-8000-000000000002',
    '10000000-0000-4000-8000-000000000001',
    'SYN-NO-RECURRENT',
    'Synthetic N&O Recurrent Grade Sheet',
    '11000000-0000-4000-8000-000000000001'
  );

insert into app.form_definition_versions (
  id, form_definition_id, organization_id, version_label, lifecycle_status,
  form_schema, validation_schema, outcome_rules, print_schema, citations,
  content_hash, valid_from, recorded_by, approved_by, approved_at
) values
  (
    '41100000-0000-4000-8000-000000000001',
    '41000000-0000-4000-8000-000000000001',
    '10000000-0000-4000-8000-000000000001',
    'SYN-2026-07-01', 'published',
    '{"title":"Synthetic AQP CQ Grade Sheet","fields":[{"key":"taskRatings","type":"task_rating_matrix","dimensions":["technical","procedural","awareness","crm"]}],"synthetic":true}'::jsonb,
    '{"required":["taskRatings"]}'::jsonb,
    '[{"when":{"all_dimensions_gte":3},"effect":"satisfactory"}]'::jsonb,
    '{"paper":"letter","synthetic":true}'::jsonb,
    '[]'::jsonb,
    extensions.digest('synthetic-aqp-form-v1', 'sha256'),
    '2026-02-01',
    '11000000-0000-4000-8000-000000000001',
    '11000000-0000-4000-8000-000000000001',
    '2026-01-15T15:00:00Z'
  ),
  (
    '41100000-0000-4000-8000-000000000002',
    '41000000-0000-4000-8000-000000000002',
    '10000000-0000-4000-8000-000000000001',
    'SYN-2025-01-01', 'published',
    '{"title":"Synthetic N&O Recurrent Grade Sheet","fields":[{"key":"singleGrade","type":"single_grade"}],"synthetic":true}'::jsonb,
    '{"required":["singleGrade"]}'::jsonb,
    '[{"when":{"grade":"SAT"},"effect":"satisfactory"}]'::jsonb,
    '{"paper":"letter","synthetic":true}'::jsonb,
    '[]'::jsonb,
    extensions.digest('synthetic-no-form-v1', 'sha256'),
    '2025-01-01',
    '11000000-0000-4000-8000-000000000001',
    '11000000-0000-4000-8000-000000000001',
    '2024-12-15T15:00:00Z'
  );

insert into app.form_bindings (id, organization_id, form_definition_id, curriculum_id)
values
  ('41200000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', '41000000-0000-4000-8000-000000000001', '32000000-0000-4000-8000-000000000001'),
  ('41200000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000001', '41000000-0000-4000-8000-000000000002', '32000000-0000-4000-8000-000000000002');

insert into app.form_binding_versions (
  id, form_binding_id, organization_id, form_definition_version_id, program_id,
  fleet_id, curriculum_type_id, reason_code_id, event_type, priority,
  constraints_json, valid_from, recorded_by
) values
  (
    '41300000-0000-4000-8000-000000000001',
    '41200000-0000-4000-8000-000000000001',
    '10000000-0000-4000-8000-000000000001',
    '41100000-0000-4000-8000-000000000001',
    '30000000-0000-4000-8000-000000000002',
    '12000000-0000-4000-8000-000000000001',
    '15000000-0000-4000-8000-000000000001',
    '16000000-0000-4000-8000-000000000001',
    'CQ_EVALUATION', 10, '{"synthetic":true}', '2026-02-01',
    '11000000-0000-4000-8000-000000000001'
  ),
  (
    '41300000-0000-4000-8000-000000000002',
    '41200000-0000-4000-8000-000000000002',
    '10000000-0000-4000-8000-000000000001',
    '41100000-0000-4000-8000-000000000002',
    '30000000-0000-4000-8000-000000000001',
    '12000000-0000-4000-8000-000000000001',
    '15000000-0000-4000-8000-000000000001',
    '16000000-0000-4000-8000-000000000001',
    'CQ_EVALUATION', 10, '{"synthetic":true}', '2025-01-01',
    '11000000-0000-4000-8000-000000000001'
  );

insert into app.program_resolution_log (
  id, organization_id, person_id, fleet_id, seat_id, curriculum_type_id,
  event_date, curriculum_start_date, reason_code_id, as_known_at,
  input_snapshot, resolution_status, program_id, curriculum_version_id,
  form_definition_version_id, rule_set_ref, reasoning_chain, warnings,
  resolved_at, resolved_by, resolver_version, decision_hash
) values
  (
    '42000000-0000-4000-8000-000000000001',
    '10000000-0000-4000-8000-000000000001',
    '20000000-0000-4000-8000-000000000001',
    '12000000-0000-4000-8000-000000000001',
    '14000000-0000-4000-8000-000000000001',
    '15000000-0000-4000-8000-000000000001',
    '2026-08-05', '2026-08-01',
    '16000000-0000-4000-8000-000000000001',
    '2026-07-30T20:00:00Z',
    '{"personId":"20000000-0000-4000-8000-000000000001","fleetCode":"B747","seatCode":"CA","curriculumType":"CQ","eventDate":"2026-08-05","curriculumStartDate":"2026-08-01","synthetic":true}'::jsonb,
    'resolved',
    '30000000-0000-4000-8000-000000000002',
    '32100000-0000-4000-8000-000000000001',
    '41100000-0000-4000-8000-000000000001',
    'SYNTHETIC-MATS',
    '[{"step":"transition","message":"Synthetic B747 CQ transition date is 2026-02-01."},{"step":"governing_date","message":"CQ cycle began 2026-08-01."},{"step":"program","message":"AQP selected for synthetic demonstration."}]'::jsonb,
    '[]'::jsonb,
    '2026-07-30T20:00:00Z',
    '11000000-0000-4000-8000-000000000001',
    'atq-program-resolver/1.0.0',
    extensions.digest('synthetic-resolution-aqp', 'sha256')
  ),
  (
    '42000000-0000-4000-8000-000000000002',
    '10000000-0000-4000-8000-000000000001',
    '20000000-0000-4000-8000-000000000003',
    '12000000-0000-4000-8000-000000000001',
    '14000000-0000-4000-8000-000000000002',
    '15000000-0000-4000-8000-000000000001',
    '2026-08-07', '2026-08-01',
    '16000000-0000-4000-8000-000000000001',
    '2026-07-30T20:00:00Z',
    '{"personId":"20000000-0000-4000-8000-000000000003","fleetCode":"B747","seatCode":"FO","curriculumType":"CQ","eventDate":"2026-08-07","curriculumStartDate":"2026-08-01","synthetic":true}'::jsonb,
    'resolved',
    '30000000-0000-4000-8000-000000000001',
    '32100000-0000-4000-8000-000000000002',
    '41100000-0000-4000-8000-000000000002',
    'SYNTHETIC-DEMO-AUTHORITY',
    '[{"step":"override","message":"A valid synthetic individual override selected N&O."}]'::jsonb,
    '[]'::jsonb,
    '2026-07-30T20:00:00Z',
    '11000000-0000-4000-8000-000000000001',
    'atq-program-resolver/1.0.0',
    extensions.digest('synthetic-resolution-no', 'sha256')
  );

insert into app.training_devices (
  id, organization_id, code, display_name, device_type, fleet_id, location_base_id
) values (
  '43000000-0000-4000-8000-000000000001',
  '10000000-0000-4000-8000-000000000001',
  'SYN-B747-FSTD-01', 'Synthetic B747 FSTD 01', 'FSTD',
  '12000000-0000-4000-8000-000000000001',
  '13000000-0000-4000-8000-000000000002'
);

insert into app.training_device_versions (
  id, training_device_id, organization_id, qualification_status,
  qualification_reference, limitations, valid_from, recorded_by
) values (
  '43100000-0000-4000-8000-000000000001',
  '43000000-0000-4000-8000-000000000001',
  '10000000-0000-4000-8000-000000000001',
  'qualified', 'SYNTHETIC-NOT-AN-APPROVAL', '[]',
  '2026-01-01', '11000000-0000-4000-8000-000000000001'
);

insert into app.training_events (
  id, organization_id, source_system, external_event_id, created_by
) values
  (
    '44000000-0000-4000-8000-000000000001',
    '10000000-0000-4000-8000-000000000001',
    'SYNTHETIC', 'SYN-EVT-20260805-01',
    '11000000-0000-4000-8000-000000000003'
  ),
  (
    '44000000-0000-4000-8000-000000000002',
    '10000000-0000-4000-8000-000000000001',
    'SYNTHETIC', 'SYN-EVT-20260807-01',
    '11000000-0000-4000-8000-000000000003'
  );

insert into app.training_event_versions (
  id, training_event_id, organization_id, event_type, reason_code_id,
  fleet_id, curriculum_type_id, curriculum_version_id, program_id,
  training_device_id, location_base_id, scheduled_start_at, scheduled_end_at,
  curriculum_start_date, event_status, valid_from, recorded_by, change_reason
) values
  (
    '44100000-0000-4000-8000-000000000001',
    '44000000-0000-4000-8000-000000000001',
    '10000000-0000-4000-8000-000000000001',
    'CQ_EVALUATION', '16000000-0000-4000-8000-000000000001',
    '12000000-0000-4000-8000-000000000001',
    '15000000-0000-4000-8000-000000000001',
    '32100000-0000-4000-8000-000000000001',
    '30000000-0000-4000-8000-000000000002',
    '43000000-0000-4000-8000-000000000001',
    '13000000-0000-4000-8000-000000000002',
    '2026-08-05T13:00:00Z', '2026-08-05T17:00:00Z',
    '2026-08-01', 'completed', '2026-08-05',
    '11000000-0000-4000-8000-000000000003', 'Synthetic seed'
  ),
  (
    '44100000-0000-4000-8000-000000000002',
    '44000000-0000-4000-8000-000000000002',
    '10000000-0000-4000-8000-000000000001',
    'CQ_EVALUATION', '16000000-0000-4000-8000-000000000001',
    '12000000-0000-4000-8000-000000000001',
    '15000000-0000-4000-8000-000000000001',
    '32100000-0000-4000-8000-000000000002',
    '30000000-0000-4000-8000-000000000001',
    '43000000-0000-4000-8000-000000000001',
    '13000000-0000-4000-8000-000000000002',
    '2026-08-07T13:00:00Z', '2026-08-07T17:00:00Z',
    '2026-08-01', 'assigned', '2026-08-07',
    '11000000-0000-4000-8000-000000000003', 'Synthetic seed'
  );

insert into app.event_participants (id, organization_id, training_event_id, person_id)
values
  ('44200000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', '44000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000001'),
  ('44200000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000001', '44000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000002'),
  ('44200000-0000-4000-8000-000000000003', '10000000-0000-4000-8000-000000000001', '44000000-0000-4000-8000-000000000002', '20000000-0000-4000-8000-000000000003'),
  ('44200000-0000-4000-8000-000000000004', '10000000-0000-4000-8000-000000000001', '44000000-0000-4000-8000-000000000002', '20000000-0000-4000-8000-000000000002');

insert into app.event_participant_versions (
  id, event_participant_id, organization_id, participant_role, duty_seat_id,
  assignment_status, valid_from, recorded_by
) values
  ('44300000-0000-4000-8000-000000000001', '44200000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'student', '14000000-0000-4000-8000-000000000001', 'attended', '2026-08-05', '11000000-0000-4000-8000-000000000003'),
  ('44300000-0000-4000-8000-000000000002', '44200000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000001', 'evaluator', '14000000-0000-4000-8000-000000000002', 'attended', '2026-08-05', '11000000-0000-4000-8000-000000000003'),
  ('44300000-0000-4000-8000-000000000003', '44200000-0000-4000-8000-000000000003', '10000000-0000-4000-8000-000000000001', 'student', '14000000-0000-4000-8000-000000000002', 'confirmed', '2026-08-07', '11000000-0000-4000-8000-000000000003'),
  ('44300000-0000-4000-8000-000000000004', '44200000-0000-4000-8000-000000000004', '10000000-0000-4000-8000-000000000001', 'evaluator', '14000000-0000-4000-8000-000000000001', 'confirmed', '2026-08-07', '11000000-0000-4000-8000-000000000003');

insert into app.form_instances (
  id, organization_id, training_event_id, program_resolution_id,
  form_definition_version_id, subject_person_id, current_state,
  current_revision, lock_version, client_instance_id, originating_device_id,
  synchronization_status, owner_user_id, due_at, submitted_at, approved_at
) values (
  '45000000-0000-4000-8000-000000000001',
  '10000000-0000-4000-8000-000000000001',
  '44000000-0000-4000-8000-000000000001',
  '42000000-0000-4000-8000-000000000001',
  '41100000-0000-4000-8000-000000000001',
  '20000000-0000-4000-8000-000000000001',
  'approved', 1, 1,
  '45000000-0000-4000-8000-000000000101',
  'SYNTHETIC-IPAD-01', 'synced',
  '11000000-0000-4000-8000-000000000002',
  '2026-08-06T04:00:00Z',
  '2026-08-05T17:10:00Z',
  '2026-08-05T19:00:00Z'
);

insert into app.form_instance_revisions (
  id, organization_id, form_instance_id, revision_number, revision_kind,
  payload, schema_snapshot, program_snapshot, authorization_snapshot,
  content_hash, client_recorded_at, recorded_at, recorded_by, idempotency_key
) values (
  '45100000-0000-4000-8000-000000000001',
  '10000000-0000-4000-8000-000000000001',
  '45000000-0000-4000-8000-000000000001',
  1, 'submission',
  '{"synthetic":true,"outcome":"satisfactory","note":"Demonstration only."}'::jsonb,
  '{"formVersionId":"41100000-0000-4000-8000-000000000001"}'::jsonb,
  '{"program":"AQP","curriculumVersionId":"32100000-0000-4000-8000-000000000001"}'::jsonb,
  '{"evaluatorAuthorized":true,"synthetic":true}'::jsonb,
  extensions.digest('synthetic-form-revision-1', 'sha256'),
  '2026-08-05T17:09:00Z',
  '2026-08-05T17:10:00Z',
  '11000000-0000-4000-8000-000000000002',
  '45100000-0000-4000-8000-000000000101'
);

insert into app.form_instance_state_events (
  id, organization_id, form_instance_id, from_state, to_state, reason_code,
  revision_id, occurred_at, actor_user_id, idempotency_key
) values
  (
    '45200000-0000-4000-8000-000000000001',
    '10000000-0000-4000-8000-000000000001',
    '45000000-0000-4000-8000-000000000001',
    'ready_for_signature', 'submitted', 'SYNTHETIC_SUBMISSION',
    '45100000-0000-4000-8000-000000000001',
    '2026-08-05T17:10:00Z',
    '11000000-0000-4000-8000-000000000002',
    '45200000-0000-4000-8000-000000000101'
  ),
  (
    '45200000-0000-4000-8000-000000000002',
    '10000000-0000-4000-8000-000000000001',
    '45000000-0000-4000-8000-000000000001',
    'qc_review', 'approved', 'SYNTHETIC_QC',
    '45100000-0000-4000-8000-000000000001',
    '2026-08-05T19:00:00Z',
    '11000000-0000-4000-8000-000000000003',
    '45200000-0000-4000-8000-000000000102'
  );

insert into app.form_subjects (
  id, organization_id, form_instance_id, person_id, event_participant_id,
  subject_kind, duty_seat_id
) values (
  '45300000-0000-4000-8000-000000000001',
  '10000000-0000-4000-8000-000000000001',
  '45000000-0000-4000-8000-000000000001',
  '20000000-0000-4000-8000-000000000001',
  '44200000-0000-4000-8000-000000000001',
  'individual',
  '14000000-0000-4000-8000-000000000001'
);

insert into app.grading_attempts (
  id, organization_id, form_instance_id, form_subject_id, task_id,
  grading_item_key, event_set_code, attempt_number, attempt_kind,
  captured_before_training, started_at, completed_at, created_by
) values (
  '45400000-0000-4000-8000-000000000001',
  '10000000-0000-4000-8000-000000000001',
  '45000000-0000-4000-8000-000000000001',
  '45300000-0000-4000-8000-000000000001',
  '40000000-0000-4000-8000-000000000001',
  'SYN-TASK-9900001', 'SYN-SET-A', 1, 'initial', false,
  '2026-08-05T15:00:00Z', '2026-08-05T15:10:00Z',
  '11000000-0000-4000-8000-000000000002'
);

insert into app.grades (
  id, organization_id, grading_attempt_id, form_revision_id, grade_scale_code,
  overall_grade, technical_proficiency, procedural_compliance,
  situational_awareness, crew_resource_management, satisfactory,
  narrative, observable_behavior_codes, captured_at, captured_by
) values (
  '45500000-0000-4000-8000-000000000001',
  '10000000-0000-4000-8000-000000000001',
  '45400000-0000-4000-8000-000000000001',
  '45100000-0000-4000-8000-000000000001',
  'SYN-AQP-1-5', 'SAT', 4, 3, 4, 4, true,
  'Synthetic demonstration grade; not an operational evaluation.',
  array['SYN-COMMUNICATION'],
  '2026-08-05T15:10:00Z',
  '11000000-0000-4000-8000-000000000002'
);

insert into app.signatures (
  id, organization_id, form_instance_id, form_revision_id, signer_user_id,
  signer_person_id, signer_role, signature_method, signature_intent,
  signed_content_hash, identity_provider, authentication_context,
  client_signed_at, verified_at, signed_at, idempotency_key
) values (
  '45600000-0000-4000-8000-000000000001',
  '10000000-0000-4000-8000-000000000001',
  '45000000-0000-4000-8000-000000000001',
  '45100000-0000-4000-8000-000000000001',
  '11000000-0000-4000-8000-000000000002',
  '20000000-0000-4000-8000-000000000002',
  'evaluator', 'online_step_up',
  'I attest this synthetic demonstration record is complete.',
  extensions.digest('synthetic-form-revision-1', 'sha256'),
  'demo', '{"amr":["synthetic"],"demo":true}'::jsonb,
  '2026-08-05T17:09:30Z',
  '2026-08-05T17:09:31Z',
  '2026-08-05T17:09:31Z',
  '45600000-0000-4000-8000-000000000101'
);

insert into app.requirements (
  id, organization_id, code, requirement_type
) values (
  '46000000-0000-4000-8000-000000000001',
  '10000000-0000-4000-8000-000000000001',
  'SYN-B747-CQ-CURRENCY',
  'currency'
);

insert into app.requirement_versions (
  id, requirement_id, organization_id, version_label, title, program_id,
  fleet_id, seat_id, curriculum_type_id, deterministic_rule,
  calendar_convention, citations, lifecycle_status, valid_from, recorded_by
) values (
  '46100000-0000-4000-8000-000000000001',
  '46000000-0000-4000-8000-000000000001',
  '10000000-0000-4000-8000-000000000001',
  'SYN-1', 'Synthetic B747 CQ currency',
  '30000000-0000-4000-8000-000000000002',
  '12000000-0000-4000-8000-000000000001',
  '14000000-0000-4000-8000-000000000001',
  '15000000-0000-4000-8000-000000000001',
  '{"operator":"synthetic_add_months","months":12,"notice":"Not an operational rule."}'::jsonb,
  'end_of_month', '[]', 'active', '2026-02-01',
  '11000000-0000-4000-8000-000000000001'
);

insert into app.qualification_outcome_events (
  id, organization_id, person_id, requirement_id, source_form_instance_id,
  source_form_revision_id, source_event_id, outcome_type, effective_at,
  recorded_at, expires_at, outcome_payload, rule_version_id,
  idempotency_key, recorded_by
) values (
  '46200000-0000-4000-8000-000000000001',
  '10000000-0000-4000-8000-000000000001',
  '20000000-0000-4000-8000-000000000001',
  '46000000-0000-4000-8000-000000000001',
  '45000000-0000-4000-8000-000000000001',
  '45100000-0000-4000-8000-000000000001',
  '44000000-0000-4000-8000-000000000001',
  'renew',
  '2026-08-05T17:10:00Z',
  '2026-08-05T19:00:00Z',
  '2027-08-31T23:59:59Z',
  '{"synthetic":true,"baseMonth":8}'::jsonb,
  '46100000-0000-4000-8000-000000000001',
  '46200000-0000-4000-8000-000000000101',
  '11000000-0000-4000-8000-000000000003'
);

insert into app.qualification_projections (
  organization_id, person_id, requirement_id, status, effective_at, expires_at,
  base_month, last_outcome_event_id, evidence_watermark, computed_at,
  computation_version, detail
) values (
  '10000000-0000-4000-8000-000000000001',
  '20000000-0000-4000-8000-000000000001',
  '46000000-0000-4000-8000-000000000001',
  'current',
  '2026-08-05T17:10:00Z',
  '2027-08-31T23:59:59Z',
  8,
  '46200000-0000-4000-8000-000000000001',
  '2026-08-05T19:00:00Z',
  '2026-08-05T19:00:01Z',
  'synthetic-projector/1.0.0',
  '{"synthetic":true}'::jsonb
);

insert into app.notification_templates (
  id, organization_id, code, purpose
) values (
  '47000000-0000-4000-8000-000000000001',
  '10000000-0000-4000-8000-000000000001',
  'SYN-BASE-MONTH-RESET',
  'Synthetic base-month reset notice'
);

insert into app.notification_template_versions (
  id, notification_template_id, organization_id, channel, subject_template,
  body_template, variable_schema, escalation_config, lifecycle_status,
  valid_from, recorded_by
) values (
  '47100000-0000-4000-8000-000000000001',
  '47000000-0000-4000-8000-000000000001',
  '10000000-0000-4000-8000-000000000001',
  'email', '[SYNTHETIC] Base month updated',
  'Synthetic notice for {{personReference}}; no operational action.',
  '{"required":["personReference"]}'::jsonb,
  '{"afterHours":24,"synthetic":true}'::jsonb,
  'active', '2026-01-01',
  '11000000-0000-4000-8000-000000000001'
);

insert into app.notifications (
  id, organization_id, notification_template_version_id, notification_type,
  regulatory, source_entity_type, source_entity_id, payload, status,
  effective_action_at, created_at, created_by, idempotency_key
) values (
  '47200000-0000-4000-8000-000000000001',
  '10000000-0000-4000-8000-000000000001',
  '47100000-0000-4000-8000-000000000001',
  'base_month_reset', false,
  'qualification_outcome_event',
  '46200000-0000-4000-8000-000000000001',
  '{"personReference":"SYN-1001","synthetic":true}'::jsonb,
  'delivered',
  '2026-08-05T17:10:00Z',
  '2026-08-05T19:00:00Z',
  '11000000-0000-4000-8000-000000000003',
  '47200000-0000-4000-8000-000000000101'
);

insert into app.notification_deliveries (
  id, organization_id, notification_id, channel, recipient_user_id,
  recipient_address, delivery_status, provider_message_id, attempt_count,
  last_attempt_at, delivered_at
) values (
  '47300000-0000-4000-8000-000000000001',
  '10000000-0000-4000-8000-000000000001',
  '47200000-0000-4000-8000-000000000001',
  'email',
  '11000000-0000-4000-8000-000000000001',
  'morgan.admin@example.invalid',
  'delivered', 'synthetic-provider-message', 1,
  '2026-08-05T19:00:01Z',
  '2026-08-05T19:00:02Z'
);

insert into app.no_notice_programs (
  id, organization_id, program_year, fleet_id, annual_target,
  sampling_rules, lifecycle_status, created_by
) values (
  '48000000-0000-4000-8000-000000000001',
  '10000000-0000-4000-8000-000000000001',
  2026,
  '12000000-0000-4000-8000-000000000001',
  24,
  '{"synthetic":true,"geographicMinimums":{"domestic":6,"international":6}}'::jsonb,
  'active',
  '11000000-0000-4000-8000-000000000001'
);

insert into app.no_notice_assignments (
  id, organization_id, no_notice_program_id, target_person_id,
  evaluator_person_id, planned_window_start, planned_window_end,
  geographic_region_code, base_month, assignment_status, created_by
) values (
  '48100000-0000-4000-8000-000000000001',
  '10000000-0000-4000-8000-000000000001',
  '48000000-0000-4000-8000-000000000001',
  '20000000-0000-4000-8000-000000000003',
  '20000000-0000-4000-8000-000000000002',
  '2026-10-01', '2026-11-30', 'SYN-REGION-A', 11,
  'approved',
  '11000000-0000-4000-8000-000000000001'
);

insert into app.special_tracking_enrollments (
  id, organization_id, person_id, trigger_type, trigger_evidence,
  entered_at, window_start, window_end, enrollment_status,
  authority_reference, created_by
) values (
  '49000000-0000-4000-8000-000000000001',
  '10000000-0000-4000-8000-000000000001',
  '20000000-0000-4000-8000-000000000003',
  'SYNTHETIC_DEMO_TRIGGER',
  '{"synthetic":true,"notice":"Not an operational finding."}'::jsonb,
  '2026-07-15T15:00:00Z',
  '2026-07-15', '2027-01-15', 'active',
  'SYNTHETIC-NOT-AN-AUTHORITY',
  '11000000-0000-4000-8000-000000000001'
);

insert into integration.outbox_messages (
  id, organization_id, aggregate_type, aggregate_id, event_type,
  payload, headers, idempotency_key, status, attempt_count,
  available_at, delivered_at
) values (
  '50000000-0000-4000-8000-000000000001',
  '10000000-0000-4000-8000-000000000001',
  'qualification',
  '46200000-0000-4000-8000-000000000001',
  'qualification.renewed.v1',
  '{"personId":"20000000-0000-4000-8000-000000000001","requirementId":"46000000-0000-4000-8000-000000000001","synthetic":true}'::jsonb,
  '{"correlationId":"synthetic-demo"}'::jsonb,
  '50000000-0000-4000-8000-000000000101',
  'delivered', 1,
  '2026-08-05T19:00:00Z',
  '2026-08-05T19:00:03Z'
);

insert into app.permissions (id, code, description, sensitivity) values
  ('60000000-0000-4000-8000-000000000001', 'org:read', 'Read organization configuration', 'normal'),
  ('60000000-0000-4000-8000-000000000002', 'org:write', 'Manage organization configuration', 'privileged'),
  ('60000000-0000-4000-8000-000000000003', 'people:read', 'Read ordinary person and position data', 'normal'),
  ('60000000-0000-4000-8000-000000000004', 'people:write', 'Manage ordinary person and position data', 'privileged'),
  ('60000000-0000-4000-8000-000000000005', 'people:sensitive:read', 'Read encrypted sensitive person attributes', 'restricted'),
  ('60000000-0000-4000-8000-000000000006', 'people:sensitive:write', 'Manage encrypted sensitive person attributes', 'restricted'),
  ('60000000-0000-4000-8000-000000000007', 'program:read', 'Read program, curriculum, task, and form configuration', 'normal'),
  ('60000000-0000-4000-8000-000000000008', 'program:write', 'Manage program, curriculum, task, and form configuration', 'privileged'),
  ('60000000-0000-4000-8000-000000000009', 'records:read', 'Read training and form records', 'normal'),
  ('60000000-0000-4000-8000-000000000010', 'records:write', 'Create and manage training and form records', 'privileged'),
  ('60000000-0000-4000-8000-000000000011', 'records:delete', 'Delete eligible nonsigned storage objects', 'restricted'),
  ('60000000-0000-4000-8000-000000000012', 'qualification:read', 'Read qualification projections and evidence', 'normal'),
  ('60000000-0000-4000-8000-000000000013', 'qualification:write', 'Record qualification outcome events', 'privileged'),
  ('60000000-0000-4000-8000-000000000014', 'notifications:read', 'Read notification records', 'normal'),
  ('60000000-0000-4000-8000-000000000015', 'notifications:write', 'Create and manage notifications', 'privileged'),
  ('60000000-0000-4000-8000-000000000016', 'no_notice:read', 'Read covert no-notice program data', 'restricted'),
  ('60000000-0000-4000-8000-000000000017', 'no_notice:write', 'Manage covert no-notice program data', 'restricted'),
  ('60000000-0000-4000-8000-000000000018', 'no_notice:delete', 'Delete eligible no-notice storage objects', 'restricted'),
  ('60000000-0000-4000-8000-000000000019', 'special_tracking:read', 'Read Special Tracking training data', 'restricted'),
  ('60000000-0000-4000-8000-000000000020', 'special_tracking:write', 'Manage Special Tracking training data', 'restricted'),
  ('60000000-0000-4000-8000-000000000021', 'special_tracking:delete', 'Delete eligible Special Tracking storage objects', 'restricted'),
  ('60000000-0000-4000-8000-000000000022', 'special_tracking:hr:read', 'Read partitioned TRB employment disposition', 'restricted'),
  ('60000000-0000-4000-8000-000000000023', 'special_tracking:hr:write', 'Manage partitioned TRB employment disposition', 'restricted'),
  ('60000000-0000-4000-8000-000000000024', 'audit:read', 'Read audit and access evidence', 'restricted'),
  ('60000000-0000-4000-8000-000000000025', 'audit:write', 'Write audit evidence through controlled functions', 'restricted'),
  ('60000000-0000-4000-8000-000000000026', 'audit:delete', 'Reserved; audit evidence is never directly deleted', 'restricted'),
  ('60000000-0000-4000-8000-000000000027', 'security:admin', 'Administer roles and assignments', 'restricted'),
  ('60000000-0000-4000-8000-000000000028', 'integration:admin', 'Operate integrations, jobs, and outbox', 'restricted'),
  ('60000000-0000-4000-8000-000000000029', 'records:evidence:write', 'Append controlled scan, hold, and disposition evidence for record attachments', 'restricted');

insert into app.roles (id, organization_id, code, display_name, system_role) values
  ('61000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'platform_admin', 'Platform administrator', true),
  ('61000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000001', 'instructor', 'Instructor / evaluator', true),
  ('61000000-0000-4000-8000-000000000003', '10000000-0000-4000-8000-000000000001', 'records_coordinator', 'Records coordinator', true);

insert into app.role_permissions (role_id, permission_id, granted_by)
select
  '61000000-0000-4000-8000-000000000001'::uuid,
  p.id,
  '11000000-0000-4000-8000-000000000001'::uuid
from app.permissions p;

insert into app.role_permissions (role_id, permission_id, granted_by)
select
  '61000000-0000-4000-8000-000000000002'::uuid,
  p.id,
  '11000000-0000-4000-8000-000000000001'::uuid
from app.permissions p
where p.code in (
  'org:read', 'people:read', 'program:read', 'records:read', 'records:write',
  'qualification:read', 'notifications:read'
);

insert into app.role_permissions (role_id, permission_id, granted_by)
select
  '61000000-0000-4000-8000-000000000003'::uuid,
  p.id,
  '11000000-0000-4000-8000-000000000001'::uuid
from app.permissions p
where p.code in (
  'org:read', 'people:read', 'people:write', 'program:read',
  'records:read', 'records:write', 'qualification:read',
  'qualification:write', 'notifications:read', 'notifications:write',
  'audit:read', 'records:evidence:write'
);

insert into app.role_assignments (
  id, organization_id, user_profile_id, role_id, scope,
  valid_from, delegated_by, authority_reference
) values
  (
    '62000000-0000-4000-8000-000000000001',
    '10000000-0000-4000-8000-000000000001',
    '11000000-0000-4000-8000-000000000001',
    '61000000-0000-4000-8000-000000000001',
    '{}'::jsonb, '2026-01-01T00:00:00Z',
    '11000000-0000-4000-8000-000000000001',
    'SYNTHETIC-DEMO-BOOTSTRAP'
  ),
  (
    '62000000-0000-4000-8000-000000000002',
    '10000000-0000-4000-8000-000000000001',
    '11000000-0000-4000-8000-000000000002',
    '61000000-0000-4000-8000-000000000002',
    '{}'::jsonb, '2026-01-01T00:00:00Z',
    '11000000-0000-4000-8000-000000000001',
    'SYNTHETIC-DEMO-BOOTSTRAP'
  ),
  (
    '62000000-0000-4000-8000-000000000003',
    '10000000-0000-4000-8000-000000000001',
    '11000000-0000-4000-8000-000000000003',
    '61000000-0000-4000-8000-000000000003',
    '{}'::jsonb, '2026-01-01T00:00:00Z',
    '11000000-0000-4000-8000-000000000001',
    'SYNTHETIC-DEMO-BOOTSTRAP'
  );

commit;

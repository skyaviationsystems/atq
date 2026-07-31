# Security policy

ATQ currently contains proof-of-concept code and synthetic data only. Do not load production training records, credentials, signatures, or controlled manuals into this repository or an unapproved deployment.

## Security invariants

- Browser clients receive only the Supabase publishable key; service-role and integration secrets remain server-side.
- Row-level security is enabled on application tables and access is scoped by organization, role, fleet, base, and program.
- Signed records and audit events are append-only. Corrections are linked revisions, never destructive rewrites.
- Authorization decisions use verified identity claims, not an unvalidated browser session object.
- Authenticated responses that refresh cookies are marked private/no-store.
- POC browser drafts and outbox payloads are limited to synthetic data. Production offline use requires approved encryption, authenticated key lifecycle, expiry, and logout-purge controls.
- Offline mutations carry stable idempotency keys, but no queued mutation is authoritative until a server revalidates it and returns a durable receipt.
- Production logs must not contain form payloads, medical information, signatures, or sensitive personnel data.

## Reporting

Report suspected vulnerabilities privately to the Atlas Air project owner. Do not open a public issue containing sensitive details or proof-of-concept data.

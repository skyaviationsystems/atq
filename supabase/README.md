# ATQ Supabase foundation

The migrations are portable PostgreSQL plus guarded Supabase Storage policies. They require PostgreSQL 15+, `pgcrypto`, and `btree_gist`.

For a local Supabase CLI environment:

```powershell
supabase start
supabase db reset
```

`db reset` applies all files in `migrations/` in lexical order and then `seed.sql`. The seed is synthetic and intentionally uses `example.invalid` addresses, synthetic identifiers, synthetic Vision IDs, and non-approved placeholder content.

## Approved user invitation

Self-signup is disabled. For the first administrator only, a database owner or trusted service-role backend calls `app.bootstrap_first_security_admin_invitation(...)` before calling Supabase Admin `inviteUserByEmail`. The function is not executable by `anon` or `authenticated`, requires a same-organization role that grants `security:admin`, and refuses a second bootstrap for that organization. Never expose it or the service-role key to a browser.

After bootstrap, an active `security:admin` calls `app.approve_user_invitation(...)`; only after it succeeds may the server call Supabase Admin `inviteUserByEmail`. The guarded `auth.users` trigger creates the profile and same-organization role assignment from that approved database request, never from user metadata. RLS remains closed until invite confirmation activates the profile.

An Auth identity created without approval receives no `app.user_profiles` row and no ATQ access. See `docs/architecture.md` for the exact bootstrap/approval sequence and controlled service-role reconciliation path.

Production rules:

- never run `seed.sql` against an operational database;
- never put `SUPABASE_SERVICE_ROLE_KEY` in a browser environment;
- use a non-owner, non-`BYPASSRLS` role for normal application traffic;
- use `{}` only for global role scope; scoped keys require non-empty UUID arrays;
- write signed/form/qualification evidence through reviewed transactions;
- store objects under `<organization-uuid>/<classification>/<entity-uuid>/<file>`;
- never mutate a registered attachment or any object in `atq-evidence`;
- archive audit-chain manifests and signed evidence independently of Supabase;
- test both database and Storage restoration.

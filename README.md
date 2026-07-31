# ATQ — Atlas Training & Qualification

ATQ is a proof-of-concept operating platform for Atlas Air training forms, instructor workflows, records, qualification and currency logic, curriculum, scheduling, special tracking, analytics, compliance, and administration.

The repository is designed for an initial Vercel + Supabase deployment while keeping domain logic and application contracts portable to a later AWS deployment.

## What is included

- Responsive white workspace with an Atlas-blue sidebar and header
- M0–M13 module registry and navigable operational workspaces
- Program-resolution and MATS transition surfaces
- Configurable form designer, B747 AQP CQ form runtime, rating primitives, signatures, QC queue, and offline drafts
- Instructor events, pre-brief, open forms, and offline-pack workflows
- Training records, qualification rules, curriculum, scheduling, no-notice, special tracking/TRB, instructor management, analytics, compliance, and administration surfaces
- PostgreSQL/Supabase migrations, row-level security, storage policies, audit/outbox functions, and synthetic seed data
- Vendor-neutral domain contracts and an IndexedDB outbox for later AWS adapter substitution
- Unit, browser, lint, type, formatting, production-build, and dependency-audit checks

This is a realistic product reference implementation, not yet a certified production records system. Synthetic demonstration data is used throughout.

### Current implementation depth

- M0 runs the deterministic program-resolution engine and exposes its decision trace. Demo decisions are not yet persisted to Supabase.
- M1 provides the deepest workflow: configurable authoring, interactive B747 CQ entry, required-field enforcement, browser-persistent drafts, a local idempotent outbox, and QC/publish demonstrations. A queued form is not authoritative until a future server workflow accepts it.
- M2 provides instructor event, prebrief, open-form, and offline-pack demonstrations.
- M3â€“M13 provide substantive design-review workspaces backed by synthetic scenarios. Their operational controls and external integrations are not live.
- The PostgreSQL foundation is broader than the current UI and is intended to support the next implementation phase after source-system ownership and policy gates are approved.

## Stack

- Next.js 16, React 19, and TypeScript
- Untitled UI React, React Aria, and Tailwind CSS 4
- Supabase Postgres, Auth, Storage, and RLS for the proof of concept
- Dexie/IndexedDB for device-local drafts and queued mutations
- Vitest and Playwright
- Vercel deployment target

## Local setup

Requirements: Node.js 22+ and npm.

```powershell
npm ci
Copy-Item .env.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). If Supabase variables are absent, ATQ starts in a synthetic local demo mode and the sign-in screen offers “Continue to demo.”

## Supabase setup

1. Create a Supabase project.
2. Add the project URL and publishable key to `.env.local`.
3. Link the local project and apply the migrations:

```powershell
npx supabase@latest login
npx supabase@latest link --project-ref YOUR_PROJECT_REF
npx supabase@latest db push
```

Never expose a Supabase secret/service-role key through a `NEXT_PUBLIC_*` variable. Browser authorization is enforced by RLS; privileged integrations belong in server-only workers.

## Vercel deployment

Import the GitHub repository into Vercel, select Node.js 22, and configure the environment variables documented in `.env.example`. Next.js needs no custom Vercel build command.

Before enabling real users:

- apply and verify every Supabase migration in a non-production project;
- replace synthetic seed data;
- configure enterprise identity and role assignments;
- validate RLS with cross-role tests;
- confirm authorization for the approved Atlas Air logo artwork in the target environment;
- complete the policy decisions and source-data gates in `docs/poc-assumptions.md`;
- run the full validation suite below.

Do not present the POC as connected to AIMS, Vision, HRIS, Comply365, crew scheduling, notifications, or backup telemetry. Those rows are explicitly synthetic models until adapters and ownership contracts are implemented.

## Validation

```powershell
npm run format:check
npm run lint
npm run typecheck
npm test
npm run build
npm run test:e2e
npm audit --omit=dev --audit-level=high
```

## Portability to AWS

Feature code is kept independent of Supabase-specific APIs. Supabase adapters sit behind application contracts, database changes are plain PostgreSQL migrations, and durable integration events use an outbox. The intended later mapping is documented in `docs/aws-migration.md`.

## Repository safety

The local `Atlas Air Manuals` and `Instructor and Ground Training` folders are proprietary source material. They are deliberately ignored and must never be committed. Generated demonstrations must use synthetic people, identifiers, events, and performance data.

The proof of concept uses the official reverse Atlas Air newsroom PNG for internal, non-commercial presentation. Confirm brand authorization and replace it with the current approved production asset before any external release.

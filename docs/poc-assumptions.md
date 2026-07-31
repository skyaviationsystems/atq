# ATQ proof-of-concept assumptions

These are conservative, reversible defaults used to make the proof of concept executable. They are not approved policy and must be confirmed by the accountable Atlas owners before production.

## Product boundaries

1. **Forms and Comply365:** ATQ owns configurable form authoring and runtime in the PoC. A future adapter may publish controlled reference PDFs to Comply365. The final replace/wrap/distribute decision remains open.
2. **Signed amendments:** A signed record is immutable. A correction creates a linked, reasoned, independently signed superseding revision; the original remains visible.
3. **Qualification truth:** ATQ computes a program-aware qualification projection from immutable source events. During transition, mirrored source values are visibly attributed and cannot be edited as if ATQ owned them.
4. **Vision:** Vision task identifiers are external contract identifiers. ATQ preserves them and integrates; it does not silently mint replacements.
5. **Offline scope:** Instructor form authoring works offline. Submission is queued with an idempotency key, while authoritative receipt time, conflict checks, signatures, and final qualification effects are established server-side.
6. **Instructor surfaces:** Tablet is the primary runtime target; desktop is supported as a distinct dense layout.
7. **Program ambiguity:** Any unresolved or conflicting N&O/AQP determination blocks consequential submission rather than guessing.

## Data and demonstrations

- All checked-in people, employee numbers, events, qualifications, scores, and audit entries are synthetic.
- Proprietary manuals remain local and ignored by Git.
- Regulatory citations in the UI are demonstration references until validated against the controlled source library.
- Dates are shown with an explicit time-zone/calendar convention where they affect qualification or currency.

## Go-live gates

- Accountable owners approve the Comply365 boundary, amendment policy, qualification system of record, Vision contract, and offline signature policy.
- The real eCrew form set, CQ allocation sheet, Vision export schema, curriculum data, CBA, TCSOP, PRDM, DGM, APM, AOSSP, and current MATS inputs are supplied and version-controlled in an approved document system.
- Security completes identity, least-privilege, RLS, access-log, secrets, retention, backup/restore, and incident-response reviews.
- Training and standards complete representative-device usability, print fidelity, accessibility, concurrency, and offline conflict testing.
- Legal, labor, records, safety, and FAA stakeholders approve disclosure, retention, signature, and audit behavior.

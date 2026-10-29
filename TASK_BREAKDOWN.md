# Task breakdown and ownership

| Workstream                     | Owner             | Dependency                  | Acceptance / review                                 |
| ------------------------------ | ----------------- | --------------------------- | --------------------------------------------------- |
| Existing source/data retention | Both              | Audit                       | Snapshot and migration rehearsal                    |
| Tokens/shared layout           | A + designer      | Approved Figma states       | Responsive/keyboard review                          |
| Auth/email/recovery            | B + A             | Sender and auth schema      | Lifecycle and session tests; cross-review           |
| Onboarding/projects            | Both              | Verified identity           | Duplicate-safe setup, CRUD/archive, isolation       |
| Payments/keys                  | B + A             | Ownership/provider contract | Three outcomes, hash/revoke, concurrent idempotency |
| Webhook worker                 | B                 | Atomic event/outbox         | Leases, attempts, SSRF, retry/receiver tests        |
| Docs/OpenAPI                   | A + B             | Stable API                  | Copy example integration and contract test          |
| CI/operations                  | B + QA            | Hosting decision            | Build/tests, backups, release runbook               |
| Final UI/a11y                  | A + designer + QA | Figma handoff               | 1440/768/390 and keyboard evidence                  |
| Public sandbox release         | Founder           | All release gates           | Approved audience, vendor/region, legal/security    |

Short-lived feature branches and protected main are the target workflow; each PR needs the other developer's review. Security-sensitive work requires both developers. No branch protection, hosted CI, external alerts or deployment is claimed enabled merely because repository configuration exists.

See QA.md for executed evidence and README.md for local setup. Estimates and 45-day dependencies are in DEVELOPMENT_ROADMAP.md; unconfigured external requirements remain explicit blockers to public release.

# Testing strategy

Run `npm test` for domain tests. HTTP/DB tests opt in with FLOWZA_TEST_URL and must target a disposable PostgreSQL database. `npm run test:e2e` runs the committed browser journey. CI provisions isolated PostgreSQL, runs migrations, lint, strict TypeScript, production build, audit, integration and browser tests. Diagnostic artifacts are local; no automatic external upload.

Coverage: credential validation, verification/reset lifecycle, session redaction/revocation, project ownership, unsafe webhook destinations, API key revoke, money bounds, persistence, concurrent replay/conflict, API contract examples, worker lease/retry and responsive UI. Test complete outcomes: successful, failed, pending. Date filters use UZT boundaries.

## Release gate

Verified signup → business/project → key → external HTTP payment → DB/dashboard/history must pass. Two-account/two-project isolation must pass. Secrets are one-time/hash-only. Concurrent requests create one payment. Queue survives restart. Receiver confirms signed event; failures retry truthfully and stop at five. Backup restores into a separate DB. All 1440/768/390 layouts and keyboard/reduced-motion checks pass. Lint/types/build/CI green. No unresolved Critical/High findings. SMTP staging delivery, final Figma, hosting/region/legal copy and founder release approval are required.

QA.md records actual execution evidence separately from this target policy. Passing tests does not establish regulatory compliance or a completed independent penetration test.

# FLOWZA implementation verification

## Uzbek interface release — 27 October 2026

Both app sources now use Uzbek visible text, metadata/lang, localised status/business labels, validation and docs. Raw payment enums, ownership/authorization, keys and webhook contracts remain unchanged. The existing 19-test integration suite passed without skips; the translated browser E2E passed, including 1440/768/390 responsive checks. Root lint/typecheck/build and hosted typecheck/build passed. Hosted lint retains only its two established full-navigation warnings. Public deployment succeeded; authenticated production coverage remains limited to previously recorded local tests and requires a human ChatGPT login for live verification.

## Local acceptance candidate — 27 October 2026

- Standalone Next.js/PostgreSQL only. Separate test build .next-test allows port 3100 to run without stopping the existing port-3000 app. Tests use flowza_mvp_test, never the original database.
- All 19 unit/integration tests passed with no skips, including auth, isolation, queue, webhook and checkout. Existing Playwright browser journey passed (signup/verification/onboarding/key/payment/transactions/settings/responsive).
- Additional checkout retrieval HTTP checks passed: unauthenticated 401; owning key sees the persisted transaction and exact amount; another project key receives 404. Four checkout tests passed after this addition.
- Real-browser anonymous Payment Link → checkout → successful sandbox payment completed. The completed state remained visible after server refresh. Currency label fixed to show UZS explicitly. Mobile checkout measured 390px scroll width at 390px viewport, with no horizontal overflow.
- Lint and strict TypeScript passed. Production compilation/type checking passed; terminal build result is recorded in the current task output.
- Added BETA_TEST_GUIDE.md with tester journey, reporting rules and external release gates. GET /api/v1/checkout/sessions/{id} enables server-side order verification; docs/OpenAPI updated.
- Not a public-beta completion claim: no remote server deployment, production SMTP receipt, external merchant webhook receipt, independent security review or managed-backup configuration was performed. Public Sites remains an older adaptation; these changes have not been deployed there.

## Current standalone V1 evidence — 26 October 2026

The root Next.js/PostgreSQL application is canonical; Sites remains frozen. Tests use the separate loopback `flowza_mvp_test` database on port 55432 and web origin `http://127.0.0.1:3100`. Existing application database records were not migrated or reset during verification. A source snapshot exists in ignored `output/pre-mvp-source.zip`.

- Lint and strict TypeScript: passed with no warnings/errors.
- Unit/integration tests: **15 passed, 0 failed, 0 skipped** with the isolated test environment.
- Browser E2E: **1 passed**, including verified signup, onboarding, one-time key, sandbox payment, transaction list and profile save. Dashboard, developer tabs, Settings, Docs and Landing were checked for viewport overflow at 1440/768/390; reduced motion and client hydration/CSP errors were checked.
- Authentication lifecycle: verification required, reset token single use, password replacement, old sessions revoked and session credentials removed from browser JSON.
- Data isolation/idempotency: two users, multiple projects, cross-account denial, concurrent replay/conflict, key revoke and archived project history/access verified.
- Webhooks: unsafe destinations rejected on actual production transport; five-attempt limit/history; controlled transport verifies real HMAC, immutable payload and 503→204 handling; expired worker lease recovered. This is controlled integration evidence, **not a claim of an external merchant receiver delivery**.
- pg-boss: worker heartbeat executed; a queued job survived stopping one queue client and starting another.
- Persistence/restore: all public application tables copied from a consistent test snapshot into a newly migrated temporary DB; foreign keys and table counts passed. Temporary restored DB was removed; ignored backup stays local. This does not replace production managed backups/PITR.
- Dependency audit: npm reports **0 vulnerabilities** at verification time.
- Final production Webpack build: passed after the final code changes, including strict TypeScript and all nine primary routes/API handlers.
- Production startup smoke: `/`, `/docs`, `/api/openapi` returned 200 with CSP; unauthenticated `/dashboard` returned 307. Local SMTP delivery is intentionally disabled in production mode; interactive local testing uses the development server.

## External release gates still open

Production SMTP sender/staging inbox receipt, an approved public HTTPS receiver end-to-end delivery, final Figma review, hosting/region/budget, managed backup/PITR, external alerting/error monitoring, legal/privacy/retention decisions and independent security review remain unconfigured/unverified. No public deployment, Git commit, real payment processing or regulatory compliance claim is made. GitHub CI configuration is supplied but has not run on a remote repository; branch protection is an owner setting. The root is not a Git checkout, so the tracked-file secret scanner explicitly skipped locally. Docker/pg_dump are unavailable here; the image has not been built and the restore evidence uses the isolated logical application-data rehearsal.

Two automatic approval rejections were resolved safely: session management uses opaque IDs without returning credentials; CI does not upload diagnostic screenshots/traces externally.

## Historical prototype evidence (superseded where inconsistent)

The remaining sections describe the earlier prototype. Its custom auth/manual webhook and localhost:3000 statements are historical, not the current V1 contract.

# Prototype verification — 26 October 2026

## Functional result

The local registration → onboarding → project → dashboard → API key → simulated payment → persisted transaction → updated dashboard journey was exercised through both HTTP integration tests and a real browser. PostgreSQL 17.10 runs locally, with the initial Prisma migration applied. The application runs at http://localhost:3000.

- Lint: passed with no warnings or errors.
- Strict TypeScript: passed.
- Tests: 10 passed, 0 failed, 0 skipped when run with `FLOWZA_TEST_URL=http://localhost:3000`.
- Production Webpack build: passed; all public pages and protected/API routes compiled.
- npm audit: 0 vulnerabilities. `deepmerge-ts` is overridden to patched 8.0.0; Prisma generation and migrations were tested with the override.
- Browser: registration, onboarding, project persistence, empty dashboard, one-time key generation and hiding, payment creation, transaction table, details dialog, Escape dismissal, and dashboard volume update verified. No full API secret was printed or included in screenshots.
- Responsive: dashboard, transactions, developer sandbox, and documentation inspected at 1440, 768, and 390 pixels. No viewport overflow. Tables scroll inside their containers.
- Reduced motion: browser emulation confirmed the hero entrance animation is disabled.
- Clean-context browser rerun: no JavaScript or hydration errors across the 12 route/viewport combinations. Earlier capture runs produced tool-induced warnings because the screenshot instrumentation inserted `caret-color: transparent` styles into inputs; these did not reproduce in a fresh context without that instrumentation.

HTTP tests cover project isolation, unauthorized payment retrieval, CSRF rejection, key revocation, session logout, onboarding deduplication, payment persistence, concurrent idempotent replay, conflicting replay, successful/failed/pending records, status/date filtering, missing credentials, malformed monetary input, and required idempotency headers. A database fixture proves delivery-time SSRF revalidation, truthful failed delivery records, and the three-attempt limit.

## Environment resolutions

Turbopack's CSS worker failed in this Windows environment; development and production builds use the supported Webpack option. Windows locks the Prisma query engine DLL while the application is running, so generation is an explicit setup command (`npm run db:generate`) rather than a redundant step in every build. PostgreSQL's `pg_ctl` launcher drops administrative privileges on Windows. The local DB helper uses it and binds the server to loopback.

## Public design review

Direction: **The quiet instrument**, seed **1485924395**. Brand palette and system typography were retained from the brief. No redraws, stock media, or generated illustrations. Idea: an inspectable UZS sandbox receipt demonstrates the API and its honest simulated outcomes. The visitor can switch illustrative outcomes; authenticated users create persisted payments separately.

Three visual inspection rounds fixed mobile headline wrapping, supporting text size, status contrast, and entrance motion. Final inspection reports zero horizontal overflow at all three widths, and 8–9 restrained moving elements. Thin borders and the two product interface fragments were deliberately retained to honor the user's product design brief. No decorative photographs or video were added.

Internal visual critique: design 7/10, usability 8/10, creativity 6/10, content 8/10; weighted 7.2, **capped at 6.0 under the skill's strict rubric** because its last automated report still flags sparse desktop screens. Remaining nonfunctional visual warnings: font fallback for code, several supporting type sizes, secondary muted text, and absent video. This is an internal self-review, not an independent award or accessibility certification. Functional/browser checks are reported separately above.

## Operational limits

- Sandbox only; no real payments, payment partners, merchant approval, or settlement transitions.
- A public receiver was not supplied, so outbound successful webhook delivery has not been verified against a user-owned endpoint. The implementation signs payloads, pins validated DNS addresses, preserves TLS hostname validation, rejects redirects/private destinations, and records actual response codes. DNS has a three-second deadline, followed by a five-second HTTP deadline.
- Webhook delivery/retries are explicitly manual; there is no background worker. A process crash during sending requires operator reconciliation before retry.
- No password reset/email delivery, email verification, invitations, additional-project creation UI, or profile editing. Account settings clearly state their read-only scope.
- Public deployment still needs TLS, edge abuse controls, production database credentials, backups, monitoring, and periodic expired-session/rate-bucket cleanup. No hosting deployment was performed.

All local test data is clearly sandbox data. New accounts start empty. See README.md for setup, every route/API endpoint, and the complete user journey.

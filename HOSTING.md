# FlowKey hosted sandbox

URL: https://flowza-sandbox.u-t-m-u.chatgpt.site

Published successfully on 26 October 2026 using Sites. Audience was changed to public at the owner's explicit request. Landing, documentation and login are publicly accessible; merchant pages still require ChatGPT sign-in and project membership.

Hosted source: `sites/flowza-hosted/`. The root Next.js/PostgreSQL application remains available separately. The hosted adaptation uses dispatch-owned ChatGPT identity and persistent Cloudflare D1, with native atomic batches for onboarding and payment/outbox writes. It does not copy localhost accounts, API secrets, or test records.

Site project: `appgprj_6aded944393c81918f3523e2737be314`

Successful deployment: `appgdep_6ae0df93c6248191bb86e0fa1c695e37` (27 October 2026)

Source commit: `1e566cc7375e8ed9e0faf632c357370e68a65760`

Saved version: `appgprj_6aded944393c81918f3523e2737be314~appgver_2650b1d56da88191b4b9aedc73dae089`

Uzbek release: public and merchant copy, docs, checkout, validation, status/business display labels, auth email text and metadata translated in standalone and Sites. HTML lang is uz; display dates/numbers use uz-UZ. Existing English enum payload values, SQL names, API routes, Flowza-Signature header and key prefixes are unchanged. Root 19 tests and browser E2E passed; root lint/type/build and hosted type/build passed (two established hosted full-navigation lint warnings). No schema migration in this release.

Brand renamed to FlowKey on 27 October. Visible UI, metadata, docs and HTML button labels updated in standalone and hosted source. Existing Site URL, API key prefixes, environment identifiers and Flowza-Signature header are retained for compatibility. Root lint/type checks, hosted type check and hosted production build passed. No schema or payment behavior change in this branding release.

27 October checkout release: Developers now offers fixed-price payment links and copyable HTML anchors. Public /pay/{id} and /checkout/{id} are sandbox-only. Backend integrations use POST /api/v1/checkout/sessions and project-key-authorized GET /api/v1/checkout/sessions/{id}. Schema-only D1 migration adds links, sessions and nullable project archivedAt. Native D1 queries preserve outcome-lock and uniqueness without unsupported Prisma interactive transactions.

Verification: TypeScript and production build passed. Lint has two deliberate full-page-navigation warnings. Local D1 tests passed authenticated link creation, public checkout, parallel completion returning one payment, and disabled-link rejection. Deployed anonymous docs contain the checkout guide; merchant routes redirect to login; checkout APIs return 401 without Bearer credentials. Full authenticated production journey still requires a human ChatGPT sign-in; browser automation was unavailable during the final pass. No production test users, fixture links or secrets were seeded.

Verification: hosted lint/type checks and production build pass. Local D1 browser journey verified identity, onboarding, project creation, one-time API key display/hiding, payment creation, Transactions, and dashboard updates. The actual production Worker was also booted locally; API checks passed concurrent idempotency, conflict rejection, persisted retrieval, project authorization, and key revocation. Sites returned terminal deployment success for the URL above.

An initial deployment failed because the Node Prisma entrypoint referenced `__dirname`; the published fix explicitly resolves the generated Worker/WASM client. The initial schema migration remains unchanged and was reused.

Public release verification: anonymous landing/docs/login/signup return 200, merchant routes redirect to login, and unauthenticated payment retrieval returns 401. Fixed a production Vinext Link/router failure by using server navigation. Rebuilt, passed TypeScript and lint (one intentional full-navigation warning), and verified the deployed landing-to-login navigation. ChatGPT authorization reaches OpenAI, where a human-verification challenge prevents automated completion; the new production authenticated journey remains pending human sign-in.

This remains a simulated payment sandbox. The public audience gate no longer blocks external clients; payment API authentication is still mandatory. Webhook delivery is manual and requires a public HTTPS IPv4 endpoint; no successful external receiver delivery is claimed. This Sites adaptation does not include the root application's newer PostgreSQL worker, multi-project management or editable account settings. Do not present it as feature-equivalent to that application.

28 October 2026 Unit release: Sites version 7 deployed successfully to the existing public URL. Source commit 9643184f3a8142a2df0522ab45a1473fdea5c622; version appgprj_6aded944393c81918f3523e2737be314~appgver_a86049e8f7b08191bfb3ec31ad7c41e6; deployment appgdep_6ae1d51421608191af020dee75feba2f. Adds one-step product onboarding, four product types, account-first project creation with an atomic D1 batch and one-time automatic API key, API/Bearer/link/script/button selection, GPT/Claude prompts, Unit labels, and optional resumable Uzbek tutorial. No schema migration or audience change. Hosted TypeScript and official build pass; local D1 browser verification passed project/key creation, Unit/script generation with selection preserved after reload, AI prompts and three responsive widths. Production publication is confirmed by Sites; authenticated production flows retain ChatGPT sign-in.

28 October 2026 profile avatar release: Sites version 8 successfully published. Commit e3b13983d78fac4590955469d90e5a460478b6de; version appgprj_6aded944393c81918f3523e2737be314~appgver_fd7facabac048191be782dd5e232653d; deployment appgdep_6ae22b2597a08191b51e08eb191e5f8b. Added authenticated profile photo upload/replacement/deletion and header display, R2 BUCKET binding, bounded raster upload validation and client-side 256x256 crop. Local Sites browser verified upload, immediate header update, persistence after reload, removal, and 390/768/1440 widths. Hosted build and TypeScript passed; root 17 tests passed (5 skipped), including three upload validation cases. Publication returned succeeded. No production fixture avatar was uploaded and no D1 schema migration was needed.

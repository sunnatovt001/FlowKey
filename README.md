# FlowKey

## Google va GitHub orqali kirish

Kirish va hisob yaratish sahifalaridagi provayder tugmalari tegishli Client ID
va Client Secret birga kiritilganda faollashadi. Maxfiy kalitlarni chat yoki
GitHub’ga yubormang; local `.env` va serverdagi
`/home/deploy/flowkey-ops/shared/.env` ichida saqlang.

### Google

1. [Google Cloud Console](https://console.cloud.google.com/) ichida loyiha oching.
2. Google Auth Platform → Branding va Audience’ni sozlang. External / Testing holatida test foydalanuvchilarini qo‘shing.
3. Clients → Create client → Web application.
4. Authorized redirect URIs: local uchun `http://127.0.0.1:3000/api/auth/callback/google`;
   server uchun `https://flowkey.173.212.216.216.sslip.io/api/auth/callback/google`.
5. Client ID’ni `GOOGLE_CLIENT_ID`, Client Secret’ni `GOOGLE_CLIENT_SECRET` qilib saqlang.

Google production tasdiqlashi uchun o‘zingiz boshqaradigan, egaligini tasdiqlay
oladigan domenni ishlating. Domen o‘zgarsa, `APP_URL` va callback’ni ham yangilang.

### GitHub

1. [Developer settings → OAuth Apps](https://github.com/settings/developers) → New OAuth App.
2. Homepage URL: `APP_URL` qiymati.
3. Authorization callback URL: `https://flowkey.173.212.216.216.sslip.io/api/auth/callback/github`.
4. Client ID’ni `GITHUB_CLIENT_ID`, yangi Client Secret’ni `GITHUB_CLIENT_SECRET` qilib saqlang.
5. Local ishlatish uchun alohida OAuth App yarating; callback:
   `http://127.0.0.1:3000/api/auth/callback/github`.

Callback `APP_URL` bilan aynan mos bo‘lsin: `localhost` va `127.0.0.1` bir xil emas.
Repo yozish huquqi yoki Gmail ruxsati so‘ralmaydi; faqat kirish uchun profil/email ishlatiladi.

Local: `npm run auth:check`, so‘ng dev serverni qayta ishga tushiring.
Serverda shared `.env` yangilangach faol `flowkey-release-…` PM2 jarayonini qayta
ishga tushiring. Bu tekshiruv kalitlarning mavjudligini tekshiradi, ularning
haqiqiyligini yoki provayderdagi callback sozlamasini tasdiqlamaydi.

Rasmiy yo‘riqnomalar: [Google](https://better-auth.com/docs/authentication/google),
[GitHub](https://better-auth.com/docs/authentication/github),
[Google production talablari](https://developers.google.com/identity/protocols/oauth2/production-readiness/policy-compliance).

A working developer-first **simulated payment sandbox** for Uzbekistan. No live banking integration, cards, KYC approval, or real money processing. Planned live pricing is 3%, subject to confirmation and licensed partner approval.

## Stack

Next.js 16 App Router, React, strict TypeScript, Tailwind CSS, reusable accessible UI components, Lucide, Zod, Prisma 6 and PostgreSQL. Subtle CSS transitions respect reduced motion. Server modules isolate authentication, authorization, payment logic, validation, and webhook delivery so a separate backend can be extracted later.

## Local setup (Node 24)

```powershell
npm ci
npm run setup
```

The setup helper creates an ignored `.env`, generates webhook encryption and Better Auth secrets, and adds missing auth settings while preserving existing configuration. Losing WEBHOOK_ENCRYPTION_KEY makes existing signing secrets unreadable. API keys are hash-only; Better Auth manages database session tokens, which are never exposed in browser JSON. Production requires a real SMTP sender and secret manager. Local MAIL_TRANSPORT=file writes verification/reset messages to ignored `local-data/mail/*.json`; open the requested message's URL locally. Do not share these files.

`npm run dev` now checks the configured database first. For the default bundled
local database it starts PostgreSQL automatically and waits until it accepts
queries before starting Next.js. A custom database must already be running.

You can also start PostgreSQL separately with **one** of these options:

```powershell
# Bundled local development PostgreSQL (Windows supported):
npm run db:local
# Keep that terminal running. Local data survives restarts in ignored local-data/.

# OR, if Docker is installed:
docker compose up -d
```

The default `.env.example` database URL matches both options. The local-only database password in the example is not a deployment credential. Use separate strong credentials and managed backups for any hosted instance. Bind the development database to loopback only.

In a separate terminal:

```powershell
npm run db:generate
npm run db:migrate
npm run dev
```

Open [FLOWZA locally](http://localhost:3000). `APP_URL` must match the exact origin used in the browser; use `http://localhost:3000` consistently. Missing database configuration produces an explicit error; it never switches to mock persistence.

For a local production build, use HTTPS when exercising login: production session cookies are Secure. Use development mode for the HTTP localhost journey.

## Gmail delivery for password reset and verification

Run `npm run mail:setup` in an interactive terminal. Enter the sender's Gmail
address and a Google App Password (not the normal account password). Google
requires 2-Step Verification for App Passwords:
https://support.google.com/accounts/answer/185833.

The setup verifies Gmail over TLS before enabling `MAIL_TRANSPORT=smtp` and
saving the credentials in the ignored local `.env`. Password input is hidden;
no reset tokens or credentials are printed. Failed verification preserves the
previous configuration. Restart `npm run dev` after setup. `npm run mail:check`
verifies connectivity without sending an email. Then request a fresh password
reset from `/login`; check the recipient's inbox and Spam folder. This configures
the local app only; Sites retains its separate ChatGPT sign-in.

## Complete sandbox journey

1. Open `/`, select Start building, and register with a valid email and a password of at least 12 characters.
2. Open the verification link from your email (local development: ignored `local-data/mail`), then enter business and project details. A database transaction creates business/project/owner membership. Repeated completion returns the existing project.
3. Open Overview, then Developers → API keys. Create a named key and save the full secret immediately; only its prefix remains visible later.
4. In Developers → Sandbox, enter a UZS amount and choose Success, Failure, or Pending. Submit to persist a real database transaction representing that simulated result.
5. Open Transactions, search the ID, filter by status or UZT date, and open details. Transaction timestamps use Uzbekistan time.
6. Return to Overview. Successful payment volume and transaction counts are computed from the database. No demo business statistics are seeded.
7. Read `/docs`, copy the curl request, and call the API using the saved sandbox key. Repeating a request with the same idempotency key and payload returns the original payment; changing the payload returns 409.
8. Run `npm run worker` in another terminal. Register a public HTTPS endpoint and save its secret. Subscribed payments enqueue immutable signed events. Five attempts maximum: immediately, then delays of 1m/5m/30m/2h. Manual retry does not reset the cap. Only confirmed 2xx is delivered. Receiver must deduplicate event IDs.
9. Settings supports profile/business edits, password changes, session revocation and multiple projects. Archive retains history, revokes keys and disables endpoints.

The anonymous landing preview is explicitly illustrative, interactive, and never persisted. The authenticated sandbox persists every successful creation request.

## Routes

| Route               | Purpose                                                                        |
| ------------------- | ------------------------------------------------------------------------------ |
| `/`                 | Public product site, pricing disclosure, FAQ, interactive illustrative preview |
| `/signup`, `/login` | Registration and login                                                         |
| `/onboarding`       | Business and first project setup; completed users redirect to dashboard        |
| `/dashboard`        | Actual project statistics, seven-day activity, recent payments, checklist      |
| `/transactions`     | Search, status/date filtering, pagination, payment details                     |
| `/developers`       | API keys, sandbox payment creation, webhook registration/delivery              |
| `/settings`         | Profile, business, password, sessions and project management                   |
| `/docs`             | Public documentation of the implemented sandbox API                            |

Workspace routes accept `?project=PROJECT_ID` and enforce verified owner membership on the server. Settings creates additional projects and remains accessible when all projects are archived. `/api/openapi` exposes the public API contract; API_SPECIFICATION.md lists management endpoints.

## API endpoints

| Method / path                              | Authentication             | Behavior                                                              |
| ------------------------------------------ | -------------------------- | --------------------------------------------------------------------- |
| `POST /api/auth/sign-up/email`             | Same-origin                | Registers and sends verification email                                |
| `POST /api/auth/sign-in/email`             | Same-origin                | Verified email/password login                                         |
| `POST /api/auth/sign-out`                  | Session, same-origin       | Deletes current session                                               |
| `POST /api/onboarding`                     | Session, same-origin       | Idempotent business/project setup                                     |
| `POST /api/projects/:projectId/keys`       | Owner session, same-origin | Generates one-time sandbox secret                                     |
| `DELETE /api/projects/:projectId/keys`     | Owner session, same-origin | Revokes key by JSON `{ "id": "..." }`                                 |
| `POST /api/projects/:projectId/payments`   | Owner session, same-origin | Dashboard sandbox creation; Idempotency-Key required                  |
| `POST /api/projects/:projectId/webhooks`   | Owner session, same-origin | Registers public HTTPS URL and subscriptions; one-time signing secret |
| `DELETE /api/projects/:projectId/webhooks` | Owner session, same-origin | Disables endpoint by JSON ID                                          |
| `POST /api/projects/:projectId/deliveries` | Owner session, same-origin | Sends/retries one delivery by JSON ID, max five attempts              |
| `POST /api/v1/payments`                    | Bearer sandbox key         | Creates/replays a simulated payment                                   |
| `GET /api/v1/payments/:id`                 | Bearer sandbox key         | Retrieves a payment scoped to key’s project                           |

Example payment JSON: `{ "amount_minor": 12500000, "currency": "UZS", "result": "successful" }`. One UZS is 100 minor units. Supported outcomes: `successful`, `failed`, `pending`. Positive integer amount up to 1,000,000,000 minor units. Header `Idempotency-Key` must be 8–128 alphanumeric, underscore, or hyphen characters. All responses have `livemode: false`.

## Security and operational boundaries

- Better Auth manages password hashing, verification, reset and opaque DB sessions. HTTP-only SameSite cookies expire after seven days and are Secure in production. Auth JSON strips tokens; session management returns safe IDs.
- Every workspace page and session mutation verifies authentication and membership. API secrets are 256-bit random values stored as SHA-256 hashes. Revocation is checked on each request. API/session routes have no-store responses.
- Same-origin checks protect session mutations. Programmatic payment routes require Bearer credentials. Persistent database rate counters limit authentication per normalized email, session writes per user, and API calls per project. Configure an edge/IP limiter before public deployment to limit distributed signup abuse; the app deliberately does not trust arbitrary forwarding headers.
- Payment uniqueness is enforced by `(projectId, idempotencyKey)` in PostgreSQL. Payload hashes prevent conflicting replays, including concurrent creates. Event records are queued in the same database transaction.
- Webhooks sign `${timestamp}.${rawBody}` with HMAC-SHA256. Signing secrets are AES-256-GCM encrypted with the server environment key. See `/docs#webhooks` for verification, timestamp tolerance, and replay protection.
- Each delivery re-resolves DNS, rejects unsafe ranges, requires public IPv4 HTTPS:443, pins the socket lookup to that address, preserves TLS host verification, blocks redirects, and enforces a five-second deadline. No response body is retained. Only confirmed 2xx responses count as success.
- A separate pg-boss worker dispatches queued events and bounded retries. Expired sending leases recover after restart. Delivery is at least once; receivers deduplicate stable event IDs. Inspect attempt history for failures and unknown crash outcomes.
- Audit records track key creation/revocation and endpoint revocation without secrets. No raw payment credentials are accepted or stored.
- For long-running deployments, periodically delete expired sessions and expired rate buckets. Configure TLS, production database credentials, request body limits at the proxy, abuse protection, monitoring, and backup/restore before public hosting.

## Verification

```powershell
npm run lint
npm run typecheck
npm test
npm run build

# HTTP/E2E tests: use the isolated _test database instructions below.
```

Unit tests cover password handling, cryptographic secret handling, monetary validation, onboarding validation, and SSRF address/URL restrictions. Opt-in HTTP integration tests exercise signup, session persistence, onboarding deduplication, API key generation, payment persistence/retrieval, concurrent idempotent replay, conflicting replay, cross-account denial, dashboard updates, CSRF rejection, unsafe webhook rejection, key revocation, and logout. They create clearly named test accounts and records in the configured database; run against a disposable local database.

## Intentionally out of scope

Live money processing, bank/payment partners, legal/KYC approval, live payout execution, automated card renewals, FX conversion, email-address changes and provider settlement transitions. Pending payments remain pending. Final Figma, production SMTP, hosting/region, monitoring vendor, privacy/retention approval and independent security review remain external release gates.

The standalone application now includes project invitations and server-enforced roles, a 3% sandbox ledger, partial refunds, reserved payout requests and owner approval, manual monthly/yearly subscription rehearsal, CSV reports and activity history. See [OPERATIONS.md](OPERATIONS.md) for installation, permission rules, accounting, and remaining roadmap work. These modules have not been ported or deployed to the separate Sites/D1 app.

## Legacy accounts and migration safety

Back up before migrating an existing database. Migrations retain users/payments and expire legacy sessions. Legacy password hashes are not imported into the new credential format: existing users must request a reset and verify email. Sites identities/data remain separate. No destructive reset or automatic merge is performed.

## Isolated local testing

Start a separate cluster with FLOWZA_PG_DIR=local-data/mvp-pg and FLOWZA_PG_PORT=55432 using `npm run db:local`. Then:

```powershell
node scripts/test-env.mjs
node --env-file=.env.test.local node_modules/prisma/build/index.js migrate deploy
node scripts/with-env.mjs .env.test.local node_modules/next/dist/bin/next dev --webpack --hostname 127.0.0.1 --port 3100
# In another terminal:
$env:FLOWZA_TEST_URL="http://127.0.0.1:3100"
node scripts/with-env.mjs .env.test.local node_modules/tsx/dist/cli.mjs --test tests/*.test.ts
node scripts/with-env.mjs .env.test.local node_modules/@playwright/test/cli.js test
```

Node's --env-file cannot be inherited by Next's child process through NODE_OPTIONS, so use with-env.mjs for Next. Test email URLs remain in ignored local-data/mail. Integration accounts are disposable. Recreating test-env rotates test secrets and invalidates its old auth links; never use it against application data.

## Hosting and recovery

Dockerfile builds a web image. Run the same image with `npm run worker` for background work. Set runtime DATABASE_URL, APP_URL, BETTER_AUTH_SECRET, WEBHOOK_ENCRYPTION_KEY and SMTP variables. File email is intentionally forbidden in production. Run migrations once in a release job before web/worker rollout. Configure TLS, trusted reverse proxy/IP handling, DB backups, worker heartbeat alerts, API errors and queue-age alerts. Do not log auth query strings.

Backup with pg_dump custom format; restore using pg_restore into a new database, validate counts/constraints and a sandbox payment, then rehearse application rollback. Schema changes are additive; do not down-migrate or overwrite an existing DB during rollback. Public deployment requires founder approval; no hosting resource is provisioned automatically.
# In-page help chat

The bottom-right assistant works in clearly labeled guide mode without an AI key.
Set `SUPPORT_AI_API_KEY` in the private server environment to enable AI answers using
the existing support provider and optional `SUPPORT_AI_MODEL`. Restart the web
process after changing environment settings. AI account questions require a verified
session, use owner-scoped read-only context, and are limited to eight requests per
minute. Chat history stays in browser memory; no new database tables are needed.

# Saytdagi admin panel

Admin hisob odatiy sayt sessiyasidan tashqari `/admin-login` orqali alohida parol bilan tasdiqlanadi. `FLOWKEY_ADMIN_EMAIL`, `FLOWKEY_ADMIN_PASSWORD_HASH` (Better Auth scrypt xeshi) va kamida 32 belgili tasodifiy `FLOWKEY_ADMIN_SESSION_SECRET` serverda sozlanadi. Ochiq parolni repozitoriyaga yozmang. Admin tasdig‘i asosiy login sessiyasiga bog‘langan va 15 daqiqada tugaydi; parol xeshi yoki imzolash kaliti o‘zgartirilsa avvalgi tasdiqlar bekor bo‘ladi. Har bir hisob uchun bir daqiqada ko‘pi bilan 5 urinishga ruxsat beriladi.

`/admin` sahifasi foydalanuvchilar, loyihalar, yordam murojaatlari va admin amallari jurnalini ko‘rsatadi. `FLOWKEY_ADMIN_USER_IDS` server sozlamasiga ruxsat berilgan tasdiqlangan foydalanuvchilarning IDlarini vergul bilan ajratib kiriting. Sozlama bo‘sh bo‘lsa kirish yopiq. Telegram ulanishi admin huquqini avtomatik bermaydi.

Yangi `202611020001_admin_support` migratsiyasini deploydan oldin qo‘llang. Murojaatlar holati: yangi, ko‘rib chiqilmoqda va hal qilindi. Telegram’ga yetkazilish holati alohida saqlanadi; o‘zgarishlar audit jurnaliga yoziladi. Panel maxfiy API kalitlari yoki parollarni ko‘rsatmaydi.


## Google One Tap on authentication screens

`/login` and `/signup` load the official Google Identity Services client when Google
OAuth is configured. The browser sends the returned credential to Better Auth's
`/api/auth/one-tap/callback`, which validates the Google signature, issuer, audience
and expiry before creating a session. Session tokens remain excluded from JSON.
Google's personalized prompt depends on the visitor's Google/browser eligibility.
In the existing Google OAuth client, add `https://flowkey.uz` to **Authorized JavaScript
origins** (and `https://www.flowkey.uz` only if that origin is used), retaining the
existing callback `https://flowkey.uz/api/auth/callback/google`. Client secret stays
server-only. The ordinary Google button remains available if One Tap is dismissed.

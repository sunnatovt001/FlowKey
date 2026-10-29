# Security requirements

Sandbox only. No live provider flag, card fields, payouts or available balance. Every server resource operation enforces verified user/project ownership or a project-scoped sandbox key.

Better Auth handles passwords, single-use recovery and sessions. Password range 12–128. Cookies HttpOnly/Secure in production/SameSite. No browser token storage. Session management returns IDs, never session credentials. Password change/reset revokes other/all sessions as configured. Legacy credentials require reset and verification.

Rate limits apply to auth IP/account, user mutations, API project and webhook retry. Never trust arbitrary forwarded IP headers without a controlled reverse proxy. Configure edge abuse controls at deployment. Application limits persist in PostgreSQL and expire; 429 includes Retry-After.

256-bit API secrets are shown once and hashed SHA-256. Webhook secrets require AES-GCM encryption using a server-only key. No credential logging. Auth URL request logging is suppressed; reverse-proxy access logs must also redact query strings.

HTTPS/443 public IPv4 webhook destinations only; reject private/metadata/loopback/reserved/IP literals, revalidate DNS and pin transport per attempt. Never follow redirects. DNS 3s, delivery 5s, lease 30s, five bounded attempts. HMAC-SHA256 covers timestamp.rawBody. Receiver uses constant-time comparison, five-minute tolerance and event-ID deduplication.

Payment/event/outbox are atomic. Payloads are immutable. Database constraints enforce positive bounded minor units, currency/status and idempotency. All HTTP input is runtime validated and bounded. Errors avoid internal SQL/stack details. Nonce CSP, clickjacking protection, no-referrer and no-store private responses apply.

Production requires TLS, least-privilege DB/runtime credentials, secret manager, backups/restore, worker/error alerts, dependency/secret scanning and security review. Licensing/partner/KYC/AML/fraud/reconciliation/card scope are separate legal and technical gates before any real money processing. No compliance claim is made.

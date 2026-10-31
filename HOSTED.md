# FLOWZA on Sites

This checkout is the Sites-hosted adaptation of the original FLOWZA sandbox. The root Next.js/PostgreSQL application is preserved separately.

27 October update: hosted checkout, reusable payment links, HTML anchor snippets and server-authenticated checkout creation/retrieval. Checkout expires after 30 minutes and locks the first simulated outcome. D1 native uniqueness prevents duplicate sessions and payments. Disabled links and archived projects block unfinished checkout. Management remains owner-only; public links never reveal API keys. Settings and manual webhook delivery retain the existing hosted behavior; this is not complete PostgreSQL-worker feature parity.

Hosted identity is provided by dispatch-owned Sign in with ChatGPT. User IDs scope all project access. The Site is public by owner request. Landing and documentation allow anonymous visitors; merchant routes require ChatGPT sign-in and project membership. Sandbox Bearer API calls require project keys.

Persistence uses the DB D1 binding and Prisma's D1 adapter. Onboarding and payment/outbox writes use native D1 batch operations, preserving atomicity despite Prisma D1 interactive transactions being unsupported. Payment idempotency is enforced by database uniqueness and payload hashes.

The tracked Drizzle migration creates schema only. Local preview data and local identity mocks are not deployed. The platform applies production migrations at deployment. The encryption key is configured through Sites runtime secrets, never source control.

Outbound webhook delivery uses HTTPS, per-attempt public DNS validation, a three-second DNS deadline, a five-second fetch deadline, manual redirects, signed payloads, and a three-attempt cap. This Worker has no private origin or VPC bindings; its global fetch uses Cloudflare's public-only network policy. Do not replace this with private-network service access. Only actual 2xx responses are marked delivered.

The full application remains a simulated payment sandbox. No real financial integrations or live payment operations exist. Hosted sessions use ChatGPT identity rather than the root application's email/password system. Existing localhost users, secrets, and transaction records are not copied.

Development: install with the Sites install helper, run `npx prisma generate`, apply the initial Drizzle SQL to the local DB binding using Wrangler, then `npm run dev`. Local ChatGPT identity is simulated only by the starter's provided loopback auth route and is absent in production. Build/package/publish using the Sites workflow helpers.

Profile avatar release: authenticated account settings support PNG/JPEG/WebP upload, replacement and deletion. The browser crops the center to 256x256 and sends at most 128 KiB; the server bounds the incoming stream and checks allowed raster signatures. Images use the BUCKET R2 binding under a hashed account-specific key. Both metadata and image bytes require the signed-in owner. The header refreshes after edits and the avatar survives reloads/devices. Local browser upload/persistence/delete and three responsive widths passed. No D1 schema change.

Navigation and support release: workspace routes share a persistent shell and client navigation, including in-account documentation and transaction filters. Telegram support uses authenticated owner-scoped APIs, one-use D1 account links, private-chat bot processing and a secret-authenticated webhook with update claims. AI credentials and admin chat remain optional runtime configuration; missing configuration is shown in account settings. Telegram history and diagnostic ticket snapshots are persisted in D1. No local accounts, database contents or password auth are migrated.

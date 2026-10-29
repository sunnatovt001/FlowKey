# Database design

User owns one Business, which has many Projects. Owner Membership is unique per user/project. Better Auth uses Account, Session, Verification and AuthRateLimit; application abuse limits use RateLimit. OnboardingDraft holds per-user validated progress.

Project owns ApiKeys, Transactions, WebhookEndpoints and AuditLogs. Transaction has one immutable PaymentEvent; subscribed endpoints receive WebhookDelivery rows. Each delivery has numbered WebhookDeliveryAttempts. Delivery payload is a stable snapshot; retry never re-computes current business state.

## Constraints and indexes

Unique normalized email, business owner, API secret hash, membership pair, transaction project/idempotency key, endpoint/transaction delivery and delivery/attempt number. Project/time and status indexes support history; status/nextAttemptAt supports workers. Amount/currency/status database checks reject invalid financial representations.

BIGINT minor units, UZS only (100 minor units = 1 UZS), positive per-payment maximum 1,000,000,000. Individual payment API values remain safe integer numbers; aggregate API volumes are decimal strings. UTC persistence, UZT date filter/display.

## Migration

Initial migration is preserved. Additive auth/project/attempt migration retains records, marks legacy email unverified, invalidates legacy sessions and creates reset-ready credential accounts without copying incompatible password hashes. New payment-event migration is separate. Never reset an existing database. Back up, rehearse on restored data, deploy once, validate, then release application. Existing historical hashes are retained for reference until a separately approved retention cleanup.

No automatic merge between Sites ChatGPT identities and standalone accounts. Archive is the only V1 project removal action; no account or transaction hard-delete endpoint exists.

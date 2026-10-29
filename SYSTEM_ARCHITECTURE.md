# System architecture

## Boundaries

Next.js App Router modular monolith: route handlers authenticate/validate, server services enforce authorization and domain rules, Prisma persists PostgreSQL state. Server Components query authorized data. Client components never import database/auth secrets.

Better Auth owns credentials, verification, reset and session lifecycle. SMTP is required outside local development. Legacy users retain records but must reset credentials and verify email; old sessions expire during migration. Auth JSON responses strip bearer/session tokens; session management exposes IDs only.

## Payments

`PaymentProvider` separates create/retrieve from persistence and authorization. Only SandboxProvider exists. Payment, immutable PaymentEvent, subscribed delivery outbox and audit creation share a database transaction. Idempotency is kept on Transaction with a project/key unique constraint; a redundant idempotency table is unnecessary for V1's sole payment-create operation.

## Background work

`npm run worker` runs pg-boss in a separate Node process against the same database. A singleton dispatch job polls durable delivery rows every 10 seconds. Failed work remains discoverable after process restarts. Delivery leases expire after 30 seconds. External delivery is at least once; receivers deduplicate event IDs.

## Operations

Node 24, PostgreSQL 17, one web process plus one worker initially. No Redis, Kafka or microservices. Separate staging and sandbox databases/secrets. The Docker image can run web or worker; deployment/region is intentionally not provisioned without founder approval.

## Monitoring

Request IDs on API responses; redacted worker/error logs. Monitor API errors/latency, queue age, exhausted attempts, worker heartbeat and DB availability. Configure deployment alerts/error-monitoring after vendor selection; external monitoring is not silently claimed configured.

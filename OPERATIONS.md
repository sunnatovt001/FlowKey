# FlowKey sandbox operations

The standalone Next.js/PostgreSQL app now includes `/finance`, `/subscriptions`, `/team`, `/invitations` and `/activity`. The separate `sites/flowza-hosted` D1 application has not received these PostgreSQL modules and has not been redeployed by this change.

## Installation

Back up the intended database before applying migrations. Run `npm run db:generate`, `npm run db:migrate`, and restart the web and existing webhook worker. Migrations add operation tables without deleting old data. Existing successful sandbox transactions receive balanced journal entries using the explicit 3% fee policy; old transaction amounts and statuses remain unchanged. Run on staging first and compare reports before using an existing data set.

For isolated builds, `FLOWZA_BUILD_DIR=.next-operations` selects another Next output directory. It is a development/build option, not an application feature.

## Accounting

All amounts are integer minor units: 100 minor units = 1 UZS. The fee is `floor(gross * 3 / 100)`. Successful simulated payments post three entries: provider negative gross, fee positive fee, available positive merchant proceeds. Failed and pending payments do not create available balance. Each operation's entries sum to zero. Separate currency fields do not enable USD/EUR payments or conversion; the executable sandbox currently accepts UZS only.

Payment creation, refund posting, payout reservation and subscription billing use the same PostgreSQL transaction-scoped advisory lock per project. Unique operation/account and request keys prevent duplicate postings. Partial refunds use the difference between fees on cumulative refunded gross, so splitting a refund does not change total commission reversal. A refund cannot exceed the original successful payment or spend reserved funds.

Payouts follow `requested -> approved -> completed` or `requested -> rejected` / `approved -> failed`. Requests reserve funds immediately, preventing competing requests from promising the same balance. Rejection/failure releases the reservation once. Only an owner can approve, reject, complete or fail an operation. Completion is a sandbox rehearsal; there is no bank transfer or card destination.

`GET /api/projects/:projectId/report` downloads up to 10,000 newest journal entries as CSV. Values are minor units, timestamps are UTC. The financial UI labels dates in Asia/Tashkent. This is an internal journal report, not an independent partner reconciliation.

## Access and team

Owners manage invitations, financial approvals and refunds. Developers use API-key/webhook/payment-link tools and simulated subscription management. Accountants view reports and request payouts. All three can read the project dashboard and transaction history. Authorization is checked on the server; hidden navigation is supplementary.

An owner creates a seven-day invitation for an exact email and either developer or accountant role. No email is sent automatically. The verified recipient opens `/invitations` and accepts or declines. An invitation grants no access before acceptance. Revocation, expiration, archive, another email and unauthorized financial calls are rejected. An existing member's role is retained on accepting another invitation; remove the membership before changing its role. Existing project API keys remain project credentials until revoked; removing a member cannot revoke a copied shared key automatically. Rotate project keys when ending a collaborator's access.

## Subscriptions

Monthly/yearly sandbox subscriptions explicitly confirm test consent. The first period is due immediately. “Davrni sinash” creates one successful simulated payment atomically with advancing the period and next date. Concurrent requests cannot charge one period twice. Month/year boundaries clamp to a valid date. Cancellation prevents subsequent simulated billing. This does not implement automatic real-card renewal, buyer authorization, provider tokens, failure retries or dunning. No recurring scheduler is enabled.

## API

All session writes require the configured Origin, a verified session and server-side project permissions. POST `/api/projects/:projectId/operations` also requires an `Idempotency-Key` (8-128 word/hyphen characters).

Actions: `refund` (paymentId, amountMinor), `payout` (amountMinor), `approve|reject|complete|fail` (id), `subscribe` (title, amountMinor, interval monthly/yearly, consent true), `bill` (id, period), `cancel` (id). Responses have `livemode:false`; bigint amounts serialize as strings. Creation and refunds replay an identical request key; changed payloads return 409. Payout transitions accept a replay of the current target state; a stale or incompatible transition returns 409. A repeated billed period returns 409 without another payment.

Team POST `/api/projects/:projectId/team`: `invite` (email, role), `remove` (userId), `revoke` (id). Invitation POST `/api/invitations`: id and boolean accept. These routes retain project-scoped audit records without payment credentials.

## External and incomplete roadmap work

Real KYC, licensed partner integration and authenticated incoming provider callbacks, three-role independent review, real subscriptions/tokenization, automatic renewal retry policy, multi-currency configuration/FX, linked payout cards, live payout execution and independent partner reconciliation still require implementation and/or external contracts. Independent security audit, measured load/recovery targets, production SMTP/monitoring, accepted live pilot and commercial release approvals are not claimed completed. The working sandbox is not commercial payment readiness.

## Local activation evidence

On 30 October 2026, after explicit approval, snapshot database `flowza_before_ops_1793335312625` was created before migrating the primary local `flowza` database. User, project and transaction row digests matched the snapshot after migration; no unbalanced journal operations were found. The original database and snapshot are both retained. Do not drop the snapshot until it is no longer needed. Public deployment and real-money capabilities remain outside this activation.

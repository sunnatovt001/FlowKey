# FLOWZA — product context

Reviewed 26 October 2026. These are source-backed product notes for subsequent work, not authorization to expand the current implementation.

## Sources and confidence

- Roadmap: https://flowza-roadmap.u-t-m-u.chatgpt.site/ — read in the browser, including the expanded technical structure and full embedded concept.
- The embedded concept identifies itself as version 1.0, dated 21 October 2026. The roadmap explicitly labels detailed daily tasks and architecture decomposition as proposals added to that concept.
- Shared conversation: https://chatgpt.com/s/t_6ad8db685300819195c3214dad5db109 — opened, but the conversation body was unavailable. Do not claim independent verification of that conversation. The roadmap's embedded copy is the accessible source.

## Product intent

FLOWZA is monetization infrastructure for Uzbekistan's independent developers and small digital businesses: SaaS, AI services, educational products, websites, and apps. Its intended value is shortening onboarding and integration, rather than presenting an already-operational banking integration.

The target north-star metric is time from registration to the first confirmed real payment: 5–10 minutes for merchants who pass the standard verification path. This is a future target, not an achieved benchmark or a promise for every KYC case. Measure sandbox time separately.

## Product rules in the concept

- Multiple projects per account, with project-specific API keys and permissions.
- Three payment integration paths: payment links, FLOWZA-hosted checkout, and a merchant's custom interface backed by a server-side API.
- One-time payments and subscriptions, including recurring billing with explicit buyer consent and partner-supported tokenization.
- Roles are project-scoped: owner manages financial controls and approves payouts; developer manages technical integration without requesting payouts or moving funds; accountant reads reports and creates payout requests for owner approval.
- Proposed fee: 3% of a successful payment. On a 100,000 UZS payment, the conceptual split is 3,000 fee and 97,000 merchant proceeds. A 1% partner cost is only a scenario; the remaining 2% is before other costs, not net profit.
- Payout requests are user-initiated, not automatically scheduled. Proposed minimum: 20,000 UZS or an approved equivalent. Partial/full requests and project/general-workspace entry points are envisaged. The concept allows up to five linked cards via partner infrastructure; it does not authorize storing card credentials.
- Currency architecture anticipates UZS, USD, and EUR. Account default currency and project currency are independently configurable, with each setting change limited to once per 30 days. Actual balances remain separate per currency; overview equivalents are display values, not implicit conversion.

## Financial and architectural implications

Payment volume is not an available balance. A future ledger must separately account for gross payment, commission, merchant proceeds, refunds, holds/reserves, and completed payouts. Financial state transitions must preserve amounts and prevent duplicate postings.

Payout flow: request → validate available funds/minimum → owner approval → reserve funds → partner execution → reconciliation → confirmed final state. Concurrent requests must not reserve the same money twice. Failed/rejected requests release reserves only according to verified state.

A checkout return URL is not payment confirmation. Payment outcomes come from authenticated server-side status and verified partner events. Incoming partner events and outgoing merchant webhooks are separate integration boundaries. Both need idempotency and replay handling. Billing periods also need duplicate-charge protection.

Suggested modules: identity/verification; projects/memberships; payment sessions; partner adapter; subscriptions/billing periods; ledger; payout requests/approvals; reconciliation; event outbox/worker; audit/monitoring. This is a modular direction, not a requirement to introduce microservices immediately.

## Relationship to the existing MVP

The implemented application is the narrower simulated sandbox requested in the original build brief. It establishes authentication, first-project onboarding, project access isolation, hashed sandbox keys, simulated payment creation/retrieval, idempotency, transactions, database-derived dashboard metrics, manual signed webhook delivery controls, and documentation.

Still outside the implemented scope: additional-project creation UI, team invitations and enforced three-role permission matrix, real merchant verification, hosted checkout/payment links, subscription lifecycle, incoming partner callbacks, double-entry financial ledger, commission postings, refunds, available balances, payout approvals/reserves/execution, reconciliation, multi-currency settings, and automatic webhook workers. A Membership role column alone does not mean role-based authorization is implemented.

Do not describe successful test payment volume as withdrawable money, onboarding as KYC approval, or a simulated successful result as a partner-confirmed payment. The roadmap broadens future product context; it does not silently supersede the current sandbox-only scope.

## Roadmap interpretation

The source proposes four team members and three 15-day phases: platform foundation, payment logic, then testing/security. Its daily task statuses are planned, not evidence of completion.

With 22 October 2026 counted as day 1, day 45 is 5 December 2026; 6 December is the following decision window. Do not infer implementation progress from the current calendar date. Technical acceptance and commercial launch are separate milestones.

Recommended dependency order for future work: confirm scope and partner responsibility boundaries → multi-project and role enforcement → payment sessions and simulated checkout/links → ledger/commission/refund invariants → durable event delivery → subscriptions and payout simulation → reconciliation, recovery and operational acceptance. Keep real-money paths disabled until the external launch conditions are satisfied.

## Unresolved launch decisions

Partner identity, merchant eligibility and verification responsibilities, contractual/legal operating model, actual processing/payout costs, supported settlement currencies, recurring-charge capabilities, and commercial launch date remain unconfirmed in the source. Security review, recovery tests, monitoring, reconciliation, operating procedures, and an accepted pilot are launch gates. This document records those source uncertainties; it is not a legal or regulatory determination.

## Implementation update - 30 October 2026

The historical scope list above predates checkout, automatic outgoing webhook delivery, project creation, and the operations extension. Current standalone app behavior is documented in README.md, CHECKOUT.md and OPERATIONS.md. Added: invitations and role enforcement; 3% balanced sandbox ledger; partial refunds; atomic payout reserves and owner approval; manual monthly/yearly sandbox subscription billing/cancellation; CSV and activity pages. The separate Sites/D1 app has not received this extension. Real partner/KYC, card billing, FX and live execution remain unavailable.

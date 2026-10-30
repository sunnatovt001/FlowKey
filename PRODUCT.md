# FlowKey

FlowKey is an Uzbek-language developer payment platform under development. The user requested completion of frontend and backend work against the supplied 45-day roadmap. Extend the existing DESIGN.md and application rather than redesigning it.

The current delivery is a simulated sandbox: authenticated projects, API integration, checkout, payment links, webhooks, financial accounting, refunds, payout rehearsal and subscriptions. No real card data, bank execution or identity approval is available. Live processing depends on an identified licensed partner, contract, verified callbacks, supported currencies and recurring-payment consent infrastructure.

Owners manage projects and team permissions and approve simulated withdrawals. Developers integrate and test payments. Accountants review financial records and request withdrawals. All changes must be project-scoped and enforced on the server. Monetary amounts use integer minor units; transaction volume must never be labeled available balance.

Operational screens preserve the established navy, blue and white design, Uzbek copy, clear empty/loading/error states, keyboard controls and responsive layouts. Currency balances are separate; no implicit FX conversion. New financial operations must be atomic, auditable and safe to replay. External commercial release gates remain explicit.

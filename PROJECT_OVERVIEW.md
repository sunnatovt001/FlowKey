# FLOWZA

Developer-first payment sandbox for Uzbekistan. Build your product. We handle the payments.

## V1 outcome

Verified account → business/project → sandbox key → payment API → persisted transaction → dashboard → signed webhook.
The canonical application is the root Next.js/PostgreSQL project. `sites/flowza-hosted` is a frozen reference with independent identity/data and is not migrated automatically.

## Boundaries

UZS only, owner-only management, one business per user and multiple projects. All payments are simulated. Pending is a selected outcome and does not settle automatically. No cards, money, balances, payouts, refunds, subscriptions or live activation. Proposed 3% pricing is subject to confirmation.

## Release ownership

Founder approves scope, hosting/region/budget, legal copy and audience. Developer A owns frontend/accessibility; B owns services/data/worker. Both review security-sensitive changes. Designer owns final Figma. Fourth member is proposed QA/operations coordinator.

## External gates

Production SMTP sender, hosting credentials/region, final Figma handoff, privacy/retention approval and independent security review remain release prerequisites. Local email uses an ignored file inbox and is never advertised as actual email delivery.

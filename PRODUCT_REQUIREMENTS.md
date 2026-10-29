# Product requirements

## Routes

| Route         | Purpose                              | Required acceptance                                                               |
| ------------- | ------------------------------------ | --------------------------------------------------------------------------------- |
| /             | Explain product and sandbox pricing  | Working signup/docs CTA; no invented customer claims                              |
| /signup       | Create account                       | Verification email; duplicate-safe signup; no merchant access before verification |
| /login        | Login, verification resend, reset    | Generic errors; expired/reused reset rejected; persistent session                 |
| /onboarding   | Business and first project           | Resumable DB draft; atomic, duplicate-safe completion                             |
| /dashboard    | Project activity                     | Actual DB aggregates; empty state; no balance terminology                         |
| /transactions | Inspect test payments                | ID/status/UZT date filters, pagination, details                                   |
| /developers   | Keys, sandbox, webhooks              | One-time secrets, real DB payment, truthful delivery history                      |
| /docs         | Integration guide                    | Examples match implemented API and OpenAPI                                        |
| /settings     | Profile, security, business/projects | Edit, session revoke, create/edit/archive projects                                |

## Shared behavior

All private reads/mutations require server authorization. Project selection is explicit and checked. Every form provides loading/error/success feedback; lists have empty states. Keyboard navigation, readable status labels, focus management and reduced motion are required at 1440/768/390 widths.

## Project lifecycle

Archive preserves history, revokes API keys, disables webhook endpoints and blocks new payments/keys. Settings remains available if all projects are archived. Cross-project IDs never grant access.

## V2 order

Sandbox Hosted Checkout → Payment Links → team roles → advanced analytics → partner integration preparation → ledger/reconciliation → balances/payouts → recurring billing → multi-currency. Real functionality requires separate approval and partner capability evidence.

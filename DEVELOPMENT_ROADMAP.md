# 45 working-day roadmap

Two full-time developers: 90 theoretical person-days; approximately 66 for feature work and 24 for review, testing, fixes and coordination. Designer works one phase ahead. Fourth member is proposed QA/operations coordinator.

| Phase          | Days and work                                                                                          | Owner        | Deliverable / acceptance                    | Risk / effort                    |
| -------------- | ------------------------------------------------------------------------------------------------------ | ------------ | ------------------------------------------- | -------------------------------- |
| 0 Audit        | 1 inventory/data; 2 scope/journey; 3 retention/backlog                                                 | Both/founder | Approved scope and reference retention      | Unknown legacy data / 4 dev-days |
| 1 Architecture | 4 contracts; 5 auth spike; 6 DB/outbox/tokens; 7 review                                                | B/A/designer | Reviewed architecture and Figma core states | Version/email dependency / 6     |
| 2 Foundation   | 8 layouts; 9 primitives; 10 navigation/docs shell; 11 a11y/CI                                          | A/B          | Responsive shell, test DB, checks           | Handoff delays / 5               |
| 3 Auth         | 12 schema; 13 signup/login; 14 verification; 15 recovery; 16 draft; 17 atomic setup; 18 E2E            | Both         | Verified user → protected dashboard         | Sender/DNS / 9                   |
| 4 Projects     | 19 CRUD; 20 archive/switch; 21 aggregates; 22 dashboard; 23 history; 24 isolation                      | Both         | Multiple isolated projects and real stats   | Authz/date semantics / 8         |
| 5 Payments     | 25 provider; 26 keys; 27 service; 28 idempotency; 29 API; 30 UI; 31 races; 32 demo                     | B/A          | API → persistence → dashboard               | Concurrency/precision / 12       |
| 6 Webhooks     | 33 events; 34 worker; 35 SSRF/signing; 36 history; 37 docs; 38 receiver                                | B/A          | Durable attempts and receiver evidence      | Network/leases / 10              |
| 7 QA           | 39 settings; 40 regression; 41 restart/faults; 42 responsive/a11y; 43 restore/build; 44 UAT; 45 review | All          | Evidence against release checklist          | Late scope / 12                  |

Critical path: scope/auth → email/onboarding/ownership → project isolation → keys/payment/idempotency → outbox/worker → E2E/security QA. Email/hosting decisions due Day 7. Final Figma requirements gate each visual slice.

Each phase is done when acceptance is demonstrated, tests/checks pass, contracts/docs are updated, review completes and remaining blockers have owners. Scope additions require schedule reassessment; do not consume final QA days with new advanced features.

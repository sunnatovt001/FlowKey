# FLOWZA — external sandbox test guide

The latest Next.js/PostgreSQL application is ready for local acceptance testing. Public beta remains blocked on server access, HTTPS domain, SMTP, and an external webhook receiver test. The older public Sites adaptation is not the same release. Never use real money, cards, bank credentials or confidential customer data in these tests.

## Tester journey

1. Open the deployed URL provided by the release owner. Sign up with an email you control, verify it, and complete business/project onboarding. In local development only, verification email is written to ignored local-data/mail; this is not email delivery.
2. Confirm the new dashboard has zero transactions. Create a sandbox API key in Developers and save it server-side. The secret is only shown once.
3. In Developers → Payment links & HTML integration, enter a descriptive title and an ordinary UZS amount (125000.50 is 125,000 sums and 50 tiyin). Create the link.
4. Copy the HTML snippet into a separate website and publish that page. Open its button. Confirm the merchant/project, title, amount, UZS currency and Sandbox label.
5. Continue to checkout and simulate successful. Repeat using fresh checkout sessions for failed and pending. Confirm each appears once in Transactions and dashboard counts/volume reflect the actual outcomes. Pending is not a settled payment.
6. Reload the completed checkout and press Back/Forward: no duplicate payment should appear. Disable the link; it and unfinished sessions should be unavailable. Create another session, wait 30 minutes and verify expiry blocks payment.
7. From your backend POST /api/v1/checkout/sessions with Bearer key and Idempotency-Key. Store the returned ID alongside your order. Open returned url. GET /api/v1/checkout/sessions/{id} with that same server key returns status and payment; confirm amount/currency against your order before treating the sandbox order as paid. Same key/body must return the same session; changed amount with the same key must return 409.
8. Register your own public HTTPS webhook endpoint. Verify raw-body HMAC and timestamp using the docs; deduplicate event IDs. Confirm the real endpoint receives the event and returns 2xx before marking delivery successful. Check failure/retry history too. Do not use localhost/private IP endpoints.
9. Use a second account/project: it must not read or change the first project's keys, links or transactions. Revoke a key and confirm API calls return 401.
10. Check phone (390), tablet (768) and desktop (1440), keyboard controls, useful errors, logout and password recovery.

Report a bug with the page, steps, expected/actual result, timestamp and request ID. Redact API keys, cookies, reset links and personal details. Do not send full secrets in screenshots.

## Release owner checklist

- Confirm deploy user's SSH access with the server administrator; no deployment has been performed to 173.212.216.216.
- Use the root app, Node runtime, PostgreSQL and the separate webhook worker. Configure APP_URL to the actual HTTPS origin, auth/encryption secrets and SMTP from .env.example. Never expose database or worker ports publicly.
- Back up before applying migrations; deploy one migration runner, then web and worker. Do not copy local test users, mail files or secrets to the server.
- Check authenticated and anonymous routes, first-user signup/verification/reset, external API access, signed webhook delivery, worker restart and logs.
- Configure managed backups/restore, alerting, rate-limit/abuse controls and an owner for support. Complete legal/privacy review and independent security review before broad public use.
- Pilot with invited testers first. Clearly label all activity Sandbox; live activation, balances and payouts remain unavailable.

## Local test commands (PowerShell)

Use the existing isolated .env.test.local (never commit it). Keep the dedicated PostgreSQL test instance running. Set FLOWZA_TEST_INSTANCE=1 to use .next-test without disturbing the normal development build. This does not alter authentication or permissions.

    $env:FLOWZA_TEST_INSTANCE='1'
    node scripts/with-env.mjs .env.test.local node_modules/next/dist/bin/next dev --webpack --hostname 127.0.0.1 --port 3100

In another terminal:

    $env:FLOWZA_TEST_URL='http://127.0.0.1:3100'
    $env:CHECKOUT_DB_TEST='1'
    node scripts/with-env.mjs .env.test.local node_modules/tsx/dist/cli.mjs --test tests/*.test.ts
    node scripts/with-env.mjs .env.test.local node_modules/@playwright/test/cli.js test

Never point these write-based tests at an actual merchant or public beta database.

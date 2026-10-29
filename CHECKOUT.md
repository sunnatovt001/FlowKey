# Hosted checkout and payment links — sandbox only

This addition is in the standalone Next.js/PostgreSQL application. It is not yet deployed to the separate Sites/D1 application. No licensed partner or real-money processing is configured.

## Setup and HTML-only websites

Back up your database, generate Prisma, apply migrations, and restart the app. APP_URL must be the externally reachable HTTPS origin when sharing links. Run the existing webhook worker for automatic notifications.

Open Developers, create a payment link with a title and a human-readable UZS amount (for example 125000.50), then copy its HTML anchor into your website and publish that page. The form converts to minor units exactly without floating-point multiplication. The visitor opens /pay/{id} and continues to /checkout/{id}. Links are reusable; each checkout expires in 30 minutes. Disable a link from Developers to block new and unfinished checkouts. Project archive also blocks checkout. Already created transactions remain in history.

## Verification — 27 October 2026

TypeScript and lint passed before the final OpenAPI documentation addition. Four checkout tests passed against isolated PostgreSQL: amount parsing, validation, safe HTML, and concurrent session/payment completion with changed-payload conflict, expiry and archive denial. The broader default suite passed 14 tests, with five environment-dependent tests skipped. Production build passed; final OpenAPI addition is checked again separately. Browser confirmation of the new forms is outstanding: the existing development server on port 3000 prevents starting the isolated test server in the same checkout. No existing server was stopped, no original database was migrated, and nothing was deployed to Sites or the supplied remote server.

## Backend integration

POST /api/v1/checkout/sessions with server-side Authorization: Bearer $FLOWZA_KEY, Content-Type: application/json and Idempotency-Key: unique-order-123.

Body: {"title":"Course","amount_minor":100000,"currency":"UZS"}

Response: {"id":"...","url":"https://your-flowza-host/checkout/...","expires_at":"...","livemode":false}

Redirect your customer to url. Never put a secret API key in HTML, frontend JavaScript, or URLs. This endpoint intentionally has no cross-origin browser access.

The same key and payload return the same checkout; a changed payload returns 409. The first chosen sandbox outcome is locked; concurrent completion/reload uses one payment idempotency key. Only successful/failed/pending simulation is available. No card data is collected. Checkout does not redirect to arbitrary merchant URLs.

Completion returns the normal payment ID. Verify using GET /api/v1/payments/{id} with your server key or the existing signed webhook flow; never fulfill an order using browser text as proof. Reusable links have no customer/order identity and are suitable for demos, not automated order fulfillment. Order-specific integrations should create one session per order server-side and store its ID. Unknown, disabled or archived links show not-found; expired sessions cannot create a payment.

Anonymous public routes: /pay/{id}, /checkout/{id}; same-origin POST /api/payment-links/{id} starts checkout and POST /api/checkout/{id} completes it. Session-authorized owner-only POST/DELETE /api/projects/{projectId}/payment-links manages links. Public possession of a high-entropy URL permits sandbox interaction, never account access.

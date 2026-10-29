# API specification

Public machine-readable contract: GET `/api/openapi`. Runtime sandbox base: APP_URL + `/api/v1`. `simulated_result` is accepted as an alias for `result`; conflicting fields are rejected. Both normalize to the same idempotency hash.

POST `/api/v1/payments`: Bearer sandbox key, JSON `{amount_minor,currency:"UZS",result:"successful"|"failed"|"pending"}` and Idempotency-Key matching 8–128 word/hyphen characters. New payment 201; identical replay 200; changed payload 409. `result` is retained for compatibility with the initial prototype. No project ID can override the API key's project.

GET `/api/v1/payments/{id}` retrieves only the key's project. Responses include id, amount_minor, currency, status, project_id, livemode:false and created_at. Never send card information.

## Management endpoints (cookie/session auth)

- `/api/auth/*`: Better Auth signup/signin, verification, recovery, password change and signout. Browser JSON is credential-redacted.
- GET/PUT/POST `/api/onboarding`: draft read/save and setup completion.
- GET/POST `/api/projects`; PATCH `/api/projects/{id}`; POST `/{id}/archive`.
- GET `/api/projects/{id}/overview`, `/transactions`, `/transactions/{transactionId}`.
- GET/POST `/api/projects/{id}/api-keys`; POST `/api-keys/{keyId}/revoke`.
- POST `/api/projects/{id}/sandbox/payments` uses the same payment service.
- GET/POST `/api/projects/{id}/webhook-endpoints`; PATCH `/{endpointId}`; POST `/{endpointId}/rotate-secret`.
- GET `/api/projects/{id}/webhook-deliveries`, `/{deliveryId}`; POST `/{deliveryId}/retry`.
- GET/PATCH `/api/settings/profile`, `/business`; GET/POST `/api/settings/sessions` (POST revokes owned session ID).

Prototype aliases `/keys`, `/payments`, `/webhooks` and `/deliveries` remain for the incumbent UI. Management mutations require same-origin checks. History pagination defaults to 20 and caps at 100. Status/ID/from/to filters are server-side; dates mean Asia/Tashkent days.

Application errors carry code/message/request_id. Statuses: 400 invalid, 401 unauthenticated, 403 forbidden, 404 missing/unauthorized resource, 409 conflict/archive, 429 limit with Retry-After, 500 safe internal error, 503 unavailable. Better Auth retains its documented message/code errors.

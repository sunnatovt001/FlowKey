# Email verification and password recovery QA

Result: local functional and browser checks passed.

Sign-up now opens the dedicated email-code screen. Unverified sign-in offers the
same screen. Email confirmation and password recovery use six-digit codes expiring
in ten minutes, with hashed storage, five failed attempts, per-account throttling,
resend cooldown, purpose separation and single-use consumption. Previous password
reset links remain usable until expiry. Repeated sign-up resends verification
rather than silently returning success without mail.

Screenshots inspected: output/email-codes/desktop.png (1440×1000) and
output/email-codes/mobile.png (390×844). Existing right-side auth layout, original
language flags, cartoon background and transitions are preserved. Input supports
numeric keyboards, one-time-code autofill and pasted codes. UZ/RU/EN labels and
errors are localized; no mobile horizontal overflow.

Isolated loopback PostgreSQL integration checks passed: signup, repeated signup,
rotation, invalid/expired/purpose-mismatched codes, hashed storage, session response
redaction, single use, password update, old-session revocation and five-attempt lock.
Existing legacy password-link lifecycle also passed. No production accounts were
created or changed by these tests.

Browser checks passed with mocked API responses: signup-to-code navigation,
localized invalid code, resend and mobile code-based password recovery.
Typecheck passed. Unit suite: 52 passed, 15 integration-dependent tests skipped.
Lint: no errors, 13 existing warnings.

Delivery diagnostics: production SMTP connection/authentication verified without
sending a test message. Existing mail log confirms Gmail accepted a message for
the user-supplied recipient (DSN 2.0.0). SMTP acceptance does not establish inbox
placement; spam filtering remains possible. New mail logs record only sanitized
failure codes or SMTP acceptance, never recipient addresses or OTPs.

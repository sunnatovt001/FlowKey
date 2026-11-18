# Email code release

The email verification and password recovery fix is committed to
`fix/email-verification-codes` at `ea0e22e` and merged into `main`.

Production rollout uses the mail-only branch based on the previously active
`3f0ceeb`, using the exact previously active source as its baseline. A one-off
`deploy-email-codes.sh` selects the mail-only branch and omits the deployment
script's pending platform patch blocks. The final comparison is against the
previously active release, rather than against prepared but unreleased patches.
Build, tests, schema compatibility guard, health checks and rollback behavior
are unchanged. The standard deployment script is not modified.

Main also contains pre-existing Prisma changes from the parallel platform work.
The deployment schema guard requires their compatibility review before deploying
main. The email rollout does not force that unrelated release or apply migrations.

No SMTP credentials or recipient addresses are stored in this repository.
SMTP connection/authentication passed, and existing logs show Gmail accepted a
message for the reported recipient. Inbox placement is not established by SMTP.

# Email code release

The email verification and password recovery fix is committed to
`fix/email-verification-codes` at `ea0e22e` and merged into `main`.

Production rollout uses the mail-only branch based on the previously active
`3f0ceeb`, preserving the reviewed server patch application in the deployment
script. A one-off `deploy-email-codes.sh` changes only the fetched branch/ref;
the build, tests, existing patch preservation, schema compatibility guard,
health checks and rollback behavior are unchanged.

Main also contains pre-existing Prisma changes from the parallel platform work.
The deployment schema guard requires their compatibility review before deploying
main. The email rollout does not force that unrelated release or apply migrations.

No SMTP credentials or recipient addresses are stored in this repository.
SMTP connection/authentication passed, and existing logs show Gmail accepted a
message for the reported recipient. Inbox placement is not established by SMTP.

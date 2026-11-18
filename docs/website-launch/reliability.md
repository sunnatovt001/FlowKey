# FlowKey reliability runbook

Installed 15 November 2026 on the VPS. Scripts live outside release folders in `/home/deploy/flowkey-ops/reliability`, so ordinary application deploys retain them. The deploy user's crontab is preserved and a marked block adds three jobs. Cron uses server timezone; every-six-hour/minute intervals do not depend on the UI timezone.

- Database backup: every six hours; consistent exported PostgreSQL snapshot, custom-format dump, SHA-256 manifest and public table counts from the same snapshot. Retain scheduled backups 14 days after a new successful backup. Manual pre-deploy backups are untouched.
- Restore: weekly Sunday 04:25 server time. Verify checksum, restore all schemas to an isolated randomly named `flowkey_restore_*` database, compare all 32 public table counts, remove test database. It uses the operator's existing sudo privileges for that temporary database; application role is not given CREATEDB. No application or worker connects to the restored database.
- Monitor: every minute with a nonoverlap lock. Checks HTTPS database health, PM2 worker, heartbeat, backup age and successful restore age. Telegram alerts need two consecutive failed probes, repeat at most hourly after successful send, and issue one recovery notice. Failed Telegram sends remain pending. One labelled test notice was delivered to the existing configured admin.

All backup and monitoring files remain server-side and private (directory 700, backup 600). No production data was downloaded. **There is no offsite copy yet. A full VPS/disk loss can still lose the backups.** Select an external destination before treating this as disaster recovery.

## Operator commands

Run as deploy:

```sh
node /home/deploy/flowkey-ops/reliability/backup.mjs
node /home/deploy/flowkey-ops/reliability/restore.mjs
node /home/deploy/flowkey-ops/reliability/monitor.mjs
bash /home/deploy/flowkey-ops/rollback.sh --rehearse /home/deploy/flowkey-ops/releases/20261114T165940-support-replies
```

Restore has no production restore mode. It accepts only a scheduled backup basename and creates a distinct temporary database. A manual production database recovery requires a separate reviewed procedure.

`rollback.sh --rehearse RELEASE` validates a built release under the expected releases directory and identical schema, starts it on a dynamically selected loopback port, verifies health, login and unauthorized admin reply rejection, then stops it. This passed without changing Nginx, current symlink or live worker.

`rollback.sh --activate RELEASE` is an explicit operator action. It verifies the candidate before switching Nginx; a failed post-switch health check returns traffic to the old port. It pauses automatic deployments and records the original release in `reliability/rollback-before-release`. It never rolls back the database and deliberately retains the current schema-compatible worker. Reconcile worker/release metadata and validate before resuming the deploy timer. No live rollback was induced during this task.

Inspect `reliability/backup.json`, `restore.json`, `monitor.json`, `rollback.json` and their job logs for evidence. The crontab before installation and prior rollback script are saved on the server. Do not publish `.env`, database dumps or the manifest's private record counts.

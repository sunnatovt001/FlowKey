FlowKey VPS operations

Host: deploy@173.212.216.216
Runtime: Next.js / Prisma / PostgreSQL, branch main. Never deploy sites-design here.
Root: /home/deploy/flowkey-ops
Secrets: shared/.env (mode 600). User data: PostgreSQL flowkey and shared/local-data.
Read-only repository deploy key: ~/.ssh/flowkey_readonly.

Deployment: systemd flowkey-deploy.timer checks main every minute. The deployment script uses flock, installs locked dependencies, generates Prisma and Next types, typechecks, runs unit tests, builds, starts the inactive localhost port (4051 or 4052), verifies database health, login page and OpenAPI, then reloads only the FlowKey nginx upstream. Previous release stays available. Database schema changes stop automatic deployment until compatibility is reviewed; no automatic destructive migrations.

Status:
  systemctl status flowkey-deploy.timer flowkey-deploy.service
  tail -80 /home/deploy/flowkey-ops/auto-deploy.log
  cat /home/deploy/flowkey-ops/current-sha

Rollback:
  /home/deploy/flowkey-ops/rollback.sh
This pauses automatic deployment and switches to the previous release, without restoring the database or deleting user data. Initial application backup and PostgreSQL custom dump are in backups/initial-20261101. Restore that database only as a separately planned operation because it discards later writes.

Resume after reviewing main:
  sudo systemctl start flowkey-deploy.timer

TLS: certbot.timer handles renewal. Use certbot renew --dry-run to validate.
DNS: apex A 173.212.216.216, www CNAME flowkey.uz. Do not repoint mail to this VPS unless mail hosting has been configured here.

Telegram sign-in uses a separate login bot. Private variables:
TELEGRAM_LOGIN_BOT_TOKEN, TELEGRAM_LOGIN_BOT_USERNAME, TELEGRAM_LOGIN_WEBHOOK_SECRET.
Webhook: https://flowkey.uz/api/telegram-login/webhook with Telegram's secret_token header.
Never switch the support bot to this webhook. Set allowed_updates to message and
callback_query; retain pending updates. The browser must initiate the request, check
the six-digit code in the bot, confirm, and return to the same browser within 10 minutes.
Requests are single-use and browser-bound; no bot token or browser proof appears in URLs.
Provider identity is mapped by Telegram ID, never by user-supplied email. Telegram-only
accounts have no verified email and cannot use email/password recovery. Internal reserved
email placeholders are not deliverable mailboxes and never grant email verification.

Auth flow update: /forgot-password, /reset-password and /verify-email are standalone
screens. Legacy /login?token= links redirect to /reset-password. Telegram bot return
uses /telegram-login#telegram_token=...; the fragment is removed before the POST to
/api/auth/telegram/resume. Each return credential is single-use and expires with the
original request; original-browser confirmation can complete independently once.
FlowKey nginx uses flowkey_auth_safe logging: no query strings, no /api/auth/ credential
paths, and no referrer values. Configuration: /etc/nginx/conf.d/flowkey-auth-logging.conf.

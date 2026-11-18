# Admin support replies

Admins with an active step-up session can reply from `/admin/tickets/[id]`. Replies are stored separately from ticket resolution and Telegram delivery; writing a reply does not automatically close a ticket. Users see their own replies in Settings → Telegram → Murojaatlarim (latest 20 per ticket). Admin detail shows the latest 50.

Before rollout run `npm run db:migrate` and `npm run db:generate`, then rebuild and restart web and worker. The additive SupportReply migration does not modify existing tickets. No migration has been applied to production in this task.

The existing worker processes queued Telegram notices. Bot token is required; absent configuration leaves notices queued. Unlinked users get `not_linked` and can still read replies on the website. Failed sends back off and stop after five failed attempts. Delivery is at-least-once: a crash after Telegram accepts a notice can repeat the notice. Telegram receives only a generic notification, not reply contents.

Replies and their audit records commit atomically. Per-ticket UUID request keys prevent retry duplication and reject reuse with changed content. Audit contains the admin ID, ticket ID, reply ID and time, not reply text. Support API selects only the current user's tickets and omits staff IDs, delivery metadata and request keys from replies.

import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { db } from "../server/db";
import {
  replyToTicket,
  deliverReplyNotifications,
} from "../server/support-replies";
import { packText, packSnapshot } from "../server/telegram/storage";
import "./helpers";
test(
  "reply notifications retry safely, target only ticket owner and keep text private",
  { skip: process.env.FLOWKEY_SUPPORT_DB_TEST !== "1" },
  async () => {
    const database = new URL(process.env.DATABASE_URL || "http://invalid");
    assert.ok(
      ["localhost", "127.0.0.1"].includes(database.hostname) &&
        database.pathname.endsWith("_test"),
    );
    const id = randomUUID(),
      actor = randomUUID();
    const previous = process.env.TELEGRAM_BOT_TOKEN;
    const fetcher = globalThis.fetch;
    const calls: { chat_id: string; text: string }[] = [];
    try {
      await db.user.create({
        data: {
          id,
          email: `reply-${id}@example.test`,
          name: "Reply test",
          telegramConnection: { create: { chatId: "99123456" } },
        },
      });
      const t = await db.supportTicket.create({
        data: {
          userId: id,
          summary: packText("Test"),
          diagnostics: packSnapshot({}),
          requestKey: randomUUID(),
        },
      });
      const r = await replyToTicket(
        actor,
        t.id,
        "PRIVATE ANSWER",
        randomUUID(),
      );
      process.env.TELEGRAM_BOT_TOKEN = "mock-only";
      globalThis.fetch = async () => {
        throw Error("offline");
      };
      await deliverReplyNotifications();
      let row = await db.supportReply.findUniqueOrThrow({
        where: { id: r.id },
      });
      assert.equal(row.notificationStatus, "queued");
      assert.equal(row.attempts, 1);
      assert.equal(await db.supportReply.count({ where: { id: r.id } }), 1);
      await db.supportReply.update({
        where: { id: r.id },
        data: { retryAt: new Date(0) },
      });
      globalThis.fetch = async (input, init) => {
        assert.ok(
          String(input).startsWith("https://api.telegram.org/botmock-only/"),
        );
        calls.push(JSON.parse(String(init?.body)));
        return Response.json({ ok: true, result: {} });
      };
      await Promise.all([
        deliverReplyNotifications(),
        deliverReplyNotifications(),
      ]);
      row = await db.supportReply.findUniqueOrThrow({ where: { id: r.id } });
      assert.equal(row.notificationStatus, "sent");
      assert.ok(row.deliveredAt);
      assert.equal(calls.length, 1);
      assert.equal(calls[0].chat_id, "99123456");
      assert.ok(!calls[0].text.includes("PRIVATE ANSWER"));
      await deliverReplyNotifications();
      assert.equal(calls.length, 1);
      await db.telegramConnection.delete({ where: { userId: id } });
      const unlinked = await replyToTicket(
        actor,
        t.id,
        "Still visible on website",
        randomUUID(),
      );
      await deliverReplyNotifications();
      assert.equal(
        (
          await db.supportReply.findUniqueOrThrow({
            where: { id: unlinked.id },
          })
        ).notificationStatus,
        "not_linked",
      );
    } finally {
      globalThis.fetch = fetcher;
      if (previous === undefined) delete process.env.TELEGRAM_BOT_TOKEN;
      else process.env.TELEGRAM_BOT_TOKEN = previous;
      await db.adminAudit.deleteMany({ where: { actorId: actor } });
      await db.user.deleteMany({ where: { id } });
      await db.$disconnect();
    }
  },
);

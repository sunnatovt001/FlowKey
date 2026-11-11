import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { db } from "../server/db";
import { hash } from "../server/security";
import { packText, packSnapshot } from "../server/telegram/storage";
import {
  requireTelegramAdmin,
  setTelegramAdminSession,
} from "../server/telegram/admin-access";
import { processUpdate } from "../server/telegram/bot";
import "./helpers";
test(
  "Telegram admin needs configured verified owner and expiring web grant; confirmations are audited and conflict safe",
  { skip: process.env.FLOWKEY_SUPPORT_DB_TEST !== "1" },
  async () => {
    const url = new URL(process.env.DATABASE_URL || "http://invalid");
    assert.ok(
      ["localhost", "127.0.0.1"].includes(url.hostname) &&
        url.pathname.endsWith("_test"),
    );
    const suffix = randomUUID(),
      owner = `tg-owner-${suffix}`,
      other = `tg-other-${suffix}`,
      chat = "88110001",
      foreign = "88110002";
    const envKeys = [
      "TELEGRAM_ADMIN_CHAT_ID",
      "FLOWKEY_ADMIN_USER_IDS",
      "FLOWKEY_ADMIN_PASSWORD_HASH",
      "TELEGRAM_BOT_TOKEN",
    ] as const;
    const previous = Object.fromEntries(
      envKeys.map((key) => [key, process.env[key]]),
    );
    const originalFetch = globalThis.fetch;
    const messages: {
      text: string;
      reply_markup?: { inline_keyboard: { callback_data?: string }[][] };
    }[] = [];
    let ticketId = "",
      sessionKey = "";
    globalThis.fetch = async (input, init) => {
      assert.ok(String(input).startsWith("https://api.telegram.org/bot"));
      const data = JSON.parse(String(init?.body));
      if (String(input).endsWith("/sendMessage")) messages.push(data);
      return Response.json({ ok: true, result: {} });
    };
    function message(id: string, text: string) {
      return processUpdate({
        update_id: 1,
        message: {
          message_id: 1,
          from: { id: Number(id) },
          chat: { id: Number(id), type: "private" },
          text,
        },
      });
    }
    function callback(id: string, data: string) {
      return processUpdate({
        update_id: 2,
        callback_query: {
          id: "test-callback",
          from: { id: Number(id) },
          data,
          message: { message_id: 1, chat: { id: Number(id), type: "private" } },
        },
      });
    }
    try {
      process.env.TELEGRAM_ADMIN_CHAT_ID = chat;
      process.env.FLOWKEY_ADMIN_USER_IDS = owner;
      process.env.FLOWKEY_ADMIN_PASSWORD_HASH = "test-only-hash";
      process.env.TELEGRAM_BOT_TOKEN = "test-only-token";
      for (const [id, c] of [
        [owner, chat],
        [other, foreign],
      ])
        await db.user.create({
          data: {
            id,
            email: `${id}@example.com`,
            name: id,
            emailVerified: true,
            telegramConnection: { create: { chatId: c } },
          },
        });
      const ticket = await db.supportTicket.create({
        data: {
          userId: other,
          requestKey: `tg-admin-${suffix}`,
          summary: packText("PRIVATE SUPPORT SUMMARY"),
          diagnostics: packSnapshot({}),
          status: "sent",
        },
      });
      ticketId = ticket.id;
      await assert.rejects(requireTelegramAdmin(chat), /ruxsati tugagan/);
      await message(chat, "/panel");
      assert.ok(!messages.at(-1)?.text.includes("Foydalanuvchilar:"));
      await assert.rejects(setTelegramAdminSession(other, true));
      await setTelegramAdminSession(owner, true);
      assert.equal((await requireTelegramAdmin(chat)).id, owner);
      await message(chat, "/panel");
      assert.match(messages.at(-1)!.text, /Foydalanuvchilar:/);
      for (const row of messages)
        for (const buttons of row.reply_markup?.inline_keyboard || [])
          for (const button of buttons)
            if (button.callback_data)
              assert.ok(Buffer.byteLength(button.callback_data) <= 64);
      await callback(foreign, `pa:ticket:${ticketId}`);
      assert.ok(!messages.at(-1)!.text.includes("PRIVATE SUPPORT SUMMARY"));
      await callback(foreign, `pa:set:${ticketId}:o:r`);
      assert.equal(
        (await db.supportTicket.findUniqueOrThrow({ where: { id: ticketId } }))
          .resolutionStatus,
        "open",
      );
      await callback(chat, `pa:confirm:${ticketId}:o:p`);
      assert.equal(
        (await db.supportTicket.findUniqueOrThrow({ where: { id: ticketId } }))
          .resolutionStatus,
        "open",
      );
      await callback(chat, `pa:set:${ticketId}:o:p`);
      const updated = await db.supportTicket.findUniqueOrThrow({
        where: { id: ticketId },
      });
      assert.equal(updated.resolutionStatus, "in_progress");
      assert.equal(updated.status, "sent");
      await callback(chat, `pa:set:${ticketId}:o:r`);
      assert.match(messages.at(-1)!.text, /o‘zgargan/);
      assert.equal(
        await db.adminAudit.count({ where: { targetId: ticketId } }),
        1,
      );
      const audit = await db.adminAudit.findFirstOrThrow({
        where: { targetId: ticketId },
      });
      assert.equal((audit.details as { source: string }).source, "telegram");
      process.env.FLOWKEY_ADMIN_PASSWORD_HASH = "rotated";
      await assert.rejects(requireTelegramAdmin(chat));
      process.env.FLOWKEY_ADMIN_PASSWORD_HASH = "test-only-hash";
      const session =
        "telegram-admin-session:" +
        hash(
          `${chat}:${owner}:${(await db.telegramConnection.findUniqueOrThrow({ where: { userId: owner } })).id}:test-only-hash`,
        );
      sessionKey = session;
      await db.supportBotState.update({
        where: { id: session },
        data: { leaseUntil: new Date(0) },
      });
      await assert.rejects(requireTelegramAdmin(chat));
      await setTelegramAdminSession(owner, true);
      await db.telegramConnection.delete({ where: { userId: owner } });
      await assert.rejects(requireTelegramAdmin(chat));
      await db.telegramConnection.create({
        data: { userId: owner, chatId: chat },
      });
      await assert.rejects(requireTelegramAdmin(chat));
    } finally {
      globalThis.fetch = originalFetch;
      await db.adminAudit.deleteMany({ where: { actorId: owner } });
      await db.supportBotState.deleteMany({
        where: {
          id: sessionKey || "unused-test-session",
        },
      });
      await db.user.deleteMany({ where: { id: { in: [owner, other] } } });
      for (const key of envKeys) {
        if (previous[key] === undefined) delete process.env[key];
        else process.env[key] = previous[key];
      }
      await db.$disconnect();
    }
  },
);

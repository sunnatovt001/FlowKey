import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { lookupAccount } from "../server/telegram/lookup";
import { unpackText, unpackSnapshot } from "../server/telegram/storage";
import { db } from "../server/db";
import { hash } from "../server/security";
import {
  createLink,
  consumeLink,
  unlinkAccount,
} from "../server/telegram/link";
import { accountContext } from "../server/telegram/context";
import { createTicket } from "../server/telegram/tickets";
test(
  "Telegram links are single-use/expiring, account data and tickets are isolated, unlink revokes pending codes",
  { skip: process.env.FLOWKEY_SUPPORT_DB_TEST !== "1" },
  async () => {
    const database = new URL(process.env.DATABASE_URL || "http://invalid");
    assert.ok(
      ["127.0.0.1", "localhost"].includes(database.hostname) &&
        database.pathname.endsWith("_test"),
      "Use an isolated loopback _test database",
    );
    const suffix = randomUUID(),
      userA = `support-a-${suffix}`,
      userB = `support-b-${suffix}`;
    try {
      for (const id of [userA, userB])
        await db.user.create({
          data: {
            id,
            email: `${id}@example.com`,
            name: id,
            emailVerified: true,
          },
        });
      await db.business.create({
        data: {
          ownerId: userA,
          name: "Only account A",
          type: "Startup",
          projects: { create: { name: "A project" } },
        },
      });
      await db.business.create({
        data: {
          ownerId: userB,
          name: "Only account B",
          type: "Company",
          projects: { create: { name: "PRIVATE B PROJECT" } },
        },
      });
      const link = await createLink(userA);
      assert.equal(
        (await db.telegramLink.findUniqueOrThrow({ where: { userId: userA } }))
          .codeHash,
        hash(link.code),
      );
      await consumeLink(link.code, "101");
      await assert.rejects(consumeLink(link.code, "202"));
      const expired = await createLink(userB);
      await db.telegramLink.update({
        where: { userId: userB },
        data: { expiresAt: new Date(0) },
      });
      await assert.rejects(consumeLink(expired.code, "202"));
      const b = await createLink(userB);
      await assert.rejects(consumeLink(b.code, "101"));
      assert.ok(await db.telegramLink.findUnique({ where: { userId: userB } }));
      await consumeLink(b.code, "202");
      const context = await accountContext(userA);
      assert.equal(context.projectCount, 1);
      assert.ok(!JSON.stringify(context).includes("PRIVATE B PROJECT"));
      const foreign = await db.project.findFirstOrThrow({
        where: { business: { ownerId: userB } },
      });
      const hidden = await lookupAccount(userA, {
        section: "projects",
        project_id: foreign.id,
        query: null,
        status: null,
        offset: 0,
      });
      assert.equal(hidden.count, 0);
      const first = await createTicket(userA, "O‘zbekcha muammo 🔧", suffix);
      const repeat = await createTicket(userA, "Same action replay", suffix);
      assert.equal(first.id, repeat.id);
      const other = await createTicket(userB, "B project muammosi", suffix);
      assert.notEqual(first.id, other.id);
      assert.equal(unpackText(first.summary), "O‘zbekcha muammo 🔧");
      assert.ok(Array.isArray(unpackSnapshot(first.diagnostics).findings));
      assert.equal(first.status, "queued");
      assert.equal(first.deliveredAt, null);
      const pending = await createLink(userA);
      await unlinkAccount(userA);
      assert.equal(
        await db.telegramConnection.findUnique({ where: { userId: userA } }),
        null,
      );
      await assert.rejects(consumeLink(pending.code, "101"));
      const race = await createLink(userA);
      const attempts = await Promise.allSettled([
        consumeLink(race.code, "303"),
        consumeLink(race.code, "304"),
      ]);
      assert.equal(attempts.filter((r) => r.status === "fulfilled").length, 1);
    } finally {
      await db.user.deleteMany({ where: { id: { in: [userA, userB] } } });
      await db.$disconnect();
    }
  },
);

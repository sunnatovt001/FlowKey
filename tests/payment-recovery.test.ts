import test from "node:test";
import assert from "node:assert/strict";
import { randomBytes, randomUUID } from "node:crypto";
import { db } from "../server/db";
import "./helpers";

const base = process.env.FLOWZA_TEST_URL;
test(
  "payment-link retries reuse a session, separate links and preserve the first outcome",
  { skip: !base },
  async () => {
    const user = await db.user.create({
      data: {
        email: `recovery-${randomUUID()}@example.test`,
        emailVerified: true,
      },
    });
    try {
      const business = await db.business.create({
        data: { ownerId: user.id, name: "Recovery", type: "Startup" },
      });
      const project = await db.project.create({
        data: { businessId: business.id, name: "Recovery" },
      });
      const links = await Promise.all(
        [1, 2].map((n) =>
          db.paymentLink.create({
            data: {
              id: randomBytes(32).toString("hex"),
              projectId: project.id,
              title: `Recovery ${n}`,
              amountMinor: 10000,
              currency: "UZS",
            },
          }),
        ),
      );
      const key = randomUUID();
      const post = (path: string, data: unknown, requestKey: string = key) =>
        fetch(`${base}${path}`, {
          method: "POST",
          headers: {
            Origin: base!,
            "Content-Type": "application/json",
            "Idempotency-Key": requestKey,
          },
          body: JSON.stringify(data),
        });
      const results = await Promise.all(
        Array.from({ length: 3 }, () =>
          post(`/api/payment-links/${links[0].id}`, {}),
        ),
      );
      for (const r of results)
        assert.equal(r.status, 200, await r.clone().text());
      const sessions = await Promise.all(results.map((r) => r.json()));
      assert.ok(sessions.every((s) => s.id === sessions[0].id));
      assert.equal(
        await db.checkoutSession.count({ where: { projectId: project.id } }),
        1,
      );
      const other = await (
        await post(`/api/payment-links/${links[1].id}`, {})
      ).json();
      assert.notEqual(other.id, sessions[0].id);
      assert.equal(
        (await post(`/api/payment-links/${links[0].id}`, {}, "bad")).status,
        400,
      );
      const completed = await post(`/api/checkout/${sessions[0].id}`, {
        result: "successful",
      });
      assert.equal(completed.status, 200);
      const payment = await completed.json();
      const replay = await (
        await post(`/api/checkout/${sessions[0].id}`, { result: "failed" })
      ).json();
      assert.equal(replay.id, payment.id);
      assert.equal(replay.status, "successful");
      assert.equal(
        await db.transaction.count({ where: { projectId: project.id } }),
        1,
      );
      await db.checkoutSession.update({
        where: { id: other.id },
        data: { expiresAt: new Date(0) },
      });
      assert.equal(
        (await post(`/api/checkout/${other.id}`, { result: "pending" })).status,
        410,
      );
    } finally {
      // Financial history is retained in this disposable test database; its owner drops the database after the run.
      await db.$disconnect();
    }
  },
);

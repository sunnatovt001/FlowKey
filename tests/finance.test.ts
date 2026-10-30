import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { feeFor, refundSplit, nextBilling } from "../server/finance-rules";
import { roleAllows } from "../shared/project-role";

test("commission and split refunds preserve every minor unit", () => {
  assert.equal(feeFor(10_000_000n), 300_000n);
  for (let gross = 1n; gross < 300n; gross++) {
    let total = 0n;
    for (let i = 0n; i < gross; i++) total += refundSplit(gross, i, 1n).fee;
    assert.equal(total, feeFor(gross));
  }
  assert.throws(() => refundSplit(100n, 90n, 11n));
  assert.throws(() => refundSplit(100n, 0n, -1n));
});
test("billing calendar clamps month end and leap years", () => {
  assert.equal(
    nextBilling(new Date("2026-01-31T10:00:00Z"), "monthly").toISOString(),
    "2026-02-28T10:00:00.000Z",
  );
  assert.equal(
    nextBilling(new Date("2024-02-29T10:00:00Z"), "yearly").toISOString(),
    "2025-02-28T10:00:00.000Z",
  );
});
test("role boundaries deny financial operations to developers", () => {
  assert.equal(roleAllows("developer", "technical"), true);
  assert.equal(roleAllows("developer", "finance"), false);
  assert.equal(roleAllows("accountant", "technical"), false);
  assert.equal(roleAllows("accountant", "finance"), true);
  assert.equal(roleAllows("accountant", "owner"), false);
  assert.equal(roleAllows("unexpected", "read"), false);
});
test(
  "atomic accounting, concurrent reservations, refund replay, and subscription periods",
  { skip: !process.env.FINANCE_DB_TEST },
  async () => {
    const url = new URL(
      process.env.DATABASE_URL || "postgresql://invalid/invalid",
    );
    assert.ok(
      ["127.0.0.1", "localhost"].includes(url.hostname) &&
        url.pathname.endsWith("_test"),
      "Only isolated test databases are allowed",
    );
    const { db } = await import("../server/db");
    const { createPayment } = await import("../server/payments");
    const {
      financialOverview,
      requestPayout,
      transitionPayout,
      refundPayment,
      createSubscription,
      billSubscription,
      cancelSubscription,
    } = await import("../server/finance");
    const suffix = randomUUID();
    const user = await db.user.create({
      data: { email: `finance-${suffix}@example.com`, emailVerified: true },
    });
    const business = await db.business.create({
      data: { ownerId: user.id, name: "Finance test", type: "Startup" },
    });
    const project = await db.project.create({
      data: {
        businessId: business.id,
        name: "Finance test",
        memberships: { create: { userId: user.id, role: "owner" } },
      },
    });
    try {
      const [payment, replay] = await Promise.all([
        createPayment(
          project.id,
          { amount_minor: 10_000_000, currency: "UZS", result: "successful" },
          suffix,
        ),
        createPayment(
          project.id,
          { amount_minor: 10_000_000, currency: "UZS", result: "successful" },
          suffix,
        ),
      ]);
      assert.equal(payment.id, replay.id);
      let overview = await financialOverview(project.id);
      const balance = (data: typeof overview, account: string) =>
        BigInt(
          data.balances.find((b) => b.account === account)?.amountMinor || 0,
        );
      assert.equal(balance(overview, "available"), 9_700_000n);
      const attempts = await Promise.allSettled([
        requestPayout(project.id, user.id, 6_000_000n, randomUUID()),
        requestPayout(project.id, user.id, 6_000_000n, randomUUID()),
      ]);
      assert.equal(attempts.filter((r) => r.status === "fulfilled").length, 1);
      const payout = attempts.find((r) => r.status === "fulfilled");
      assert.ok(payout && payout.status === "fulfilled");
      await assert.rejects(
        transitionPayout(project.id, user.id, payout.value.id, "complete"),
      );
      await transitionPayout(project.id, user.id, payout.value.id, "approve");
      await Promise.all([
        transitionPayout(project.id, user.id, payout.value.id, "fail"),
        transitionPayout(project.id, user.id, payout.value.id, "fail"),
      ]);
      assert.equal(
        balance(await financialOverview(project.id), "available"),
        9_700_000n,
      );
      const key = randomUUID();
      const refund = await refundPayment(
        project.id,
        user.id,
        payment.id,
        1_000_000n,
        key,
      );
      assert.equal(
        (await refundPayment(project.id, user.id, payment.id, 1_000_000n, key))
          .id,
        refund.id,
      );
      await assert.rejects(
        refundPayment(project.id, user.id, payment.id, 2_000_000n, key),
      );
      assert.equal(
        balance(await financialOverview(project.id), "available"),
        8_730_000n,
      );
      await assert.rejects(
        refundPayment(
          project.id,
          user.id,
          payment.id,
          10_000_000n,
          randomUUID(),
        ),
      );
      const subscription = await createSubscription(
        project.id,
        user.id,
        { title: "Test plan", amountMinor: 100_000n, interval: "monthly" },
        randomUUID(),
      );
      const bills = await Promise.allSettled([
        billSubscription(project.id, user.id, subscription.id, 0),
        billSubscription(project.id, user.id, subscription.id, 0),
      ]);
      assert.equal(bills.filter((r) => r.status === "fulfilled").length, 1);
      assert.equal(
        await db.transaction.count({
          where: {
            projectId: project.id,
            idempotencyKey: `subscription_${subscription.id}_0`,
          },
        }),
        1,
      );
      await cancelSubscription(project.id, user.id, subscription.id);
      await assert.rejects(
        billSubscription(project.id, user.id, subscription.id, 1),
      );
      overview = await financialOverview(project.id);
      assert.equal(
        overview.balances.reduce((n, b) => n + BigInt(b.amountMinor), 0n),
        0n,
      );
      const journals = await db.ledgerEntry.groupBy({
        by: ["operationId"],
        where: { projectId: project.id },
        _sum: { amountMinor: true },
      });
      assert.ok(journals.every((j) => j._sum.amountMinor === 0n));
    } finally {
      await db.$disconnect();
    }
  },
);

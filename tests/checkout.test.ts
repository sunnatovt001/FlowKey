import test from "node:test";
import assert from "node:assert/strict";
import { checkoutInput, checkoutOutcome, paymentButton, uzsToMinor } from "../server/checkout-validation";
test("human UZS entry converts exactly and rejects invalid monetary input", () => {
  assert.equal(uzsToMinor("125000.01"), 12500001);
  assert.equal(uzsToMinor("0.29"), 29);
  assert.equal(uzsToMinor("10000000"), 1000000000);
  for (const value of ["0", "-1", "1e6", "1.001", "10000000.01", "abc"]) assert.throws(() => uzsToMinor(value));
  assert.throws(() => paymentButton("javascript:alert(1)"));
});
test("checkout accepts bounded integer UZS amounts and rejects client-controlled outcomes", () => {
  assert.ok(checkoutInput.safeParse({ title: "Course", amount_minor: 10000, currency: "UZS" }).success);
  for (const amount_minor of [0, -1, 1.5, 1000000001]) assert.equal(checkoutInput.safeParse({ title: "Course", amount_minor, currency: "UZS" }).success, false);
  assert.equal(checkoutInput.safeParse({ title: "Course", amount_minor: 100, currency: "UZS", result: "successful" }).success, false);
  assert.equal(checkoutOutcome.safeParse({ result: "paid" }).success, false);
});
test("HTML integration is an ordinary link without secret credentials", () => {
  const html = paymentButton("https://example.com/pay/abc");
  assert.ok(html.includes('rel="noopener noreferrer"'));
  assert.ok(!html.includes("fz_test_"));
});
test("checkout locks outcome, prevents duplicate payment, and rejects altered replay and expiry", { skip: !process.env.CHECKOUT_DB_TEST }, async () => {
  const { db } = await import("../server/db");
  const { newSession, completeSession } = await import("../server/checkout");
  const { randomUUID } = await import("node:crypto");
  const suffix = randomUUID();
  const user = await db.user.create({ data: { email: `checkout-${suffix}@example.com`, emailVerified: true } });
  const business = await db.business.create({ data: { ownerId: user.id, name: "Checkout test", type: "SaaS" } });
  const project = await db.project.create({ data: { businessId: business.id, name: "Checkout test" } });
  const input = { title: "Test purchase", amount_minor: 12000, currency: "UZS" };
  try {
    const [a, b] = await Promise.all([newSession(project.id, input, suffix), newSession(project.id, input, suffix)]);
    assert.equal(a.id, b.id);
    await assert.rejects(newSession(project.id, { ...input, amount_minor: 1 }, suffix), /Idempotency/);
    const results = await Promise.all([completeSession(a.id, "successful"), completeSession(a.id, "failed")]);
    assert.equal(results[0].id, results[1].id);
    assert.equal(results[0].status, results[1].status);
    assert.equal(await db.transaction.count({ where: { projectId: project.id } }), 1);
    if (process.env.FLOWZA_TEST_URL) {
      const { hash } = await import("../server/security");
      const token = `fz_test_${randomUUID()}`;
      await db.apiKey.create({ data: { projectId: project.id, name: "Checkout verification test", prefix: "fz_test_", secretHash: hash(token) } });
      const base = process.env.FLOWZA_TEST_URL;
      const endpoint = `${base}/api/v1/checkout/sessions/${a.id}`;
      assert.equal((await fetch(endpoint)).status, 401);
      const response = await fetch(endpoint, { headers: { Authorization: `Bearer ${token}` } });
      assert.equal(response.status, 200);
      const verified = await response.json();
      assert.equal(verified.payment.id, results[0].id);
      assert.equal(verified.amount_minor, 12000);
      assert.equal(verified.livemode, false);
      const other = await db.project.create({ data: { businessId: business.id, name: "Other checkout project" } });
      const otherToken = `fz_test_${randomUUID()}`;
      await db.apiKey.create({ data: { projectId: other.id, name: "Other project", prefix: "fz_test_", secretHash: hash(otherToken) } });
      assert.equal((await fetch(endpoint, { headers: { Authorization: `Bearer ${otherToken}` } })).status, 404);
    }
    const expired = await newSession(project.id, input, randomUUID());
    await db.checkoutSession.update({ where: { id: expired.id }, data: { expiresAt: new Date(0) } });
    await assert.rejects(completeSession(expired.id, "successful"), /muddati tugagan/);
    await db.project.update({ where: { id: project.id }, data: { archivedAt: new Date() } });
    await assert.rejects(completeSession(a.id, "successful"), /mavjud emas/);
  } finally { await db.$disconnect(); }
});

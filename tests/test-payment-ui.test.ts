import test from "node:test";
import assert from "node:assert/strict";
import { testAmount, testPaymentReply } from "../shared/testing-payment";
test("test amounts accept grouped UZS and exact cents but reject malformed and excessive values", () => {
  assert.equal(testAmount("49 000"), 4900000);
  assert.equal(testAmount("0,01"), 1);
  assert.equal(testAmount("10 000 000"), 1000000000);
  for (const bad of [
    "",
    "0",
    "-1",
    "1e3",
    "1.001",
    "2.3.4",
    "10 000 000.01",
    "Infinity",
  ])
    assert.equal(testAmount(bad), null, bad);
});
test("test reply must belong to the selected project, amount and test environment", () => {
  const reply = {
    id: "test-id",
    amount_minor: 4900000,
    currency: "UZS",
    status: "successful",
    project_id: "project-a",
    livemode: false,
    created_at: "2026-11-15T00:00:00Z",
  };
  assert.ok(testPaymentReply(reply, "project-a", 4900000));
  for (const change of [
    { project_id: "other" },
    { amount_minor: 1 },
    { currency: "USD" },
    { livemode: true },
    { status: "unknown" },
      { status: ["successful"] },
    { created_at: "bad" },
  ])
    assert.equal(
      testPaymentReply({ ...reply, ...change }, "project-a", 4900000),
      false,
    );
  assert.equal(testPaymentReply({}, "project-a", 4900000), false);
});

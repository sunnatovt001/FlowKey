import test from "node:test";
import assert from "node:assert/strict";
import { openapi } from "../server/openapi";
import { payment } from "../server/validators";
import { sandboxProvider } from "../server/providers/sandbox";
test("OpenAPI example uses the real payment validator", () => {
  const spec = openapi("https://sandbox.example");
  const example =
    spec.paths["/payments"].post.requestBody.content["application/json"]
      .example;
  assert.deepEqual(payment.parse(example), example);
  assert.equal(spec.openapi, "3.1.0");
  assert.ok(spec.paths["/payments"].post.responses["201"]);
});
test("sandbox provider supports each explicit outcome without settlement", async () => {
  for (const outcome of ["successful", "failed", "pending"] as const) {
    const result = await sandboxProvider.createPayment({
      id: "fixture",
      amountMinor: BigInt(100),
      currency: "UZS",
      outcome,
    });
    assert.equal(result.status, outcome);
    assert.deepEqual(
      await sandboxProvider.retrievePayment(result.reference),
      result,
    );
  }
});

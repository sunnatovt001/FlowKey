import test from "node:test";
import assert from "node:assert/strict";
import { signWebhook, verifyWebhook } from "../server/webhook-signature";
test("webhook verification requires exact raw body, valid timestamp and secret", () => {
  const raw = '{"id":"evt_test"}';
  const header = signWebhook(raw, "fixture-signing-secret", 1000);
  assert.equal(
    verifyWebhook(raw, header, "fixture-signing-secret", 1001),
    true,
  );
  assert.equal(
    verifyWebhook(raw + " ", header, "fixture-signing-secret", 1001),
    false,
  );
  assert.equal(verifyWebhook(raw, header, "wrong-secret", 1001), false);
  assert.equal(
    verifyWebhook(raw, header, "fixture-signing-secret", 1400),
    false,
  );
  assert.equal(
    verifyWebhook(raw, "t=1000,v1=broken", "fixture-signing-secret", 1001),
    false,
  );
});

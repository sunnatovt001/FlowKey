import test from "node:test";
import assert from "node:assert/strict";
import {
  passwordHash,
  passwordMatches,
  hash,
  secret,
  isPublicAddress,
  webhookUrl,
  encrypt,
  decrypt,
} from "../server/security";
import { payment, onboarding, credentials } from "../server/validators";
test("passwords are salted and verified; incorrect passwords fail", () => {
  const a = passwordHash("correct horse battery staple");
  const b = passwordHash("correct horse battery staple");
  assert.notEqual(a, b);
  assert.ok(passwordMatches("correct horse battery staple", a));
  assert.equal(passwordMatches("wrong", a), false);
});
test("API secrets have 256 bits and store a deterministic hash", () => {
  const a = secret("fz_test_");
  assert.match(a, /^fz_test_[a-f0-9]{64}$/);
  assert.notEqual(a, secret("fz_test_"));
  assert.equal(hash(a).length, 64);
  assert.notEqual(hash(a), a);
});
test("unsafe webhook network ranges and IPv6 are rejected", () => {
  for (const address of [
    "0.0.0.0",
    "10.0.0.1",
    "127.0.0.1",
    "169.254.169.254",
    "172.16.2.3",
    "172.31.255.255",
    "192.168.1.1",
    "100.64.0.1",
    "198.18.0.1",
    "192.0.2.1",
    "198.51.100.1",
    "203.0.113.1",
    "224.0.0.1",
    "255.255.255.255",
    "::1",
    "::ffff:127.0.0.1",
  ])
    assert.equal(isPublicAddress(address), false, address);
  assert.equal(isPublicAddress("8.8.8.8"), true);
  assert.equal(isPublicAddress("1.1.1.1"), true);
});
test("webhook URLs require safe transport and DNS hostnames", () => {
  for (const url of [
    "http://example.com",
    "https://localhost",
    "https://127.0.0.1",
    "https://2130706433",
    "https://[::1]",
    "https://user:pass@example.com",
    "https://example.com:8443",
    "https://example.com/#secret",
  ])
    assert.throws(() => webhookUrl(url), url);
  assert.equal(
    webhookUrl("https://api.example.com/events").hostname,
    "api.example.com",
  );
});
test("webhook secrets are authenticated encrypted and reject tampering", () => {
  process.env.WEBHOOK_ENCRYPTION_KEY = "a".repeat(64);
  const value = encrypt("whsec_test");
  assert.ok(!value.includes("whsec_test"));
  assert.equal(decrypt(value), "whsec_test");
  const parts = value.split(":");
  parts[1] = (parts[1].startsWith("00") ? "01" : "00") + parts[1].slice(2);
  assert.throws(() => decrypt(parts.join(":")));
});
test("money uses bounded positive integer minor units and UZS only", () => {
  assert.ok(
    payment.safeParse({
      amount_minor: 12500000,
      currency: "UZS",
      result: "successful",
    }).success,
  );
  for (const amount of [0, -1, 0.5, 1000000001, NaN, Infinity, "100"])
    assert.equal(
      payment.safeParse({
        amount_minor: amount,
        currency: "UZS",
        result: "successful",
      }).success,
      false,
    );
  assert.equal(
    payment.safeParse({
      amount_minor: 100,
      currency: "USD",
      result: "successful",
    }).success,
    false,
  );
  assert.equal(
    payment.safeParse({ amount_minor: 100, currency: "UZS", result: "paid" })
      .success,
    false,
  );
});
test("registration normalizes email and rejects weak passwords", () => {
  assert.equal(
    credentials.parse({
      email: "DEV@EXAMPLE.COM",
      password: "long-enough-password",
    }).email,
    "dev@example.com",
  );
  assert.equal(
    credentials.safeParse({ email: "bad", password: "short" }).success,
    false,
  );
});
test("onboarding validates business type and website protocol", () => {
  const input = {
    businessName: "Acme",
    businessType: "Startup",
    projectName: "Demo",
  };
  assert.ok(onboarding.safeParse(input).success);
  assert.equal(
    onboarding.safeParse({ ...input, website: "javascript:alert(1)" }).success,
    false,
  );
  assert.equal(
    onboarding.safeParse({ ...input, businessType: "Invalid" }).success,
    false,
  );
});

import test from "node:test";
import assert from "node:assert/strict";
import { verificationCode } from "./helpers";
const base = process.env.FLOWZA_TEST_URL;
test("email codes rotate, expire, verify once, separate purposes and reset passwords with session revocation", { skip: !base }, async () => {
  const email = `otp-${Date.now()}@example.com`;
  const password = "original-password-for-test-123";
  const post = (path: string, data: unknown, origin = base!) => fetch(`${base}/api/auth/${path}`, { method: "POST", headers: { Origin: origin, "Content-Type": "application/json" }, body: JSON.stringify(data) });
  const created = await post("sign-up/email", { email, password, name: "OTP test" });
  assert.equal(created.status, 200, await created.clone().text());
  const first = await verificationCode(email);
  const { db } = await import("../server/db");
  const stored = await db.verification.findFirst({ where: { identifier: { contains: email } }, orderBy: { createdAt: "desc" } });
  assert(stored && !stored.value.includes(first), "Only a hash should be stored");
  assert.equal((await post("sign-up/email", { email, password, name: "Repeated registration" })).status, 200);
  const afterRepeat = await verificationCode(email);
  const updated = await db.verification.findFirst({ where: { identifier: { contains: email } }, orderBy: { createdAt: "desc" } });
  assert(updated && !updated.value.includes(afterRepeat));
  assert(updated.id !== stored.id, "Repeated signup creates a fresh usable code");
  assert.equal((await post("email-otp/send-verification-otp", { email, type: "email-verification" }, "https://evil.example")).status, 403);
  assert.equal((await post("email-otp/send-verification-otp", { email, type: "email-verification" })).status, 200);
  const rotated = await verificationCode(email);
  if (first !== rotated) assert.equal((await post("email-otp/verify-email", { email, otp: first })).status, 400);
  const verified = await post("email-otp/verify-email", { email, otp: rotated });
  assert.equal(verified.status, 200, await verified.clone().text());
  assert.equal((await verified.clone().json()).token, undefined);
  assert(verified.headers.getSetCookie().some(value => value.includes("session_token=")));
  assert.equal((await post("email-otp/verify-email", { email, otp: rotated })).status, 400);
  // Independent reset journey: clear this test account's minute bucket only.
  const { hash } = await import("../server/security");
  await db.rateLimit.deleteMany({ where: { key: hash(`auth-account:${email}:${Math.floor(Date.now() / 60000)}`) } });
  const login = await post("sign-in/email", { email, password });
  assert.equal(login.status, 200);
  const cookie = login.headers.getSetCookie().map(value => value.split(";")[0]).join("; ");
  assert.equal((await post("email-otp/request-password-reset", { email })).status, 200);
  const reset = await verificationCode(email, "forget-password");
  assert.equal((await post("email-otp/verify-email", { email, otp: reset })).status, 400, "Reset codes must not verify email directly");
  const newPassword = "replacement-password-for-test-456";
  const changed = await post("email-otp/reset-password", { email, otp: reset, password: newPassword });
  assert.equal(changed.status, 200, await changed.clone().text());
  assert.equal((await post("email-otp/reset-password", { email, otp: reset, password: newPassword })).status, 400);
  assert.equal((await fetch(`${base}/api/settings/sessions`, { headers: { Cookie: cookie } })).status, 401);
  assert.equal((await post("sign-in/email", { email, password })).status, 401);
  assert.equal((await post("sign-in/email", { email, password: newPassword })).status, 200);
  assert.equal((await post("email-otp/request-password-reset", { email })).status, 200);
  const expired = await verificationCode(email, "forget-password");
  await db.verification.updateMany({ where: { identifier: { contains: email } }, data: { expiresAt: new Date(Date.now() - 1000) } });
  assert.equal((await post("email-otp/reset-password", { email, otp: expired, password: newPassword })).status, 400);
  // A separate recovery attempt must lock after five wrong codes.
  await db.rateLimit.deleteMany({ where: { key: hash(`auth-account:${email}:${Math.floor(Date.now() / 60000)}`) } });
  assert.equal((await post("email-otp/request-password-reset", { email })).status, 200);
  const limited = await verificationCode(email, "forget-password");
  for (let attempt = 0; attempt < 5; attempt++) {
    assert.equal((await post("email-otp/reset-password", { email, otp: limited === "000000" ? "999999" : "000000", password: newPassword })).status, 400);
  }
  const locked = await post("email-otp/reset-password", { email, otp: limited, password: newPassword });
  assert.equal(locked.status, 403);
  assert.equal((await locked.json()).code, "TOO_MANY_ATTEMPTS");
});

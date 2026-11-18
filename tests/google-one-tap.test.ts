import test from "node:test";
import assert from "node:assert/strict";
import { betterAuth } from "better-auth";
import { memoryAdapter } from "better-auth/adapters/memory";
import { oneTap } from "better-auth/plugins/one-tap";
const base = "https://flowkey.example";
test("Google One Tap rejects invalid credentials, cross-origin requests and external callbacks without issuing sessions", async () => {
  const data = { user: [], session: [], account: [], verification: [] };
  const auth = betterAuth({ baseURL: base, secret: "one-tap-test-secret-with-at-least-32-characters", database: memoryAdapter(data), socialProviders: { google: { clientId: "test.apps.googleusercontent.com", clientSecret: "test-nonsecret" } }, plugins: [oneTap()], logger: { disabled: true } });
  for (const [origin, callbackURL] of [[base, "/onboarding"], ["https://untrusted.example", "/onboarding"], [base, "https://untrusted.example/onboarding"]]) {
    const response = await auth.handler(new Request(base + "/api/auth/one-tap/callback", { method: "POST", headers: { Origin: origin, "Content-Type": "application/json" }, body: JSON.stringify({ idToken: "invalid-test-credential", callbackURL }) }));
    assert(response.status >= 400 && response.status < 500);
    assert(!response.headers.getSetCookie().some(c => c.includes("session_token=")));
  }
  assert.equal(data.user.length, 0); assert.equal(data.account.length, 0); assert.equal(data.session.length, 0);
});

import test from "node:test";
import assert from "node:assert/strict";
import { betterAuth } from "better-auth";
import { memoryAdapter } from "better-auth/adapters/memory";
import { socialAuthConfiguration } from "../server/social-auth";

const base = "https://flowkey.example";
function setup() {
  const data = { user: [], session: [], account: [], verification: [] };
  const auth = betterAuth({
    baseURL: base,
    secret: "oauth-test-secret-with-at-least-32-characters",
    database: memoryAdapter(data),
    socialProviders: socialAuthConfiguration({
      GOOGLE_CLIENT_ID: "test-google-client",
      GOOGLE_CLIENT_SECRET: "test-google-secret",
      GITHUB_CLIENT_ID: "test-github-client",
      GITHUB_CLIENT_SECRET: "test-github-secret",
    }),
    account: { encryptOAuthTokens: true },
    logger: { disabled: true },
  });
  return { auth, data };
}
function request(provider: string, callbackURL = "/onboarding") {
  return new Request(base + "/api/auth/sign-in/social", {
    method: "POST",
    headers: { Origin: base, "Content-Type": "application/json" },
    body: JSON.stringify({ provider, callbackURL, disableRedirect: true }),
  });
}
test("OAuth initiation uses the provider, callback and fresh state without exposing secrets", async () => {
  const { auth } = setup();
  const states = new Set<string>();
  for (const provider of ["google", "github"]) {
    const response = await auth.handler(request(provider));
    assert.equal(response.status, 200);
    const text = await response.text();
    assert.ok(
      !text.includes("test-google-secret") &&
        !text.includes("test-github-secret"),
    );
    const url = new URL(JSON.parse(text).url);
    assert.equal(url.protocol, "https:");
    assert.equal(
      url.hostname,
      provider === "google" ? "accounts.google.com" : "github.com",
    );
    assert.equal(
      url.searchParams.get("redirect_uri"),
      base + "/api/auth/callback/" + provider,
    );
    const state = url.searchParams.get("state");
    assert.ok(state);
    assert.ok(!states.has(state));
    states.add(state);
    assert.ok(response.headers.get("set-cookie"));
    if (provider === "google")
      assert.ok(url.searchParams.get("code_challenge"));
    else assert.ok(url.searchParams.get("scope")?.includes("user:email"));
  }
});
test("OAuth rejects an external post-login callback", async () => {
  const { auth } = setup();
  const response = await auth.handler(
    request("google", "https://untrusted.example/account"),
  );
  assert.ok(response.status >= 400 && response.status < 500);
});
test("OAuth callback without valid state cannot create an account or session", async () => {
  const { auth, data } = setup();
  const response = await auth.handler(
    new Request(base + "/api/auth/callback/google?code=invalid&state=invalid"),
  );
  assert.ok(response.status >= 300 && response.status < 400);
  assert.equal(new URL(response.headers.get("location")!).origin, base);
  assert.equal(data.user.length, 0);
  assert.equal(data.account.length, 0);
  assert.equal(data.session.length, 0);
});

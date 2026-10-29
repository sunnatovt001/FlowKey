import test from "node:test";
import assert from "node:assert/strict";
import { verificationUrl } from "./helpers";
const base = process.env.FLOWZA_TEST_URL;
test(
  "verification, reset single use, password update, and session response redaction",
  { skip: !base },
  async () => {
    const email = `lifecycle-${Date.now()}@example.com`;
    const password = "original-password-for-test-123";
    async function post(path: string, data: unknown, cookie = "") {
      return fetch(`${base}/api/auth/${path}`, {
        method: "POST",
        headers: {
          Origin: base!,
          "Content-Type": "application/json",
          Cookie: cookie,
        },
        body: JSON.stringify(data),
      });
    }
    const created = await post("sign-up/email", {
      email,
      password,
      name: "Lifecycle",
    });
    assert.equal(created.status, 200, await created.clone().text());
    assert.equal(
      (await post("sign-in/email", { email, password })).status,
      403,
    );
    const verified = await fetch(await verificationUrl(email), {
      redirect: "manual",
    });
    assert.ok([302, 303].includes(verified.status));
    const login = await post("sign-in/email", { email, password });
    assert.equal(login.status, 200, await login.clone().text());
    const cookie = login.headers
      .getSetCookie()
      .map((value) => value.split(";")[0])
      .join("; ");
    const loginBody = await login.json();
    assert.equal(loginBody.token, undefined);
    const sessions = await fetch(`${base}/api/settings/sessions`, {
      headers: { Cookie: cookie },
    });
    assert.equal(sessions.status, 200);
    for (const session of await sessions.json()) {
      assert.equal(session.token, undefined);
      assert.equal(session.tokenHash, undefined);
      assert.ok(session.id);
    }
    assert.equal(
      (
        await post("request-password-reset", {
          email,
          redirectTo: `${base}/login`,
        })
      ).status,
      200,
    );
    const callback = await fetch(await verificationUrl(email, "tiklash"), {
      redirect: "manual",
    });
    const token = new URL(callback.headers.get("location")!).searchParams.get(
      "token",
    );
    assert.ok(token);
    const newPassword = "replacement-password-for-test-456";
    assert.equal(
      (await post("reset-password", { token, newPassword })).status,
      200,
    );
    assert.equal(
      (await post("reset-password", { token, newPassword })).status,
      400,
    );
    assert.equal(
      (
        await fetch(`${base}/api/settings/sessions`, {
          headers: { Cookie: cookie },
        })
      ).status,
      401,
    );
    assert.equal(
      (await post("sign-in/email", { email, password })).status,
      401,
    );
    assert.equal(
      (await post("sign-in/email", { email, password: newPassword })).status,
      200,
    );
  },
);

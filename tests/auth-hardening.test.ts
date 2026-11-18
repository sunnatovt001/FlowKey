import test from "node:test";
import assert from "node:assert/strict";
import { db } from "../server/db";
import "./helpers";

const base = process.env.FLOWZA_TEST_URL;
test(
  "auth rejects foreign and malformed requests before account limits; mail limits survive parallel requests",
  { skip: !base },
  async () => {
    const email = `hardening-${Date.now()}@example.test`;
    const post = (path: string, data: unknown, origin = base!) =>
      fetch(`${base}/api/auth/${path}`, {
        method: "POST",
        headers: { Origin: origin, "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
    const bucketsBefore = await db.rateLimit.count();
    for (let i = 0; i < 11; i++) {
      const denied = await post(
        "sign-in/email",
        { email, password: "wrong-password-123" },
        "https://foreign.example",
      );
      assert.equal(denied.status, 403);
      assert.equal(denied.headers.get("cache-control"), "no-store");
      assert.equal(denied.headers.get("retry-after"), null);
    }
    assert.equal(await db.rateLimit.count(), bucketsBefore);
    for (const data of [null, {}, { email: "invalid" }])
      assert.equal((await post("sign-in/email", data)).status, 400);
    // A non-existing account returns the same mail response, without sending mail.
    const requests = await Promise.all(
      Array.from({ length: 6 }, (_, i) =>
        post("request-password-reset", {
          email: i % 2 ? email.toUpperCase() : email,
          redirectTo: `${base}/reset-password`,
        }),
      ),
    );
    assert.equal(requests.filter((r) => r.status === 200).length, 3);
    assert.equal(requests.filter((r) => r.status === 429).length, 3);
    for (const response of requests.filter((r) => r.status === 429)) {
      assert.equal(response.headers.get("retry-after"), "60");
      assert.equal(response.headers.get("cache-control"), "no-store");
    }
    // Mailing allowance is separate from sign-in, while the shared account cap remains.
    const login = await post("sign-in/email", {
      email,
      password: "wrong-password-123",
    });
    assert.equal(login.status, 401, await login.clone().text());
  },
);

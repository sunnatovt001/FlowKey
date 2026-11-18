import test from "node:test";
import assert from "node:assert/strict";
import { db } from "../server/db";
import "./helpers";
const base = process.env.FLOWZA_TEST_URL;
test(
  "welcome tour claims once across concurrent tabs and later sessions",
  { skip: !base },
  async () => {
    const email = `tour-${Date.now()}@example.com`,
      password = "Tour-test-password-123";
    let id = "";
    async function post(
      path: string,
      data: unknown,
      cookie = "",
      origin = base!,
    ) {
      return fetch(`${base}${path}`, {
        method: "POST",
        headers: {
          Origin: origin,
          "Content-Type": "application/json",
          Cookie: cookie,
        },
        body: JSON.stringify(data),
      });
    }
    try {
      assert.equal(
        (
          await post("/api/auth/sign-up/email", {
            email,
            password,
            name: "Tour test",
          })
        ).status,
        200,
      );
      const user = await db.user.findUniqueOrThrow({ where: { email } });
      id = user.id;
      assert.equal(user.tourSeenAt, null);
      await db.user.update({ where: { id }, data: { emailVerified: true } });
      async function login() {
        const response = await post("/api/auth/sign-in/email", {
          email,
          password,
        });
        assert.equal(response.status, 200);
        return response.headers
          .getSetCookie()
          .map((v) => v.split(";")[0])
          .join("; ");
      }
      const cookie = await login();
      const path = "/api/settings/welcome-tour";
      assert.equal((await post(path, { alreadySeen: false })).status, 401);
      assert.equal(
        (
          await post(
            path,
            { alreadySeen: false },
            cookie,
            "https://bad.example",
          )
        ).status,
        403,
      );
      const responses = await Promise.all([
        post(path, { alreadySeen: false }, cookie),
        post(path, { alreadySeen: false }, cookie),
      ]);
      const results = await Promise.all(responses.map((r) => r.json()));
      assert.equal(results.filter((r) => r.show).length, 1);
      assert.ok(
        (await db.user.findUniqueOrThrow({ where: { id } })).tourSeenAt,
      );
      assert.equal(
        (await (await post(path, { alreadySeen: false }, await login())).json())
          .show,
        false,
      );
      await db.user.update({ where: { id }, data: { tourSeenAt: null } });
      assert.equal(
        (await (await post(path, { alreadySeen: true }, cookie)).json()).show,
        true,
      );
      assert.equal(
        (await (await post(path, { alreadySeen: false }, cookie)).json()).show,
        false,
      );
    } finally {
      if (id) await db.user.delete({ where: { id } });
      await db.$disconnect();
    }
  },
);

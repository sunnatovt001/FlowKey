import test from "node:test";
import assert from "node:assert/strict";
import { verificationUrl } from "./helpers";
// Set FLOWZA_TEST_URL against a disposable local instance to run actual HTTP/DB isolation tests.
const base = process.env.FLOWZA_TEST_URL;
test(
  "complete sandbox journey, persistence, idempotency, revocation, and account isolation",
  { skip: !base },
  async () => {
    const suffix = Date.now();
    async function session(email: string) {
      const r = await fetch(`${base}/api/auth/sign-up/email`, {
        method: "POST",
        headers: { Origin: base!, "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          name: "Integration user",
          password: "integration-test-password-123",
        }),
      });
      assert.equal(r.status, 200, await r.clone().text());
      await fetch(await verificationUrl(email), { redirect: "manual" });
      const login = await fetch(`${base}/api/auth/sign-in/email`, {
        method: "POST",
        headers: { Origin: base!, "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password: "integration-test-password-123",
        }),
      });
      assert.equal(login.status, 200, await login.clone().text());
      return login.headers
        .getSetCookie()
        .map((value) => value.split(";")[0])
        .join("; ");
    }
    async function call(
      path: string,
      cookie: string,
      data?: unknown,
      method = "POST",
      headers: Record<string, string> = {},
    ) {
      return fetch(`${base}${path}`, {
        method,
        headers: {
          Origin: base!,
          Cookie: cookie,
          "Content-Type": "application/json",
          ...headers,
        },
        ...(data ? { body: JSON.stringify(data) } : {}),
      });
    }
    const a = await session(`test-a-${suffix}@example.com`),
      b = await session(`test-b-${suffix}@example.com`);
    const onboard = {
      businessName: "Integration business",
      businessType: "Startup",
    };
    const oa = await call("/api/onboarding", a, onboard);
    assert.equal(oa.status, 200);
    assert.equal((await oa.json()).project, null);
    const duplicate = await call("/api/onboarding", a, onboard);
    assert.equal((await duplicate.json()).project, null);
    const projectCreated = await call("/api/projects", a, {
      projectName: "Integration project",
    });
    const first = await projectCreated.json();
    const project = first.id;
    assert.match(first.secret, /^fz_test_[a-f0-9]{64}$/);
    const ob = await call("/api/onboarding", b, onboard);
    assert.equal(ob.status, 200);
    const otherCreated = await call("/api/projects", b, {
      projectName: "Other project",
    });
    const otherProject = (await otherCreated.json()).id;
    const secondProject = await call("/api/projects", a, {
      projectName: "Second project",
    });
    assert.equal(secondProject.status, 200);
    const second = await secondProject.json();
    assert.equal(
      (
        await call(
          `/api/projects/${second.id}`,
          b,
          { projectName: "Stolen" },
          "PATCH",
        )
      ).status,
      404,
    );
    assert.equal(
      (await call(`/api/projects/${second.id}/archive`, a, {})).status,
      200,
    );
    assert.equal(
      (
        await call(`/api/projects/${second.id}/keys`, a, {
          name: "Archived key",
        })
      ).status,
      409,
    );
    assert.equal(
      (await call(`/api/projects/${project}/keys`, b, { name: "Stolen key" }))
        .status,
      404,
    );
    const keyResponse = await call(`/api/projects/${project}/keys`, a, {
      name: "Integration key",
    });
    assert.equal(keyResponse.status, 200);
    const key = await keyResponse.json();
    const otherKey = await (
      await call(`/api/projects/${otherProject}/keys`, b, { name: "Other key" })
    ).json();
    async function pay(secret: string, amount = 12500000) {
      return fetch(`${base}/api/v1/payments`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${secret}`,
          "Idempotency-Key": `integration-${suffix}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount_minor: amount,
          currency: "UZS",
          result: "successful",
        }),
      });
    }
    const created = await pay(key.secret);
    assert.equal(created.status, 201);
    const payment = await created.json();
    assert.equal(payment.livemode, false);
    assert.equal(payment.amount_minor, 12500000);
    const repeats = await Promise.all([pay(key.secret), pay(key.secret)]);
    for (const repeat of repeats) {
      assert.equal(repeat.status, 200);
      assert.equal((await repeat.json()).id, payment.id);
    }
    assert.equal((await pay(key.secret, 100)).status, 409);
    const retrieved = await fetch(`${base}/api/v1/payments/${payment.id}`, {
      headers: { Authorization: `Bearer ${key.secret}` },
    });
    assert.equal(retrieved.status, 200);
    assert.deepEqual(await retrieved.json(), payment);
    assert.equal(
      (
        await fetch(`${base}/api/v1/payments/${payment.id}`, {
          headers: { Authorization: `Bearer ${otherKey.secret}` },
        })
      ).status,
      404,
    );
    const dashboard = await fetch(`${base}/dashboard?project=${project}`, {
      headers: { Cookie: a },
    });
    assert.equal(dashboard.status, 200);
    assert.match(await dashboard.text(), /125[\s\u00a0\u202f,]000/);
    const transactions = await fetch(
      `${base}/transactions?project=${project}&q=${payment.id}`,
      { headers: { Cookie: a } },
    );
    assert.match(await transactions.text(), new RegExp(payment.id));
    const extraIds: Record<string, string> = {};
    for (const result of ["failed", "pending"]) {
      const r = await fetch(`${base}/api/v1/payments`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${key.secret}`,
          "Content-Type": "application/json",
          "Idempotency-Key": `${result}-${suffix}`,
        },
        body: JSON.stringify({ amount_minor: 100, currency: "UZS", result }),
      });
      assert.equal(r.status, 201);
      extraIds[result] = (await r.json()).id;
    }
    const failedPage = await fetch(
      `${base}/transactions?project=${project}&status=failed`,
      { headers: { Cookie: a } },
    );
    const failedHtml = await failedPage.text();
    assert.ok(failedHtml.includes(extraIds.failed));
    assert.ok(!failedHtml.includes(payment.id));
    const futurePage = await fetch(
      `${base}/transactions?project=${project}&from=2099-01-01`,
      { headers: { Cookie: a } },
    );
    const futureHtml = await futurePage.text();
    assert.ok(futureHtml.includes("Mos tranzaksiya topilmadi."));
    assert.ok(!futureHtml.includes(payment.id));
    assert.equal(
      (
        await fetch(`${base}/api/v1/payments`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${key.secret}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            amount_minor: 100,
            currency: "UZS",
            result: "successful",
          }),
        })
      ).status,
      400,
    );
    assert.equal(
      (await fetch(`${base}/api/v1/payments/${payment.id}`)).status,
      401,
    );
    assert.equal(
      (
        await fetch(`${base}/api/v1/payments`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${key.secret}`,
            "Content-Type": "application/json",
            "Idempotency-Key": `invalid-${suffix}`,
          },
          body: JSON.stringify({
            amount_minor: -1,
            currency: "UZS",
            result: "successful",
          }),
        })
      ).status,
      400,
    );
    const denied = await fetch(`${base}/transactions?project=${project}`, {
      headers: { Cookie: b },
    });
    assert.ok([200, 404].includes(denied.status));
    assert.ok(!(await denied.text()).includes(payment.id));
    assert.equal(
      (
        await call(
          `/api/projects/${project}/transactions/${payment.id}`,
          b,
          undefined,
          "GET",
        )
      ).status,
      404,
    );
    assert.equal(
      (
        await call(
          `/api/projects/${project}/keys`,
          a,
          { name: "CSRF" },
          "POST",
          { Origin: "https://evil.example" },
        )
      ).status,
      403,
    );
    assert.equal(
      (
        await call(`/api/projects/${project}/webhooks`, a, {
          url: "https://127.0.0.1/events",
          events: ["payment.successful"],
        })
      ).status,
      400,
    );
    assert.equal(
      (await call(`/api/projects/${project}/keys`, a, { id: key.id }, "DELETE"))
        .status,
      200,
    );
    assert.equal((await pay(key.secret)).status, 401);
    assert.equal(
      (await call(`/api/projects/${project}/archive`, a, {})).status,
      200,
    );
    const archivedHistory = await fetch(
      `${base}/transactions?project=${project}`,
      { headers: { Cookie: a } },
    );
    assert.ok((await archivedHistory.text()).includes(payment.id));
    assert.equal(
      (await fetch(`${base}/settings`, { headers: { Cookie: a } })).status,
      200,
    );
    assert.equal((await call("/api/auth/sign-out", a, {})).status, 200);
    const loggedOut = await fetch(`${base}/dashboard`, {
      headers: { Cookie: a },
      redirect: "manual",
    });
    assert.equal(loggedOut.status, 307);
  },
);


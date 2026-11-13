import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { hashPassword } from "better-auth/crypto";
import { db } from "../server/db";
import "./helpers";
const base = process.env.FLOWZA_TEST_URL;
test(
  "testing center preserves project roles and removes duplicate simulation forms",
  { skip: !base },
  async () => {
    const tag = randomUUID();
    const ids: string[] = [];
    const businessIds: string[] = [];
    const projectIds: string[] = [];
    const cookies: Record<string, string> = {};
    const password = "Testing-center-fixture-123";
    const hash = await hashPassword(password);
    try {
      for (const role of ["owner", "developer", "accountant", "outsider"]) {
        const id = `tc-${role}-${tag}`;
        ids.push(id);
        const email = `tc-${role}-${tag}@example.com`;
        await db.user.create({
          data: {
            id,
            email,
            name: role,
            emailVerified: true,
            accounts: {
              create: {
                id: `${id}-account`,
                accountId: id,
                providerId: "credential",
                password: hash,
              },
            },
          },
        });
        const res = await fetch(base + "/api/auth/sign-in/email", {
          method: "POST",
          headers: { Origin: base!, "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });
        assert.equal(res.status, 200);
        cookies[role] = res.headers
          .getSetCookie()
          .map((v) => v.split(";")[0])
          .join("; ");
      }
      for (const index of [0, 3]) {
        const b = await db.business.create({
          data: {
            ownerId: ids[index],
            name: "Testing center fixture",
            type: "Startup",
          },
        });
        businessIds.push(b.id);
        const p = await db.project.create({
          data: {
            businessId: b.id,
            name: index === 0 ? "Allowed fixture" : "Other fixture",
            memberships: {
              create:
                index === 0
                  ? [
                      { userId: ids[0], role: "owner" },
                      { userId: ids[1], role: "developer" },
                      { userId: ids[2], role: "accountant" },
                    ]
                  : [{ userId: ids[3], role: "owner" }],
            },
          },
        });
        projectIds.push(p.id);
      }
      for (const role of ["owner", "developer", "accountant"]) {
        const response = await fetch(
          `${base}/testing?project=${projectIds[0]}`,
          { headers: { Cookie: cookies[role] } },
        );
        assert.equal(response.status, 200);
        assert.match(response.headers.get("cache-control") || "", /no-store/);
        const html = await response.text();
        assert.ok(
          html.includes("test-tab-finance") === (role !== "developer"),
          role + " financial tools",
        );
        assert.ok(
          html.includes("test-tab-payments") === (role !== "accountant"),
          role + " technical tools",
        );
        assert.ok(
          html.includes("test-tab-subscriptions") === (role !== "accountant"),
          role + " subscription tools",
        );
      }
      const blocked = await fetch(`${base}/testing?project=${projectIds[1]}`, {
        headers: { Cookie: cookies.developer },
      });
      const blockedHtml = await blocked.text();
      assert.ok(
        blocked.status === 404 ||
          blockedHtml.includes("NEXT_HTTP_ERROR_FALLBACK;404"),
      );
      assert.ok(!blockedHtml.includes("test-panel-payments"));
      const old = await fetch(
        `${base}/developers?project=${projectIds[0]}&tab=sandbox`,
        { headers: { Cookie: cookies.owner }, redirect: "manual" },
      );
      if (old.status === 307) {
        assert.ok(old.headers.get("location")?.startsWith("/testing?"));
      } else {
        assert.equal(old.status, 200);
        const html = await old.text();
        assert.match(html, /NEXT_REDIRECT/);
        assert.ok(html.includes("/testing?"));
      }
      for (const route of ["developers", "finance", "subscriptions"]) {
        const response = await fetch(
          `${base}/${route}?project=${projectIds[0]}`,
          { headers: { Cookie: cookies.owner } },
        );
        const html = await response.text();
        assert.equal(response.status, 200);
        assert.ok(
          !html.includes("Sinov to‘lovi yaratish"),
          route + " contains payment simulator",
        );
        if (route === "finance")
          assert.ok(!html.includes('aria-label="Moliyaviy amallar"'));
        if (route === "subscriptions")
          assert.ok(!html.includes("Sinov obunasi yaratish"));
      }
    } finally {
      await db.project.deleteMany({ where: { id: { in: projectIds } } });
      await db.business.deleteMany({ where: { id: { in: businessIds } } });
      await db.user.deleteMany({ where: { id: { in: ids } } });
      await db.$disconnect();
    }
  },
);

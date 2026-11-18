import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { dashboardPeriod, dashboardVolumeLabel } from "../shared/dashboard";
test("dashboard graph axis converts minor units into UZS", () => {
  assert.equal(dashboardVolumeLabel(12500n), "125");
  assert.equal(dashboardVolumeLabel(1n), "0.01");
  assert.equal(dashboardVolumeLabel(875000n).replace(/\s/g, " "), "8,8 ming");
});
import { projectDashboard } from "../server/dashboard";
import { db } from "../server/db";
import "./helpers";
test("dashboard periods align to Tashkent midnight and reject unbounded ranges", () => {
  const period = dashboardPeriod("7", new Date("2026-11-09T20:00:00Z"));
  assert.equal(period.dates.at(-1), "2026-11-10");
  assert.equal(period.dates[0], "2026-11-04");
  assert.equal(period.start.toISOString(), "2026-11-03T19:00:00.000Z");
  assert.equal(period.end.toISOString(), "2026-11-10T19:00:00.000Z");
  assert.equal(dashboardPeriod("30").days, 30);
  assert.equal(dashboardPeriod("90").days, 90);
  assert.equal(dashboardPeriod("999999").days, 7);
  assert.equal(dashboardPeriod(["90"]).days, 7);
});
test(
  "dashboard queries isolate projects, aggregate statuses/days, and expose only connection metadata",
  { skip: process.env.FLOWKEY_SUPPORT_DB_TEST !== "1" },
  async () => {
    const url = new URL(process.env.DATABASE_URL || "http://invalid");
    assert.ok(
      ["localhost", "127.0.0.1"].includes(url.hostname) &&
        url.pathname.endsWith("_test"),
    );
    const uid = `dashboard-${randomUUID()}`,
      other = `dashboard-other-${randomUUID()}`;
    let pid = "",
      otherPid = "";
    try {
      for (const id of [uid, other]) {
        const user = await db.user.create({
          data: {
            id,
            email: `${id}@example.com`,
            name: id,
            emailVerified: true,
            businesses: {
              create: {
                name: id,
                type: "Startup",
                projects: {
                  create: {
                    name: "Dashboard test",
                    memberships: { create: { userId: id, role: "owner" } },
                  },
                },
              },
            },
          },
          include: { businesses: { include: { projects: true } } },
        });
        if (id === uid) pid = user.businesses[0].projects[0].id;
        else otherPid = user.businesses[0].projects[0].id;
      }
      const now = new Date(),
        period = dashboardPeriod("7", now);
      const at = new Date(period.start.getTime() + 3600000);
      const rows = await Promise.all([
        ...[
          ["successful", 125000n],
          ["failed", 50000n],
          ["pending", 25000n],
        ].map(([status, amount]) =>
          db.transaction.create({
            data: {
              projectId: pid,
              status: String(status),
              amountMinor: BigInt(amount),
              idempotencyKey: randomUUID(),
              requestHash: randomUUID(),
              createdAt: at,
            },
          }),
        ),
        db.transaction.create({
          data: {
            projectId: pid,
            status: "successful",
            amountMinor: 90000n,
            idempotencyKey: randomUUID(),
            requestHash: randomUUID(),
            createdAt: new Date(now.getTime() - 45 * 86400000),
          },
        }),
        db.transaction.create({
          data: {
            projectId: otherPid,
            status: "successful",
            amountMinor: 999999n,
            idempotencyKey: randomUUID(),
            requestHash: randomUUID(),
            createdAt: at,
          },
        }),
      ]);
      await db.apiKey.create({
        data: {
          projectId: pid,
          name: "Active",
          prefix: "test",
          secretHash: randomUUID(),
          lastUsedAt: now,
        },
      });
      await db.apiKey.create({
        data: {
          projectId: pid,
          name: "Revoked",
          prefix: "test",
          secretHash: randomUUID(),
          revokedAt: now,
        },
      });
      const endpoint = await db.webhookEndpoint.create({
        data: {
          projectId: pid,
          url: "https://example.com/hook",
          events: ["payment.successful"],
          secretEncrypted: "test-only",
        },
      });
      await db.webhookDelivery.create({
        data: {
          endpointId: endpoint.id,
          transactionId: rows[0].id,
          event: "payment.successful",
          status: "failed",
        },
      });
      const data = await projectDashboard(pid, uid, "7");
      assert.equal(data.volume, 125000n);
      assert.equal(data.successful, 1);
      assert.equal(data.failed, 1);
      assert.equal(data.pending, 1);
      assert.equal(data.total, 3);
      assert.equal(data.keyCount, 1);
      assert.equal(data.webhook.text, "Xato bor");
      assert.equal(data.days[0].volume, 125000n);
      assert.equal(data.days[0].count, 3n);
      assert.equal(
        data.days.reduce((s, d) => s + d.volume, 0n),
        data.volume,
      );
      assert.equal(data.recent.length, 3);
      assert.equal(data.lastUsedAt?.getTime(), now.getTime());
      const older = await projectDashboard(pid, uid, "90");
      assert.equal(older.volume, 215000n);
      assert.equal(older.total, 4);
      await assert.rejects(projectDashboard(otherPid, uid, "7"));
      await db.webhookDelivery.deleteMany({
        where: { endpointId: endpoint.id },
      });
      const configured = await projectDashboard(pid, uid, "7");
      assert.equal(configured.webhook.text, "Tekshirilmagan");
    } finally {
      for (const projectId of [pid, otherPid].filter(Boolean)) {
        await db.webhookDelivery.deleteMany({
          where: { endpoint: { projectId } },
        });
        await db.transaction.deleteMany({ where: { projectId } });
      }
      await db.user.deleteMany({ where: { id: { in: [uid, other] } } });
      await db.$disconnect();
    }
  },
);

import test from "node:test";
import assert from "node:assert/strict";
import { isPlatformAdmin } from "../server/admin-access";
import { db } from "../server/db";
import { packText, packSnapshot } from "../server/telegram/storage";
import "./helpers";

test("platform admin allowlist fails closed and matches stable IDs exactly", () => {
  assert.equal(isPlatformAdmin("owner", ""), false);
  assert.equal(isPlatformAdmin("owner", "other-owner"), false);
  assert.equal(isPlatformAdmin("owner", "other, owner"), true);
  assert.equal(isPlatformAdmin("", " , "), false);
});
const base = process.env.FLOWZA_TEST_URL;
test(
  "admin HTTP access, conflict handling and audited workflow preserve delivery",
  { skip: !base },
  async () => {
    const suffix = Date.now();
    const password = "Admin-test-password-123";
    const users: string[] = [];
    let ticketId = "";
    const post = (path: string, data: unknown, cookie = "", origin = base!) =>
      fetch(`${base}${path}`, {
        method: "POST",
        headers: {
          Origin: origin,
          "Content-Type": "application/json",
          Cookie: cookie,
        },
        body: JSON.stringify(data),
      });
    try {
      const cookies: string[] = [];
      for (const role of ["owner", "regular"]) {
        const email =
          role === "owner"
            ? "admin-test@example.com"
            : `admin-${role}-${suffix}@example.com`;
        const signup = await post("/api/auth/sign-up/email", {
          email,
          password,
          name: role,
        });
        assert.equal(signup.status, 200, await signup.clone().text());
        const row = await db.user.findUniqueOrThrow({ where: { email } });
        users.push(row.id);
        // Test server allowlists this fixed synthetic ID only.
        if (role === "owner") {
          await db.user.update({
            where: { id: row.id },
            data: { id: "admin-panel-test-owner", emailVerified: true },
          });
          users[0] = "admin-panel-test-owner";
          await db.account.updateMany({
            where: { userId: users[0], providerId: "credential" },
            data: { accountId: users[0] },
          });
        } else
          await db.user.update({
            where: { id: row.id },
            data: { emailVerified: true },
          });
        const login = await post("/api/auth/sign-in/email", {
          email,
          password,
        });
        assert.equal(login.status, 200, await login.clone().text());
        cookies.push(
          login.headers
            .getSetCookie()
            .map((x) => x.split(";")[0])
            .join("; "),
        );
      }
      assert.equal((await fetch(`${base}/api/admin/overview`)).status, 401);
      assert.equal(
        (
          await fetch(`${base}/api/admin/overview`, {
            headers: { Cookie: cookies[0] },
          })
        ).status,
        401,
      );
      assert.equal(
        (
          await post(
            "/api/admin-session",
            { email: "admin-test@example.com", password: "wrong" },
            cookies[0],
          )
        ).status,
        401,
      );
      assert.equal(
        (
          await post(
            "/api/admin-session",
            {
              email: "admin-test@example.com",
              password: "Admin-stepup-test-123",
            },
            cookies[0],
            "https://invalid.example",
          )
        ).status,
        403,
      );
      const unlocked = await post(
        "/api/admin-session",
        { email: "admin-test@example.com", password: "Admin-stepup-test-123" },
        cookies[0],
      );
      assert.equal(unlocked.status, 200, await unlocked.clone().text());
      cookies[0] +=
        "; " +
        unlocked.headers
          .getSetCookie()
          .map((x) => x.split(";")[0])
          .join("; ");
      assert.match(unlocked.headers.getSetCookie().join(";"), /HttpOnly/i);
      assert.match(
        unlocked.headers.getSetCookie().join(";"),
        /SameSite=Strict/i,
      );
      assert.equal(
        (
          await fetch(`${base}/api/admin/users`, {
            headers: { Cookie: cookies[1], "X-Admin": "true" },
          })
        ).status,
        403,
      );
      // Every admin read surface rejects an ordinary account, even with a copied admin grant.
      for (const resource of [
        "overview",
        "users",
        "projects",
        "tickets",
        "audit",
      ]) {
        const denied = await fetch(`${base}/api/admin/${resource}`, {
          headers: {
            Cookie:
              cookies[1] +
              "; " +
              cookies[0]
                .split("; ")
                .filter((x) => x.startsWith("flowkey_admin="))
                .join("; "),
          },
        });
        assert.equal(denied.status, 403, resource);
      }
      for (const method of ["POST", "DELETE"]) {
        const denied = await fetch(`${base}/api/admin/telegram`, {
          method,
          headers: { Cookie: cookies[1], Origin: base! },
        });
        assert.equal(denied.status, 403, `Telegram ${method}`);
      }
      const overview = await fetch(`${base}/api/admin/overview`, {
        headers: { Cookie: cookies[0] },
      });
      assert.equal(overview.status, 200);
      const listing = await fetch(
        `${base}/api/admin/users?q=admin-test@example.com`,
        { headers: { Cookie: cookies[0] } },
      );
      assert.equal(listing.status, 200);
      const data = await listing.json();
      assert.equal(data.rows.length, 1);
      assert.equal(data.rows[0].accounts, undefined);
      const ticket = await db.supportTicket.create({
        data: {
          userId: users[1],
          requestKey: `admin-${suffix}`,
          summary: packText("Test support request"),
          diagnostics: packSnapshot({ findings: ["Test finding"] }),
          status: "sent",
        },
      });
      ticketId = ticket.id;
      const replyUrl = `/api/admin/tickets/${ticket.id}/replies`;
      const requestKey = crypto.randomUUID();
      const replyInput = {
        content: "Muammo tekshirildi. Qayta kirib ko‘ring.",
        requestKey,
      };
      assert.equal((await post(replyUrl, replyInput, cookies[1])).status, 403);
      assert.equal(
        (
          await post(
            replyUrl,
            replyInput,
            cookies[0],
            "https://invalid.example",
          )
        ).status,
        403,
      );
      assert.equal(
        (await post(replyUrl, { content: "", requestKey }, cookies[0])).status,
        400,
      );
      const parallel = await Promise.all([
        post(replyUrl, replyInput, cookies[0]),
        post(replyUrl, replyInput, cookies[0]),
      ]);
      assert.deepEqual(
        parallel.map((r) => r.status),
        [200, 200],
      );
      const replies = await Promise.all(parallel.map((r) => r.json()));
      assert.equal(replies[0].id, replies[1].id);
      assert.equal(
        await db.supportReply.count({ where: { ticketId: ticket.id } }),
        1,
      );
      assert.equal(
        (
          await post(
            replyUrl,
            { ...replyInput, content: "Different response" },
            cookies[0],
          )
        ).status,
        409,
      );
      const history = await fetch(`${base}/api/support/tickets`, {
        headers: { Cookie: cookies[1] },
      });
      const visible = (await history.json()).find(
        (t: { id: string }) => t.id === ticket.id,
      );
      assert.equal(visible.replies[0].content, replyInput.content);
      assert.equal(visible.replies[0].actorId, undefined);
      assert.equal(visible.replies[0].requestKey, undefined);
      const patch = (status: string, expectedStatus: string, origin = base!) =>
        fetch(`${base}/api/admin/tickets/${ticket.id}`, {
          method: "PATCH",
          headers: {
            Cookie: cookies[0],
            Origin: origin,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status, expectedStatus }),
        });
      assert.equal(
        (await patch("resolved", "open", "https://invalid.example")).status,
        403,
      );
      assert.equal((await patch("invalid", "open")).status, 400);
      const forbiddenWrite = await fetch(
        `${base}/api/admin/tickets/${ticket.id}`,
        {
          method: "PATCH",
          headers: {
            Cookie: cookies[1],
            Origin: base!,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status: "resolved", expectedStatus: "open" }),
        },
      );
      assert.equal(forbiddenWrite.status, 403);
      assert.equal((await fetch(`${base}/api/support/tickets`)).status, 401);
      assert.equal((await patch("in_progress", "open")).status, 200);
      assert.equal((await patch("resolved", "open")).status, 409);
      assert.equal((await patch("resolved", "in_progress")).status, 200);
      const updated = await db.supportTicket.findUniqueOrThrow({
        where: { id: ticket.id },
      });
      assert.equal(updated.status, "sent");
      assert.equal(updated.resolutionStatus, "resolved");
      assert.ok(updated.resolvedAt);
      assert.equal(updated.resolvedBy, users[0]);
      const ownHistory = await fetch(`${base}/api/support/tickets`, {
        headers: { Cookie: cookies[1] },
      });
      const ownTickets = await ownHistory.json();
      assert.equal(
        ownTickets.find((t: { id: string }) => t.id === ticket.id)
          .resolutionStatus,
        "resolved",
      );
      const otherHistory = await fetch(`${base}/api/support/tickets`, {
        headers: { Cookie: cookies[0] },
      });
      assert.ok(
        !(await otherHistory.json()).some(
          (t: { id: string }) => t.id === ticket.id,
        ),
      );
      // A retry of the same state must not create another audit record.
      assert.equal((await patch("resolved", "resolved")).status, 200);
      assert.equal(
        await db.adminAudit.count({ where: { targetId: ticket.id } }),
        3,
      );
      // Replaying both cookies must not resurrect a revoked auth session.
      assert.equal(
        (await post("/api/auth/sign-out", {}, cookies[0])).status,
        200,
      );
      assert.equal(
        (
          await fetch(`${base}/api/admin/overview`, {
            headers: { Cookie: cookies[0] },
          })
        ).status,
        401,
      );
    } finally {
      if (ticketId)
        await db.adminAudit.deleteMany({ where: { targetId: ticketId } });
      await db.user.deleteMany({ where: { id: { in: users } } });
      await db.$disconnect();
    }
  },
);

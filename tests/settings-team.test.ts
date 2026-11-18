import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { hashPassword } from "better-auth/crypto";
import { db } from "../server/db";
import "./helpers";
const base = process.env.FLOWZA_TEST_URL;
const password = "Settings-fixture-password-123";
const png = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aWQAAAABJRU5ErkJggg==",
  "base64",
);
test(
  "team invitations, roles, profile/avatar isolation and password session revocation",
  { skip: !base },
  async () => {
    const users: Record<string, { id: string; email: string; cookie: string }> =
      {};
    const post = (
      path: string,
      data: unknown,
      cookie: string,
      method = "POST",
    ) =>
      fetch(base + path, {
        method,
        headers: {
          Origin: base!,
          Cookie: cookie,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
    const get = (path: string, cookie: string) =>
      fetch(base + path, { headers: { Cookie: cookie }, redirect: "manual" });
    const login = async (email: string, pass = password) => {
      const r = await post(
        "/api/auth/sign-in/email",
        { email, password: pass },
        "",
      );
      assert.equal(r.status, 200, await r.clone().text());
      return r.headers
        .getSetCookie()
        .map((s) => s.split(";")[0])
        .join("; ");
    };
    try {
      const credential = await hashPassword(password);
      for (const role of ["owner", "developer", "accountant", "outsider"]) {
        const id = `settings-${role}-${randomUUID()}`,
          email = `${id}@example.test`;
        await db.user.create({
          data: {
            id,
            email,
            name: role,
            emailVerified: true,
            accounts: {
              create: {
                id: randomUUID(),
                accountId: id,
                providerId: "credential",
                password: credential,
              },
            },
          },
        });
        users[role] = { id, email, cookie: await login(email) };
      }
      const owner = users.owner;
      const business = await db.business.create({
        data: { ownerId: owner.id, name: "Settings test", type: "Startup" },
      });
      const project = await db.project.create({
        data: {
          businessId: business.id,
          name: "Team test",
          memberships: { create: { userId: owner.id, role: "owner" } },
        },
      });
      const team = `/api/projects/${project.id}/team`;
      assert.equal(
        (
          await post(
            team,
            {
              action: "invite",
              email: users.developer.email,
              role: "developer",
            },
            users.outsider.cookie,
          )
        ).status,
        404,
      );
      for (const role of ["developer", "accountant"]) {
        assert.equal(
          (
            await post(
              team,
              { action: "invite", email: users[role].email, role },
              owner.cookie,
            )
          ).status,
          200,
        );
        const invite = await db.projectInvite.findUniqueOrThrow({
          where: {
            projectId_email: {
              projectId: project.id,
              email: users[role].email,
            },
          },
        });
        assert.equal(
          (
            await post(
              "/api/invitations",
              { id: invite.id, accept: true },
              users.outsider.cookie,
            )
          ).status,
          409,
        );
        const replies = await Promise.all([
          post(
            "/api/invitations",
            { id: invite.id, accept: true },
            users[role].cookie,
          ),
          post(
            "/api/invitations",
            { id: invite.id, accept: true },
            users[role].cookie,
          ),
        ]);
        assert.deepEqual(replies.map((r) => r.status).sort(), [200, 409]);
      }
      assert.equal(
        (
          await get(
            `/api/projects/${project.id}/api-keys`,
            users.developer.cookie,
          )
        ).status,
        200,
      );
      assert.equal(
        (
          await get(
            `/api/projects/${project.id}/operations`,
            users.developer.cookie,
          )
        ).status,
        403,
      );
      assert.equal(
        (
          await get(
            `/api/projects/${project.id}/api-keys`,
            users.accountant.cookie,
          )
        ).status,
        404,
      );
      assert.equal(
        (
          await get(
            `/api/projects/${project.id}/operations`,
            users.accountant.cookie,
          )
        ).status,
        200,
      );
      assert.equal(
        (
          await post(
            team,
            { action: "remove", userId: users.accountant.id },
            users.developer.cookie,
          )
        ).status,
        403,
      );
      // Invited members need personal settings without having to create a business.
      assert.equal(
        (await get(`/settings?project=${project.id}`, users.developer.cookie))
          .status,
        200,
      );
      assert.equal(
        (
          await post(
            team,
            {
              action: "invite",
              email: users.developer.email,
              role: "accountant",
            },
            owner.cookie,
          )
        ).status,
        409,
      );
      assert.equal(
        (
          await post(
            team,
            { action: "remove", userId: users.developer.id },
            owner.cookie,
          )
        ).status,
        200,
      );
      assert.equal(
        (
          await get(
            `/api/projects/${project.id}/api-keys`,
            users.developer.cookie,
          )
        ).status,
        404,
      );
      assert.equal(
        (
          await post(
            team,
            {
              action: "invite",
              email: users.outsider.email,
              role: "developer",
            },
            owner.cookie,
          )
        ).status,
        200,
      );
      const pending = await db.projectInvite.findUniqueOrThrow({
        where: {
          projectId_email: {
            projectId: project.id,
            email: users.outsider.email,
          },
        },
      });
      assert.equal(
        (await post(team, { action: "revoke", id: pending.id }, owner.cookie))
          .status,
        200,
      );
      assert.equal(
        (
          await post(
            "/api/invitations",
            { id: pending.id, accept: true },
            users.outsider.cookie,
          )
        ).status,
        409,
      );
      assert.equal(
        (
          await post(
            team,
            {
              action: "invite",
              email: users.outsider.email,
              role: "developer",
            },
            owner.cookie,
          )
        ).status,
        200,
      );
      await db.projectInvite.update({
        where: { id: pending.id },
        data: { expiresAt: new Date(0) },
      });
      assert.equal(
        (
          await post(
            "/api/invitations",
            { id: pending.id, accept: true },
            users.outsider.cookie,
          )
        ).status,
        409,
      );
      assert.equal(
        (
          await post(
            team,
            {
              action: "invite",
              email: users.outsider.email,
              role: "accountant",
            },
            owner.cookie,
          )
        ).status,
        200,
      );
      assert.equal(
        (
          await post(
            "/api/invitations",
            { id: pending.id, accept: false },
            users.outsider.cookie,
          )
        ).status,
        200,
      );
      assert.equal(
        await db.membership.count({
          where: { projectId: project.id, userId: users.outsider.id },
        }),
        0,
      );
      assert.equal(
        (
          await post(
            "/api/settings/profile",
            { name: "Updated owner" },
            owner.cookie,
            "PATCH",
          )
        ).status,
        200,
      );
      assert.equal(
        (await (await get("/api/settings/profile", owner.cookie)).json()).name,
        "Updated owner",
      );
      const uploaded = await fetch(base + "/api/profile/avatar", {
        method: "POST",
        headers: {
          Origin: base!,
          Cookie: owner.cookie,
          "Content-Type": "image/png",
        },
        body: png,
      });
      assert.equal(uploaded.status, 200);
      assert.equal(
        (await get("/api/profile/avatar/image", users.outsider.cookie)).status,
        404,
      );
      const image = await get("/api/profile/avatar/image", owner.cookie);
      assert.equal(image.status, 200);
      assert.match(image.headers.get("cache-control") || "", /no-store/);
      assert.equal(
        (
          await fetch(base + "/api/profile/avatar", {
            method: "DELETE",
            headers: { Origin: base!, Cookie: owner.cookie },
          })
        ).status,
        200,
      );
      const otherSession = await login(owner.email);
      const list = await (
        await get("/api/settings/sessions", owner.cookie)
      ).json();
      assert.equal(list.length, 2);
      assert.equal(
        list.filter((s: { current: boolean }) => s.current).length,
        1,
      );
      assert.ok(list.every((s: { token?: string }) => !s.token));
      const otherList = await (
        await get("/api/settings/sessions", users.outsider.cookie)
      ).json();
      await post(
        "/api/settings/sessions",
        { id: otherList[0].id },
        owner.cookie,
      );
      assert.equal(
        (await get("/api/settings/profile", users.outsider.cookie)).status,
        200,
      );
      const rejected = await post(
        "/api/auth/change-password",
        {
          currentPassword: "wrong-password",
          newPassword: "Changed-settings-password-456",
          revokeOtherSessions: true,
        },
        owner.cookie,
      );
      assert.equal(rejected.status, 400);
      assert.equal(
        (await get("/api/settings/profile", otherSession)).status,
        200,
      );
      const changed = await post(
        "/api/auth/change-password",
        {
          currentPassword: password,
          newPassword: "Changed-settings-password-456",
          revokeOtherSessions: true,
        },
        owner.cookie,
      );
      assert.equal(changed.status, 200, await changed.clone().text());
      assert.equal(
        (await get("/api/settings/profile", otherSession)).status,
        401,
      );
      assert.equal(
        (await get("/api/settings/profile", owner.cookie)).status,
        401,
      );
      const rotated = changed.headers
        .getSetCookie()
        .map((s) => s.split(";")[0])
        .join("; ");
      assert.ok(rotated);
      assert.equal((await get("/api/settings/profile", rotated)).status, 200);
    } finally {
      await db.$disconnect();
    }
  },
);

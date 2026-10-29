import { db } from "@/server/db";
import { requireUser, requireProject } from "@/server/auth";
import { body, handle, limit, sameOrigin } from "@/server/http";
import { ApiError, encrypt, hash, secret } from "@/server/security";
import { keyName, webhook, resourceId } from "@/server/validators";
import { createPayment } from "@/server/payments";
import { deliver, resolveEndpoint } from "@/server/webhooks";
type Context = { params: Promise<{ projectId: string; resource: string }> };
export async function POST(req: Request, { params }: Context) {
  return handle(async () => {
    sameOrigin(req);
    const user = await requireUser();
    const { projectId, resource: requested } = await params;
    const resource =
      (
        {
          "api-keys": "keys",
          "webhook-endpoints": "webhooks",
          "webhook-deliveries": "deliveries",
        } as Record<string, string>
      )[requested] || requested;
    await requireProject(projectId, user.id);
    await limit(`write:${user.id}`, 60);
    const data = await body(req);
    if (resource === "keys") {
      const { name } = keyName.parse(data);
      const fullSecret = secret("fz_test_");
      const key = await db.$transaction(async (tx) => {
        const key = await tx.apiKey.create({
          data: {
            projectId,
            name,
            prefix: fullSecret.slice(0, 16),
            secretHash: hash(fullSecret),
          },
        });
        await tx.auditLog.create({
          data: {
            projectId,
            actorId: user.id,
            action: "key.created",
            resourceId: key.id,
          },
        });
        return key;
      });
      return { id: key.id, secret: fullSecret };
    }
    if (resource === "payments") {
      const result = await createPayment(
        projectId,
        data,
        req.headers.get("idempotency-key"),
      );
      const { replayed, ...payment } = result;
      void replayed;
      return payment;
    }
    if (resource === "webhooks") {
      const input = webhook.parse(data);
      await resolveEndpoint(input.url);
      const signingSecret = secret("whsec_");
      const endpoint = await db.webhookEndpoint.create({
        data: {
          projectId,
          url: input.url,
          events: input.events,
          secretEncrypted: encrypt(signingSecret),
        },
      });
      return { id: endpoint.id, secret: signingSecret };
    }
    if (resource === "deliveries") {
      await limit(`retry:${projectId}`, 5);
      return deliver(resourceId.parse(data).id, projectId);
    }
    throw new ApiError(404, "Endpoint topilmadi.");
  });
}
export async function GET(req: Request, { params }: Context) {
  return handle(async () => {
    const user = await requireUser();
    const { projectId, resource } = await params;
    await requireProject(projectId, user.id, false);
    if (resource === "api-keys")
      return db.apiKey.findMany({
        where: { projectId },
        select: {
          id: true,
          name: true,
          prefix: true,
          createdAt: true,
          revokedAt: true,
          lastUsedAt: true,
        },
      });
    if (resource === "webhook-endpoints")
      return db.webhookEndpoint.findMany({
        where: { projectId },
        select: {
          id: true,
          url: true,
          events: true,
          disabledAt: true,
          createdAt: true,
        },
      });
    if (resource === "webhook-deliveries")
      return db.webhookDelivery.findMany({
        where: { endpoint: { projectId } },
        select: {
          id: true,
          event: true,
          status: true,
          attempts: true,
          responseCode: true,
          error: true,
          nextAttemptAt: true,
        },
        take: 100,
        orderBy: { createdAt: "desc" },
      });
    if (resource === "overview") {
      const groups = await db.transaction.groupBy({
        by: ["status"],
        where: { projectId },
        _count: true,
        _sum: { amountMinor: true },
      });
      return {
        project_id: projectId,
        livemode: false,
        groups: groups.map((group) => ({
          status: group.status,
          count: group._count,
          volume_minor: String(group._sum.amountMinor || 0),
        })),
      };
    }
    if (resource === "transactions") {
      const query = new URL(req.url).searchParams;
      const page = Math.max(1, Math.floor(Number(query.get("page"))) || 1);
      const pageSize = Math.min(
        100,
        Math.max(1, Math.floor(Number(query.get("pageSize"))) || 20),
      );
      const status = query.get("status");
      if (status && !["successful", "failed", "pending"].includes(status))
        throw new ApiError(400, "Holat noto‘g‘ri.");
      const date = (value: string | null, end: boolean) => {
        if (!value) return undefined;
        if (!/^\d{4}-\d{2}-\d{2}$/.test(value))
          throw new ApiError(400, "Sana noto‘g‘ri.");
        const parsed = new Date(
          `${value}T${end ? "23:59:59.999" : "00:00:00"}+05:00`,
        );
        if (isNaN(parsed.getTime())) throw new ApiError(400, "Sana noto‘g‘ri.");
        return parsed;
      };
      const from = date(query.get("from"), false),
        to = date(query.get("to"), true);
      const where = {
        projectId,
        ...(status ? { status } : {}),
        ...(query.get("q")
          ? { id: { contains: query.get("q")!.slice(0, 100) } }
          : {}),
        ...(from || to ? { createdAt: { gte: from, lte: to } } : {}),
      };
      const [count, rows] = await Promise.all([
        db.transaction.count({ where }),
        db.transaction.findMany({
          where,
          orderBy: [{ createdAt: "desc" }, { id: "desc" }],
          skip: (page - 1) * pageSize,
          take: pageSize,
        }),
      ]);
      return {
        count,
        page,
        pageSize,
        data: rows.map((row) => ({
          ...row,
          amountMinor: String(row.amountMinor),
        })),
      };
    }
    throw new ApiError(404, "Endpoint topilmadi.");
  });
}
export async function DELETE(req: Request, { params }: Context) {
  return handle(async () => {
    sameOrigin(req);
    const user = await requireUser();
    const { projectId, resource } = await params;
    await requireProject(projectId, user.id);
    await limit(`write:${user.id}`, 60);
    const data = resourceId.parse(await body(req));
    let count = 0;
    if (resource === "keys") {
      count = (
        await db.apiKey.updateMany({
          where: { id: data.id, projectId, revokedAt: null },
          data: { revokedAt: new Date() },
        })
      ).count;
    } else if (resource === "webhooks") {
      count = (
        await db.webhookEndpoint.updateMany({
          where: { id: data.id, projectId, disabledAt: null },
          data: { disabledAt: new Date() },
        })
      ).count;
    } else throw new ApiError(404, "Endpoint topilmadi.");
    if (!count) throw new ApiError(404, "Faol yozuv topilmadi.");
    await db.auditLog.create({
      data: { projectId, action: `${resource}.revoked`, resourceId: data.id },
    });
    return { ok: true };
  });
}

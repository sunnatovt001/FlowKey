import { z } from "zod";
import { db } from "@/server/db";
import { requireUser, requireProject } from "@/server/auth";
import { body, handle, sameOrigin, limit } from "@/server/http";
import { ApiError, encrypt, secret } from "@/server/security";
import { webhook } from "@/server/validators";
import { resolveEndpoint, deliver } from "@/server/webhooks";
import { createPayment, serializePayment } from "@/server/payments";
type Context = {
  params: Promise<{ projectId: string; resource: string; action: string[] }>;
};
export async function GET(_req: Request, { params }: Context) {
  return handle(async () => {
    const user = await requireUser();
    const { projectId, resource, action } = await params;
    await requireProject(
      projectId,
      user.id,
      false,
      resource === "transactions" ? "read" : "technical",
    );
    if (action.length !== 1) throw new ApiError(404, "Topilmadi.");
    if (resource === "transactions") {
      const payment = await db.transaction.findFirst({
        where: { id: action[0], projectId },
      });
      if (!payment) throw new ApiError(404, "To‘lov topilmadi.");
      return serializePayment(payment);
    }
    if (resource === "webhook-deliveries") {
      const delivery = await db.webhookDelivery.findFirst({
        where: { id: action[0], endpoint: { projectId } },
        select: {
          id: true,
          event: true,
          status: true,
          attempts: true,
          payload: true,
          history: { orderBy: { attemptNumber: "asc" } },
        },
      });
      if (!delivery) throw new ApiError(404, "Yetkazish yozuvi topilmadi.");
      return delivery;
    }
    throw new ApiError(404, "Topilmadi.");
  });
}
export async function POST(req: Request, { params }: Context) {
  return handle(async () => {
    sameOrigin(req);
    const user = await requireUser();
    const { projectId, resource, action } = await params;
    await requireProject(projectId, user.id, true, "technical");
    await limit(`write:${user.id}`);
    if (resource === "sandbox" && action.join("/") === "payments") {
      const { replayed, ...payment } = await createPayment(
        projectId,
        await body(req),
        req.headers.get("idempotency-key"),
      );
      void replayed;
      return payment;
    }
    if (action.length !== 2) throw new ApiError(404, "Topilmadi.");
    const [id, operation] = action;
    if (resource === "api-keys" && operation === "revoke") {
      const result = await db.apiKey.updateMany({
        where: { id, projectId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
      if (!result.count) throw new ApiError(404, "Kalit topilmadi.");
      await db.auditLog.create({
        data: {
          actorId: user.id,
          projectId,
          action: "key.revoked",
          resourceId: id,
        },
      });
      return { ok: true };
    }
    if (resource === "webhook-deliveries" && operation === "retry") {
      await limit(`retry:${projectId}`, 5);
      return deliver(id, projectId);
    }
    if (resource === "webhook-endpoints" && operation === "rotate-secret") {
      const value = secret("whsec_");
      const result = await db.webhookEndpoint.updateMany({
        where: { id, projectId, disabledAt: null },
        data: { secretEncrypted: encrypt(value) },
      });
      if (!result.count) throw new ApiError(404, "Endpoint topilmadi.");
      await db.auditLog.create({
        data: {
          actorId: user.id,
          projectId,
          action: "webhook.secret_rotated",
          resourceId: id,
        },
      });
      return { secret: value };
    }
    throw new ApiError(404, "Topilmadi.");
  });
}
export async function PATCH(req: Request, { params }: Context) {
  return handle(async () => {
    sameOrigin(req);
    const user = await requireUser();
    const { projectId, resource, action } = await params;
    await requireProject(projectId, user.id, true, "technical");
    await limit(`write:${user.id}`);
    if (resource !== "webhook-endpoints" || action.length !== 1)
      throw new ApiError(404, "Topilmadi.");
    const input = webhook
      .extend({ enabled: z.boolean() })
      .parse(await body(req));
    await resolveEndpoint(input.url);
    const result = await db.webhookEndpoint.updateMany({
      where: { id: action[0], projectId },
      data: {
        url: input.url,
        events: input.events,
        disabledAt: input.enabled ? null : new Date(),
      },
    });
    if (!result.count) throw new ApiError(404, "Endpoint topilmadi.");
    return { ok: true };
  });
}

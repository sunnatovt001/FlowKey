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
    const { projectId, resource } = await params;
    await requireProject(projectId, user.id);
    await limit(`write:${user.id}`, 60);
    const data = await body(req);
    if (resource === "keys") {
      const { name } = keyName.parse(data);
      const fullSecret = secret("fz_test_");
      const key = await db.apiKey.create({
        data: {
          projectId,
          name,
          prefix: fullSecret.slice(0, 16),
          secretHash: hash(fullSecret),
        },
      });
      await db.auditLog.create({
        data: { projectId, action: "key.created", resourceId: key.id },
      });
      return { id: key.id, secret: fullSecret };
    }
    if (resource === "payments")
      return createPayment(projectId, data, req.headers.get("idempotency-key"));
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
      return deliver(resourceId.parse(data).id, projectId);
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

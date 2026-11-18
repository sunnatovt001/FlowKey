import { randomUUID } from "node:crypto";
import { db } from "@/server/db";
import { handle, limit, sameOrigin } from "@/server/http";
import { newSession } from "@/server/checkout";
import { ApiError, hash } from "@/server/security";
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  return handle(async () => {
    sameOrigin(req);
    const { id } = await params;
    await limit(`link-start:${id}`, 30);
    const link = await db.paymentLink.findUnique({ where: { id } });
    if (!link || link.disabledAt)
      throw new ApiError(404, "To‘lov havolasi mavjud emas.");
    // The browser retains this key when the response is lost. Scope it to
    // this link so the same browser key cannot collide across products.
    const key = req.headers.get("idempotency-key");
    if (key && !/^[\w-]{8,128}$/.test(key))
      throw new ApiError(400, "Idempotency-Key noto‘g‘ri.");
    return newSession(
      link.projectId,
      {
        title: link.title,
        amount_minor: Number(link.amountMinor),
        currency: link.currency,
      },
      key ? `link_${hash(`${id}:${key}`)}` : randomUUID(),
      id,
    );
  });
}

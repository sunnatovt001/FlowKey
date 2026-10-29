import { randomUUID } from "node:crypto";
import { db } from "@/server/db";
import { handle, limit, sameOrigin } from "@/server/http";
import { newSession } from "@/server/checkout";
import { ApiError } from "@/server/security";
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    sameOrigin(req);
    const { id } = await params;
    await limit(`link-start:${id}`, 30);
    const link = await db.paymentLink.findUnique({ where: { id } });
    if (!link || link.disabledAt) throw new ApiError(404, "To‘lov havolasi mavjud emas.");
    return newSession(link.projectId, { title: link.title, amount_minor: Number(link.amountMinor), currency: link.currency }, randomUUID(), id);
  });
}

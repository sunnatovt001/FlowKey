import { randomUUID } from "node:crypto";
import { handle, limit, sameOrigin } from "@/server/http";
import { newSession, getLink } from "@/server/checkout";
import { ApiError } from "@/server/security";
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    sameOrigin(req);
    const { id } = await params;
    await limit(`link-start:${id}`, 30);
    const link = await getLink(id);
    if (!link || link.disabledAt) throw new ApiError(404, "To‘lov havolasi mavjud emas.");
    return newSession(link.projectId, { title: link.title, amount_minor: Number(link.amountMinor), currency: link.currency }, randomUUID(), id);
  });
}

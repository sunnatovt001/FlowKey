import { apiProject } from "@/server/auth";
import { handle, limit } from "@/server/http";
import { db } from "@/server/db";
import { getSession } from "@/server/checkout";
import { ApiError } from "@/server/security";
import { serializePayment } from "@/server/payments";
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const projectId = await apiProject(req);
    await limit(`checkout-read:${projectId}`, 120);
    const { id } = await params;
    const session = await getSession(id);
    if (!session || session.projectId !== projectId) throw new ApiError(404, "To‘lov sessiyasi topilmadi.");
    const payment = await db.transaction.findUnique({ where: { projectId_idempotencyKey: { projectId, idempotencyKey: `checkout_${id}` } } });
    return { id, amount_minor: Number(session.amountMinor), currency: session.currency, status: payment?.status || (session.expiresAt <= new Date() ? "expired" : "open"), payment: payment ? serializePayment(payment) : null, expires_at: session.expiresAt.toISOString(), livemode: false };
  });
}

import { db } from "./db";
import { ApiError } from "./security";
import type { TicketState } from "./admin-access";
export async function updateAdminTicket(
  actorId: string,
  id: string,
  status: TicketState,
  expectedStatus: TicketState,
  source: "web" | "telegram" = "web",
) {
  return db.$transaction(async (tx) => {
    const ticket = await tx.supportTicket.findUnique({
      where: { id },
      select: { resolutionStatus: true },
    });
    if (!ticket) throw new ApiError(404, "Murojaat topilmadi.");
    if (ticket.resolutionStatus !== expectedStatus)
      throw new ApiError(409, "Holat o‘zgargan. Murojaatni qayta oching.");
    if (status === expectedStatus) return { status };
    const changed = await tx.supportTicket.updateMany({
      where: { id, resolutionStatus: expectedStatus },
      data: {
        resolutionStatus: status,
        resolvedAt: status === "resolved" ? new Date() : null,
        resolvedBy: status === "resolved" ? actorId : null,
      },
    });
    if (!changed.count)
      throw new ApiError(409, "Holat o‘zgargan. Murojaatni qayta oching.");
    await tx.adminAudit.create({
      data: {
        actorId,
        action: "support.status_changed",
        targetId: id,
        details: { from: expectedStatus, to: status, source },
      },
    });
    return { status };
  });
}

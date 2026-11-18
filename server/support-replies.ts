import { randomUUID } from "node:crypto";
import { db } from "./db";
import { ApiError } from "./security";
import { packText, unpackText } from "./telegram/storage";
import { redact } from "./telegram/policy";
import { sendText } from "./telegram/api";

export async function replyToTicket(
  actorId: string,
  ticketId: string,
  content: string,
  requestKey: string,
) {
  const packed = packText(redact(content.trim()));
  return db.$transaction(async (tx) => {
    const ticket = await tx.supportTicket.findUnique({
      where: { id: ticketId },
      select: { id: true },
    });
    if (!ticket) throw new ApiError(404, "Murojaat topilmadi.");
    const id = randomUUID();
    const inserted = await tx.supportReply.createMany({
      data: { id, ticketId, actorId, content: packed, requestKey },
      skipDuplicates: true,
    });
    const reply = await tx.supportReply.findUniqueOrThrow({
      where: { ticketId_requestKey: { ticketId, requestKey } },
    });
    if (reply.actorId !== actorId || reply.content !== packed)
      throw new ApiError(
        409,
        "Bu so‘rov boshqa javob uchun ishlatilgan. Sahifani yangilang.",
      );
    if (inserted.count)
      await tx.adminAudit.create({
        data: {
          actorId,
          action: "support.replied",
          targetId: ticketId,
          details: { replyId: reply.id },
        },
      });
    return {
      id: reply.id,
      content: unpackText(reply.content),
      createdAt: reply.createdAt,
    };
  });
}

// Notifications are at-least-once. A crash after Telegram accepts a message may repeat the notice.
export async function deliverReplyNotifications() {
  if (!process.env.TELEGRAM_BOT_TOKEN) return;
  const now = new Date();
  const rows = await db.supportReply.findMany({
    where: {
      notificationStatus: { in: ["queued", "sending"] },
      retryAt: { lte: now },
    },
    orderBy: { createdAt: "asc" },
    take: 5,
  });
  for (const row of rows) {
    const claimed = await db.supportReply.updateMany({
      where: {
        id: row.id,
        notificationStatus: row.notificationStatus,
        retryAt: row.retryAt,
      },
      data: {
        notificationStatus: "sending",
        retryAt: new Date(Date.now() + 120000),
        attempts: { increment: 1 },
      },
    });
    if (!claimed.count) continue;
    try {
      const ticket = await db.supportTicket.findUniqueOrThrow({
        where: { id: row.ticketId },
        select: { userId: true },
      });
      const connection = await db.telegramConnection.findUnique({
        where: { userId: ticket.userId },
        select: { chatId: true },
      });
      if (!connection) {
        await db.supportReply.update({
          where: { id: row.id },
          data: { notificationStatus: "not_linked" },
        });
        continue;
      }
      // No support text or account secrets are copied to Telegram.
      await sendText(
        connection.chatId,
        "FlowKey: murojaatingizga administrator javob berdi. Javobni saytdagi Sozlamalar → Telegram bo‘limida ko‘ring.",
      );
      await db.supportReply.update({
        where: { id: row.id },
        data: { notificationStatus: "sent", deliveredAt: new Date() },
      });
    } catch {
      await db.supportReply.update({
        where: { id: row.id },
        data: {
          notificationStatus: row.attempts >= 4 ? "failed" : "queued",
          retryAt: new Date(
            Date.now() + 60000 * Math.min(10, 2 ** row.attempts),
          ),
        },
      });
    }
  }
}

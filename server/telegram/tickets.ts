import { packText, unpackText, packSnapshot, unpackSnapshot } from "./storage";
import { db } from "../db";
import { accountContext } from "./context";
import { redact } from "./policy";
import { sendText } from "./api";
export async function createTicket(
  userId: string,
  summary: string,
  requestKey: string,
) {
  const snapshot = await accountContext(userId);
  const connection = await db.telegramConnection.findUnique({
    where: { userId },
  });
  const conversation = connection
    ? await db.telegramMessage.findMany({
        where: { connectionId: connection.id },
        select: { role: true, content: true },
        orderBy: { createdAt: "desc" },
        take: 6,
      })
    : [];
  const diagnostics = packSnapshot({
    ...snapshot,
    conversation: conversation.map((m) => ({
      ...m,
      content: unpackText(m.content),
    })),
  });
  requestKey = `${userId}:${requestKey}`;
  return db.supportTicket.upsert({
    where: { requestKey },
    update: {},
    create: {
      userId,
      summary: packText(redact(summary).slice(0, 2000)),
      requestKey,
      diagnostics,
    },
  });
}
export async function deliverTickets() {
  const admin = process.env.TELEGRAM_ADMIN_CHAT_ID;
  if (!admin) return;
  const tickets = await db.supportTicket.findMany({
    where: { status: "queued", retryAt: { lte: new Date() } },
    orderBy: { createdAt: "asc" },
    take: 2,
  });
  for (const ticket of tickets) {
    try {
      const d = unpackSnapshot(ticket.diagnostics);
      const report = {
        checkedAt: d.checkedAt,
        findings: d.findings,
        user: d.user,
        projectCount: d.projectCount,
        totals: d.totals,
        conversation: d.conversation,
        recentTransactions: Array.isArray(d.recentTransactions)
          ? d.recentTransactions.slice(0, 5)
          : [],
      };
      await sendText(
        admin,
        `FlowKey yordam murojaati\nID: ${ticket.id}\nHisob ID: ${ticket.userId}\nMuammo: ${redact(unpackText(ticket.summary))}\n\nTekshiruv ma’lumotlari:\n${redact(JSON.stringify(report)).slice(0, 5500)}`,
      );
      await db.supportTicket.update({
        where: { id: ticket.id },
        data: {
          status: "sent",
          attempts: { increment: 1 },
          deliveredAt: new Date(),
        },
      });
    } catch {
      await db.supportTicket.update({
        where: { id: ticket.id },
        data: {
          attempts: { increment: 1 },
          status: ticket.attempts >= 4 ? "failed" : "queued",
          retryAt: new Date(
            Date.now() + 60_000 * Math.min(10, 2 ** ticket.attempts),
          ),
        },
      });
    }
  }
}

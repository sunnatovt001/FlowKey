import { unpackText } from "@/server/telegram/storage";
import { z } from "zod";
import { db } from "@/server/db";
import { requireUser } from "@/server/auth";
import { body, handle, limit, sameOrigin } from "@/server/http";
import { createTicket } from "@/server/telegram/tickets";
export async function GET() {
  return handle(async () => {
    const user = await requireUser();
    const tickets = await db.supportTicket.findMany({
      where: { userId: user.id },
      select: {
        id: true,
        summary: true,
        status: true,
        createdAt: true,
        deliveredAt: true,
        resolutionStatus: true,
        resolvedAt: true,
        replies: {
          select: { id: true, content: true, createdAt: true },
          orderBy: [{ createdAt: "desc" }, { id: "desc" }],
          take: 20,
        },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    });
    return tickets.map((t) => ({
      ...t,
      summary: unpackText(t.summary),
      replies: t.replies
        .reverse()
        .map((r) => ({ ...r, content: unpackText(r.content) })),
    }));
  });
}
export async function POST(req: Request) {
  return handle(async () => {
    sameOrigin(req);
    const user = await requireUser();
    await limit(`support:${user.id}`, 5);
    const input = z
      .object({
        summary: z.string().trim().min(5).max(2000),
        requestKey: z.string().uuid(),
      })
      .parse(await body(req));
    const ticket = await createTicket(user.id, input.summary, input.requestKey);
    return { id: ticket.id, status: ticket.status };
  });
}

import { body, handle, limit, sameOrigin } from "@/server/http";
import { requireUser, requireProject } from "@/server/auth";
import { db } from "@/server/db";
import { ApiError } from "@/server/security";
import { projectDashboard } from "@/server/dashboard";
import { verifyMiniAppData } from "@/server/telegram/miniapp-proof";
import { z } from "zod";
const input = z.object({ initData: z.string().max(8192).optional(), project: z.string().max(128).optional(), range: z.enum(["7", "30", "90"]).default("7") });
export async function POST(req: Request) {
  return handle(async () => {
    sameOrigin(req);
    const data = input.parse(await body(req));
    let user;
    if (data.initData) {
      let chatId: string;
      try { chatId = verifyMiniAppData(data.initData, process.env.TELEGRAM_BOT_TOKEN || ""); }
      catch { throw new ApiError(401, "Telegram sessiyasi eskirgan yoki tasdiqlanmadi. Ilovani botdan qayta oching."); }
      await limit(`miniapp-telegram:${chatId}`, 40);
      const connection = await db.telegramConnection.findUnique({ where: { chatId }, include: { user: true } });
      if (!connection) throw new ApiError(403, "Avval FlowKey saytidagi Sozlamalar → Telegram bo‘limida hisobingizni shu botga ulang.");
      user = connection.user;
    } else {
      user = await requireUser();
      await limit(`miniapp-user:${user.id}`, 40);
    }
    const memberships = await db.membership.findMany({ where: { userId: user.id, project: { archivedAt: null } }, include: { project: true }, orderBy: { project: { createdAt: "asc" } } });
    const selected = data.project || memberships[0]?.projectId;
    const membership = memberships.find(m => m.projectId === selected);
    if (selected && !membership) throw new ApiError(404, "Loyiha topilmadi.");
    const projects = memberships.map(m => ({ id: m.projectId, name: m.project.name, role: m.role }));
    const [dashboard, payments, tickets] = await Promise.all([
      selected ? projectDashboard(selected, user.id, data.range) : null,
      selected ? (async () => { await requireProject(selected, user.id, true, "read"); return db.transaction.findMany({ where: { projectId: selected }, select: { id: true, amountMinor: true, status: true, createdAt: true }, orderBy: [{ createdAt: "desc" }, { id: "desc" }], take: 50 }); })() : [],
      db.supportTicket.findMany({ where: { userId: user.id }, select: { id: true, summary: true, resolutionStatus: true, createdAt: true }, orderBy: { createdAt: "desc" }, take: 10 }),
    ]);
    return {
      user: { name: user.name, email: user.email }, projects, selected: selected || null,
      dashboard: dashboard ? { volume: String(dashboard.volume), successful: dashboard.successful, pending: dashboard.pending, failed: dashboard.failed, total: dashboard.total, keyCount: dashboard.keyCount, webhook: dashboard.webhook, days: dashboard.days.map(d => ({ date: d.date, count: String(d.count), volume: String(d.volume) })) } : null,
      payments: payments.map(p => ({ ...p, amountMinor: String(p.amountMinor) })), tickets,
    };
  });
}

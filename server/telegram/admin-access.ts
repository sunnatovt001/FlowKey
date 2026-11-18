import { db } from "../db";
import { isPlatformAdmin } from "../admin-access";
import { ApiError, hash } from "../security";
export const telegramAdminMinutes = 15;
function sessionKey(chatId: string, userId: string, connectionId: string) {
  return (
    "telegram-admin-session:" +
    hash(
      `${chatId}:${userId}:${connectionId}:${process.env.FLOWKEY_ADMIN_PASSWORD_HASH || ""}`,
    )
  );
}
async function identity(chatId: string) {
  if (!chatId || chatId !== process.env.TELEGRAM_ADMIN_CHAT_ID?.trim())
    throw new ApiError(403, "Admin ruxsati yo‘q.");
  const connection = await db.telegramConnection.findUnique({
    where: { chatId },
    select: { id: true, user: { select: { id: true, emailVerified: true } } },
  });
  const user = connection?.user;
  if (!connection || !user?.emailVerified || !isPlatformAdmin(user.id))
    throw new ApiError(403, "Admin hisobingizni saytdan Telegram’ga ulang.");
  return { ...user, connectionId: connection.id };
}
export async function requireTelegramAdmin(chatId: string) {
  const user = await identity(chatId);
  const session = await db.supportBotState.findUnique({
    where: { id: sessionKey(chatId, user.id, user.connectionId) },
  });
  if (!session?.leaseUntil || session.leaseUntil <= new Date())
    throw new ApiError(
      401,
      "Telegram admin ruxsati tugagan. Saytdagi Admin panel → Telegram orqali 15 daqiqaga yoqing.",
    );
  return user;
}
export async function telegramAdminStatus(actorId: string) {
  const chatId = process.env.TELEGRAM_ADMIN_CHAT_ID?.trim() || "";
  let user;
  try {
    user = await identity(chatId);
  } catch {
    return { linked: false, expiresAt: null };
  }
  if (user.id !== actorId)
    throw new ApiError(403, "Bu admin hisobingizga ulanmagan.");
  const row = await db.supportBotState.findUnique({
    where: { id: sessionKey(chatId, actorId, user.connectionId) },
  });
  return {
    linked: true,
    expiresAt:
      row?.leaseUntil && row.leaseUntil > new Date() ? row.leaseUntil : null,
  };
}
export async function setTelegramAdminSession(
  actorId: string,
  enabled: boolean,
  source: "web" | "telegram" = "web",
) {
  const chatId = process.env.TELEGRAM_ADMIN_CHAT_ID?.trim() || "";
  const user = await identity(chatId);
  if (user.id !== actorId) throw new ApiError(403, "Admin hisob mos emas.");
  const id = sessionKey(chatId, actorId, user.connectionId),
    expiresAt = enabled
      ? new Date(Date.now() + telegramAdminMinutes * 60000)
      : null;
  await db.$transaction(async (tx) => {
    if (expiresAt)
      await tx.supportBotState.upsert({
        where: { id },
        create: { id, leaseUntil: expiresAt },
        update: { leaseUntil: expiresAt },
      });
    else await tx.supportBotState.deleteMany({ where: { id } });
    await tx.adminAudit.create({
      data: {
        actorId,
        action: enabled ? "telegram.admin.enabled" : "telegram.admin.disabled",
        targetId: actorId,
        details: { source, expiresAt: expiresAt?.toISOString() || null },
      },
    });
  });
  return { linked: true, expiresAt };
}

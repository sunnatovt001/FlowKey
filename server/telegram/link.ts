import { db } from "../db";
import { hash, secret, ApiError } from "../security";
export async function createLink(userId: string) {
  const code = secret("");
  const expiresAt = new Date(Date.now() + 10 * 60_000);
  await db.telegramLink.upsert({
    where: { userId },
    create: { userId, codeHash: hash(code), expiresAt },
    update: { codeHash: hash(code), expiresAt },
  });
  const username = process.env.TELEGRAM_BOT_USERNAME?.replace(/^@/, "");
  return {
    code,
    expiresAt,
    link: username ? `https://t.me/${username}?start=${code}` : null,
  };
}
export async function consumeLink(code: string, chatId: string) {
  if (!/^[a-f0-9]{64}$/.test(code))
    throw new ApiError(400, "Ulash kodi noto‘g‘ri yoki muddati tugagan.");
  return db.$transaction(async (tx) => {
    const link = await tx.telegramLink.findUnique({
      where: { codeHash: hash(code) },
    });
    if (!link || link.expiresAt <= new Date())
      throw new ApiError(400, "Ulash kodi noto‘g‘ri yoki muddati tugagan.");
    const consumed = await tx.telegramLink.deleteMany({
      where: {
        userId: link.userId,
        codeHash: hash(code),
        expiresAt: { gt: new Date() },
      },
    });
    if (!consumed.count)
      throw new ApiError(409, "Kod ishlatilgan. Kabinetdan yangisini oling.");
    const existing = await tx.telegramConnection.findUnique({
      where: { chatId },
    });
    if (existing && existing.userId !== link.userId)
      throw new ApiError(
        409,
        "Bu Telegram boshqa hisobga ulangan. Avval /unlink orqali uzing.",
      );
    return tx.telegramConnection.upsert({
      where: { userId: link.userId },
      create: { userId: link.userId, chatId },
      update: { chatId, linkedAt: new Date() },
    });
  });
}
export async function unlinkAccount(userId: string) {
  await db.$transaction([
    db.telegramConnection.deleteMany({ where: { userId } }),
    db.telegramLink.deleteMany({ where: { userId } }),
  ]);
}

import { env as supportEnv } from "cloudflare:workers";
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
  const username = supportEnv.TELEGRAM_BOT_USERNAME?.replace(/^@/, "");
  return {
    code,
    expiresAt,
    link: username ? `https://t.me/${username}?start=${code}` : null,
  };
}
export async function consumeLink(code: string, chatId: string) {
  if (!/^[a-f0-9]{64}$/.test(code))
    throw new ApiError(400, "Ulash kodi noto‘g‘ri yoki muddati tugagan.");
  const link = await db.telegramLink.findUnique({ where: { codeHash: hash(code) } });
  if (!link || link.expiresAt <= new Date()) throw new ApiError(400, "Ulash kodi noto‘g‘ri yoki muddati tugagan.");
  const existing = await db.telegramConnection.findUnique({ where: { chatId } });
  if (existing && existing.userId !== link.userId) throw new ApiError(409, "Bu Telegram boshqa hisobga ulangan. Avval /unlink orqali uzing.");
  // Conditional INSERT and one-time token removal are atomic in D1.
  const now = new Date().toISOString();
  const result = await supportEnv.DB!.batch([
    supportEnv.DB!.prepare('INSERT INTO TelegramConnection (id,userId,chatId,linkedAt) SELECT ?,userId,?,? FROM TelegramLink WHERE userId=? AND codeHash=? AND julianday(expiresAt)>julianday(?) ON CONFLICT(userId) DO UPDATE SET chatId=excluded.chatId,linkedAt=excluded.linkedAt').bind(crypto.randomUUID(),chatId,now,link.userId,hash(code),now),
    supportEnv.DB!.prepare('DELETE FROM TelegramLink WHERE userId=? AND codeHash=?').bind(link.userId,hash(code)),
  ]);
  if (!result[0].meta.changes) throw new ApiError(409, "Kod ishlatilgan. Kabinetdan yangisini oling.");
  return db.telegramConnection.findUniqueOrThrow({ where: { userId: link.userId } });
}

export async function unlinkAccount(userId: string) {
  await supportEnv.DB!.batch([
    supportEnv.DB!.prepare('DELETE FROM TelegramMessage WHERE connectionId IN (SELECT id FROM TelegramConnection WHERE userId=?)').bind(userId),
    supportEnv.DB!.prepare('DELETE FROM TelegramConnection WHERE userId=?').bind(userId),
    supportEnv.DB!.prepare('DELETE FROM TelegramLink WHERE userId=?').bind(userId),
  ]);
}

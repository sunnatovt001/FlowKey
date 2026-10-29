import { readFile, writeFile, rename, unlink } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { parseEnv } from "node:util";
import { db } from "../db";
import { hash, secret, ApiError } from "../security";
export async function writeAdminChatId(chatId: string, envFile = ".env") {
  if (!/^\d{1,20}$/.test(chatId))
    throw new Error("Shaxsiy Telegram chat ID noto‘g‘ri.");
  const current = await readFile(envFile, "utf8");
  const existing = parseEnv(current).TELEGRAM_ADMIN_CHAT_ID?.trim();
  if (existing && existing !== chatId)
    throw new Error(
      "Admin allaqachon sozlangan. Uni bir martalik havola bilan almashtirib bo‘lmaydi.",
    );
  const line = `TELEGRAM_ADMIN_CHAT_ID="${chatId}"`;
  const next = /^TELEGRAM_ADMIN_CHAT_ID\s*=/m.test(current)
    ? current.replace(/^TELEGRAM_ADMIN_CHAT_ID\s*=.*$/m, line)
    : `${current.trimEnd()}\n${line}\n`;
  const temporary = `${envFile}.admin-${randomUUID()}.tmp`;
  try {
    await writeFile(temporary, next, { mode: 0o600 });
    await rename(temporary, envFile);
  } finally {
    await unlink(temporary).catch(() => {});
  }
}
export async function createAdminSetup() {
  const configured = parseEnv(
    await readFile(".env", "utf8"),
  ).TELEGRAM_ADMIN_CHAT_ID?.trim();
  if (configured) throw new Error("Admin allaqachon sozlangan.");
  const username = process.env.TELEGRAM_BOT_USERNAME?.replace(/^@/, "");
  if (!username || !/^[A-Za-z0-9_]{5,32}$/.test(username))
    throw new Error("Bot username sozlanmagan.");
  const code = `admin_${secret("").slice(0, 40)}`,
    expiresAt = new Date(Date.now() + 10 * 60_000);
  await db.$transaction([
    db.supportBotState.deleteMany({
      where: { id: { startsWith: "admin-setup:" } },
    }),
    db.supportBotState.create({
      data: { id: `admin-setup:${hash(code)}`, leaseUntil: expiresAt },
    }),
  ]);
  return { link: `https://t.me/${username}?start=${code}`, expiresAt };
}
export async function claimAdminSetup(code: string, chatId: string) {
  if (!/^admin_[a-f0-9]{40}$/.test(code))
    throw new ApiError(400, "Admin ulash havolasi noto‘g‘ri.");
  await db.$transaction(async (tx) => {
    const consumed = await tx.supportBotState.deleteMany({
      where: {
        id: `admin-setup:${hash(code)}`,
        leaseUntil: { gt: new Date() },
      },
    });
    if (!consumed.count)
      throw new ApiError(
        400,
        "Admin havolasi ishlatilgan yoki muddati tugagan.",
      );
    await writeAdminChatId(chatId);
  });
  process.env.TELEGRAM_ADMIN_CHAT_ID = chatId;
}

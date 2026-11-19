import { createHmac } from "node:crypto";
import { checkoutUrl, getCheckoutSession } from "./checkout";
import { telegramLoginAvailable, telegramLoginBot } from "./telegram-login";
import { equalTelegramSecret } from "./telegram-login-proof";

function proof(id: string, expiry: Date) {
  const secret = process.env.TELEGRAM_LOGIN_WEBHOOK_SECRET;
  return secret && createHmac("sha256", secret)
    .update(`flowkey-sandbox-checkout:${id}:${expiry.toISOString()}`)
    .digest("base64url").slice(0, 18);
}

export function telegramCheckoutLink(id: string, expiry: Date) {
  const username = process.env.TELEGRAM_LOGIN_BOT_USERNAME?.replace(/^@/, "");
  if (!telegramLoginAvailable() || !username || !/^[A-Za-z0-9_]{5,32}$/.test(username)) return null;
  if (!checkoutUrl("/").startsWith("https://")) return null;
  const token = `p_${Buffer.from(id, "hex").toString("base64url")}${proof(id, expiry)}`;
  return `https://t.me/${username}?start=${token}`;
}

export function validCheckoutProof(id: string, expiry: Date, token: string) {
  const expected = proof(id, expiry);
  return !!expected && equalTelegramSecret(token, expected);
}

export async function openTelegramCheckout(encodedId: string, token: string, chatId: number) {
  const id = Buffer.from(encodedId, "base64url").toString("hex");
  const session = await getCheckoutSession(id);
  if (!session || session.result || session.expiresAt <= new Date() ||
      !validCheckoutProof(id, session.expiresAt, token)) {
    await telegramLoginBot("sendMessage", {
      chat_id: chatId,
      text: "Bu sinov to‘lovi yakunlangan yoki havola eskirgan. FlowKey sahifasiga qayting.",
    });
    return;
  }
  const webAppUrl = new URL(checkoutUrl(`/checkout/${id}`));
  webAppUrl.searchParams.set("telegram", token);
  await telegramLoginBot("sendMessage", {
    chat_id: chatId,
    text: "FlowKey sinov to‘lovi. Buyurtmani ochib, natijani sahifada tasdiqlang.",
    reply_markup: { inline_keyboard: [[{
      text: "Sinov buyurtmasini ochish",
      web_app: { url: webAppUrl.href },
    }]] },
  });
}

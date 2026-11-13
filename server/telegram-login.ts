import { createHmac } from "node:crypto";
import { db } from "./db";
import { digestTelegramProof, telegramFlowLifetime, equalTelegramSecret } from "./telegram-login-proof";

export type TelegramLoginFlow = {
  proofHash: string;
  startHash: string;
  code: string;
  language: "uz" | "ru" | "en";
  status: "pending" | "awaiting" | "confirmed";
  telegramId?: string;
  name?: string;
};
export function telegramLoginAvailable() {
  return !!process.env.TELEGRAM_LOGIN_BOT_TOKEN && !!process.env.TELEGRAM_LOGIN_BOT_USERNAME && !!process.env.TELEGRAM_LOGIN_WEBHOOK_SECRET;
}
export function parseTelegramFlow(value: string): TelegramLoginFlow {
  return JSON.parse(value) as TelegramLoginFlow;
}
export async function telegramLoginBot(method: "sendMessage" | "answerCallbackQuery", body: unknown) {
  const token = process.env.TELEGRAM_LOGIN_BOT_TOKEN;
  if (!token) throw new Error("Telegram login unavailable");
  try {
    const response = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body), signal: AbortSignal.timeout(8000),
    });
    const result = await response.json() as { ok?: boolean };
    if (!response.ok || !result.ok) throw new Error();
  } catch { throw new Error("Telegram login bot request failed"); }
}
const copy = {
  ru: { confirm: "Подтвердить вход", done: "Вход подтверждён. Откройте FlowKey кнопкой ниже. В исходном браузере вход завершится автоматически.", request: "Вход на flowkey.uz. Код на сайте и здесь должен совпадать:", warning: "Подтверждайте только если вы сами начали вход на FlowKey. Не подтверждайте чужие ссылки.", invalid: "Ссылка устарела. Начните вход заново на https://flowkey.uz/login" },
  uz: { confirm: "Kirishni tasdiqlash", done: "Kirish tasdiqlandi. Quyidagi tugma bilan FlowKey’ga qayting. Oldingi brauzerda kirish avtomatik yakunlanadi.", request: "flowkey.uz saytiga kirish. Saytdagi va bu yerdagi kod bir xil bo‘lsin:", warning: "Faqat o‘zingiz FlowKey’da kirishni boshlagan bo‘lsangiz tasdiqlang. Boshqa birov yuborgan havolani tasdiqlamang.", invalid: "Havola eskirgan. https://flowkey.uz/login orqali qayta boshlang." },
  en: { confirm: "Confirm sign in", done: "Sign in confirmed. Open FlowKey below. Your original browser will also sign in automatically.", request: "Sign in to flowkey.uz. Check that this code matches the website:", warning: "Only confirm if you started signing in to FlowKey yourself. Do not confirm links sent by someone else.", invalid: "This link has expired. Start again at https://flowkey.uz/login" },
};
export async function bindTelegramLogin(flowId: string, startToken: string, telegramId: string, name: string) {
  const row = await db.verification.findUnique({ where: { id: flowId } });
  if (!row || row.identifier !== `telegram-login:${flowId}` || row.expiresAt.getTime() <= Date.now()) return false;
  const flow = parseTelegramFlow(row.value);
  if (!equalTelegramSecret(digestTelegramProof(startToken), flow.startHash) || flow.status === "confirmed" || (flow.telegramId && flow.telegramId !== telegramId)) return false;
  const next: TelegramLoginFlow = { ...flow, telegramId, name: name.trim().slice(0, 100) || "Telegram member", status: "awaiting" };
  const updated = await db.verification.updateMany({ where: { id: flowId, value: row.value, expiresAt: { gt: new Date() } }, data: { value: JSON.stringify(next) } });
  if (!updated.count) return false;
  const text = copy[flow.language];
  await telegramLoginBot("sendMessage", { chat_id: telegramId, text: `${text.request}\n\n${flow.code}\n\n${text.warning}`, reply_markup: { inline_keyboard: [[{ text: `${text.confirm} · ${flow.code}`, callback_data: `fk_confirm_${flowId}` }]] } });
  return true;
}
export async function sendTelegramLoginWelcome(telegramId: string, language: "uz" | "ru" | "en", expired = false) {
  const messages = {
    ru: expired ? "Ссылка входа устарела. Начните заново на сайте FlowKey." : "Добро пожаловать в FlowKey! Начните вход на сайте, затем подтвердите его здесь.",
    uz: expired ? "Kirish havolasi eskirgan. FlowKey saytida qayta boshlang." : "FlowKey’ga xush kelibsiz! Saytda kirishni boshlang, so‘ng bu yerda tasdiqlang.",
    en: expired ? "This sign-in link has expired. Start again on the FlowKey website." : "Welcome to FlowKey! Start signing in on the website, then confirm here.",
  };
  await telegramLoginBot("sendMessage", { chat_id: telegramId, text: messages[language], reply_markup: { inline_keyboard: [[{ text: language === "ru" ? "Открыть FlowKey" : language === "uz" ? "FlowKey’ni ochish" : "Open FlowKey", url: new URL("/login", process.env.APP_URL || "https://flowkey.uz").href }]] } });
}
export async function confirmTelegramLogin(flowId: string, telegramId: string) {
  const row = await db.verification.findUnique({ where: { id: flowId } });
  if (!row || row.identifier !== `telegram-login:${flowId}` || row.expiresAt.getTime() <= Date.now()) return false;
  const flow = parseTelegramFlow(row.value);
  if (flow.telegramId !== telegramId || flow.status === "pending") return false;
  const secret = process.env.BETTER_AUTH_SECRET;
  if (!secret) throw new Error("Telegram session configuration unavailable");
  const resumeToken = createHmac("sha256", secret).update(`flowkey-telegram-resume-v1:${flowId}:${telegramId}:${flow.proofHash}`).digest("base64url");
  if (flow.status !== "confirmed") {
    const changed = await db.$transaction(async tx => {
      const updated = await tx.verification.updateMany({ where: { id: flowId, value: row.value, expiresAt: { gt: new Date() } }, data: { value: JSON.stringify({ ...flow, status: "confirmed" }) } });
      if (!updated.count) return false;
      // Separate one-use return credential, like Logic Coin; original browser proof
      // remains valid so either browser can finish independently, at most once each.
      await tx.verification.create({ data: { id: `tg-resume-${flowId}`, identifier: `telegram-login-resume:${digestTelegramProof(resumeToken)}`, value: JSON.stringify({ telegramId, name: flow.name || "Telegram member" }), expiresAt: row.expiresAt } });
      return true;
    });
    if (!changed) return false;
  }
  const target = new URL("/telegram-login", process.env.APP_URL || "https://flowkey.uz");
  target.hash = new URLSearchParams({ telegram_token: resumeToken }).toString();
  await telegramLoginBot("sendMessage", { chat_id: telegramId, text: copy[flow.language].done, reply_markup: { inline_keyboard: [[{ text: flow.language === "ru" ? "Продолжить в FlowKey" : flow.language === "uz" ? "FlowKey’da davom etish" : "Continue to FlowKey", url: target.href }]] } });
  return true;
}
export { telegramFlowLifetime };

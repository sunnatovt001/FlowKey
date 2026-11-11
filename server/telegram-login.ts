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
  ru: { confirm: "Подтвердить вход", done: "Вход подтверждён. Вернитесь на FlowKey в тот же браузер.", request: "Вход на flowkey.uz. Код на сайте и здесь должен совпадать:", warning: "Подтверждайте только если вы сами начали вход на FlowKey. Не подтверждайте чужие ссылки.", invalid: "Ссылка устарела. Начните вход заново на https://flowkey.uz/login" },
  uz: { confirm: "Kirishni tasdiqlash", done: "Kirish tasdiqlandi. FlowKey ochilgan brauzerga qayting.", request: "flowkey.uz saytiga kirish. Saytdagi va bu yerdagi kod bir xil bo‘lsin:", warning: "Faqat o‘zingiz FlowKey’da kirishni boshlagan bo‘lsangiz tasdiqlang. Boshqa birov yuborgan havolani tasdiqlamang.", invalid: "Havola eskirgan. https://flowkey.uz/login orqali qayta boshlang." },
  en: { confirm: "Confirm sign in", done: "Sign in confirmed. Return to FlowKey in the same browser.", request: "Sign in to flowkey.uz. Check that this code matches the website:", warning: "Only confirm if you started signing in to FlowKey yourself. Do not confirm links sent by someone else.", invalid: "This link has expired. Start again at https://flowkey.uz/login" },
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
export async function confirmTelegramLogin(flowId: string, telegramId: string) {
  const row = await db.verification.findUnique({ where: { id: flowId } });
  if (!row || row.identifier !== `telegram-login:${flowId}` || row.expiresAt.getTime() <= Date.now()) return false;
  const flow = parseTelegramFlow(row.value);
  if (flow.telegramId !== telegramId || flow.status === "pending") return false;
  if (flow.status !== "confirmed") {
    const updated = await db.verification.updateMany({ where: { id: flowId, value: row.value, expiresAt: { gt: new Date() } }, data: { value: JSON.stringify({ ...flow, status: "confirmed" }) } });
    if (!updated.count) return false;
  }
  await telegramLoginBot("sendMessage", { chat_id: telegramId, text: copy[flow.language].done });
  return true;
}
export { telegramFlowLifetime };

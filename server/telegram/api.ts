import { env as supportEnv } from "cloudflare:workers";
export type TelegramUpdate = {
  update_id: number;
  message?: {
    message_id: number;
    text?: string;
    from?: { id: number; is_bot?: boolean };
    chat: { id: number; type: string };
  };
  callback_query?: {
    id: string;
    from: { id: number };
    data?: string;
    message?: { message_id: number; chat: { id: number; type: string } };
  };
};
export const supportKeyboard = {
  inline_keyboard: [
    [
      { text: "Hisobni tekshirish", callback_data: "check" },
      { text: "Adminga yuborish", callback_data: "admin" },
    ],
  ],
};
export async function telegramCall<T>(
  method: string,
  data: unknown,
  fetcher: typeof fetch = fetch,
): Promise<T> {
  const token = supportEnv.TELEGRAM_BOT_TOKEN;
  if (!token) throw new Error("TELEGRAM_BOT_TOKEN sozlanmagan.");
  const r = await fetcher(`https://api.telegram.org/bot${token}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
    signal: AbortSignal.timeout(method === "getUpdates" ? 35_000 : 15_000),
  });
  const result = (await r.json()) as { ok: boolean; result: T };
  if (!r.ok || !result.ok)
    throw new Error(`Telegram so‘rovi bajarilmadi (${r.status}).`);
  return result.result;
}
export async function sendText(chatId: string, text: string, keyboard = false) {
  const chunks = text.match(/[\s\S]{1,3500}/gu) || ["Javob bo‘sh."];
  for (let i = 0; i < chunks.length; i++)
    await telegramCall("sendMessage", {
      chat_id: chatId,
      text: chunks[i],
      link_preview_options: { is_disabled: true },
      ...(keyboard && i === chunks.length - 1
        ? { reply_markup: supportKeyboard }
        : {}),
    });
}

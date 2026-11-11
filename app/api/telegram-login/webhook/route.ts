import { z } from "zod";
import { body, handle } from "@/server/http";
import { ApiError } from "@/server/security";
import { equalTelegramSecret, privateTelegramSender } from "@/server/telegram-login-proof";
import { bindTelegramLogin, confirmTelegramLogin, telegramLoginBot } from "@/server/telegram-login";
const person = z.object({ id: z.number().int().positive().max(Number.MAX_SAFE_INTEGER), is_bot: z.boolean().optional(), first_name: z.string().max(256).optional(), last_name: z.string().max(256).optional() });
const chat = z.object({ id: z.number().int(), type: z.string() });
const updateSchema = z.object({
  message: z.object({ text: z.string().max(4096).optional(), from: person.optional(), chat }).optional(),
  callback_query: z.object({ id: z.string().max(256), data: z.string().max(64).optional(), from: person, message: z.object({ chat }).optional() }).optional(),
});
export async function POST(req: Request) {
  return handle(async () => {
    const expected = process.env.TELEGRAM_LOGIN_WEBHOOK_SECRET;
    const actual = req.headers.get("x-telegram-bot-api-secret-token");
    if (!expected || !actual || !equalTelegramSecret(actual, expected)) throw new ApiError(403, "Ruxsat yo‘q.");
    const update = updateSchema.parse(await body(req));
    const message = update.message;
    if (message?.from && privateTelegramSender(message.chat, message.from)) {
      const match = message.text?.match(/^\/start(?:@[A-Za-z0-9_]+)? fk_([a-f0-9]{32})_([A-Za-z0-9_-]{22})$/);
      if (match) await bindTelegramLogin(match[1], match[2], String(message.from.id), [message.from.first_name, message.from.last_name].filter(Boolean).join(" "));
    }
    const callback = update.callback_query;
    if (callback?.message && privateTelegramSender(callback.message.chat, callback.from)) {
      const match = callback.data?.match(/^fk_confirm_([a-f0-9]{32})$/);
      if (match) {
        await confirmTelegramLogin(match[1], String(callback.from.id));
        await telegramLoginBot("answerCallbackQuery", { callback_query_id: callback.id });
      }
    }
    return { ok: true };
  });
}

import { existsSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { db } from "../server/db";
import { hash } from "../server/security";
import { telegramCall, TelegramUpdate } from "../server/telegram/api";
import { processUpdate } from "../server/telegram/bot";
import { deliverTickets } from "../server/telegram/tickets";
if (existsSync(".env")) process.loadEnvFile(".env");
if (!process.env.TELEGRAM_BOT_TOKEN) {
  console.error(
    "TELEGRAM_BOT_TOKEN kiritilmagan. TELEGRAM_BOT.md yo‘riqnomasini ko‘ring.",
  );
  process.exit(1);
}
const id = `telegram:${hash(process.env.TELEGRAM_BOT_TOKEN).slice(0, 24)}`,
  owner = randomUUID();
let stopped = false;
process.on("SIGINT", () => {
  stopped = true;
});
process.on("SIGTERM", () => {
  stopped = true;
});
const lease = () => new Date(Date.now() + 180_000);
await db.supportBotState.upsert({ where: { id }, create: { id }, update: {} });
const acquired = await db.supportBotState.updateMany({
  where: { id, OR: [{ leaseUntil: null }, { leaseUntil: { lt: new Date() } }] },
  data: { leaseOwner: owner, leaseUntil: lease() },
});
if (!acquired.count) {
  console.error(
    "Botning boshqa nusxasi ishlayapti. Bir vaqtda faqat bitta poller ishlating.",
  );
  await db.$disconnect();
  process.exit(1);
}
try {
  const webhook = await telegramCall<{ url: string }>("getWebhookInfo", {});
  if (webhook.url)
    throw new Error(
      "Botda webhook mavjud. Uni BotFather/Telegram API orqali olib tashlagach pollingni boshlang; mavjud webhook avtomatik o‘chirilmaydi.",
    );
  const me = await telegramCall<{ username?: string }>("getMe", {});
  if (
    me.username &&
    process.env.TELEGRAM_BOT_USERNAME &&
    me.username.toLowerCase() !==
      process.env.TELEGRAM_BOT_USERNAME.replace(/^@/, "").toLowerCase()
  )
    throw new Error(
      "TELEGRAM_BOT_USERNAME token egasiga mos emas. .env ni tekshiring.",
    );
  console.log("Telegram yordamchi ishlayapti. Ctrl+C — to‘xtatish.");
  let offset = (await db.supportBotState.findUniqueOrThrow({ where: { id } }))
    .offset;
  while (!stopped) {
    try {
      const active = await db.supportBotState.updateMany({
        where: { id, leaseOwner: owner },
        data: { leaseUntil: lease() },
      });
      if (!active.count) throw new Error("Bot lease lost");
      await deliverTickets();
      const updates = await telegramCall<TelegramUpdate[]>("getUpdates", {
        offset,
        timeout: 25,
        allowed_updates: ["message", "callback_query"],
      });
      for (const update of updates) {
        if (stopped) break;
        const renewed = await db.supportBotState.updateMany({
          where: { id, leaseOwner: owner },
          data: { leaseUntil: lease() },
        });
        if (!renewed.count) {
          stopped = true;
          break;
        }
        await processUpdate(update);
        offset = update.update_id + 1;
        await db.supportBotState.updateMany({
          where: { id, leaseOwner: owner },
          data: { offset, leaseUntil: lease() },
        });
      }
    } catch {
      console.error(
        "Bot so‘rovi bajarilmadi. Kalit va tarmoqni tekshiring; 5 soniyadan keyin qayta urinadi.",
      );
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }
  }
} catch (error) {
  console.error(
    error instanceof Error && !error.message.includes("http")
      ? error.message
      : "Botni ishga tushirib bo‘lmadi.",
  );
  process.exitCode = 1;
} finally {
  await db.supportBotState.updateMany({
    where: { id, leaseOwner: owner },
    data: { leaseOwner: null, leaseUntil: null },
  });
  await db.$disconnect();
}

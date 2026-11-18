import { claimAdminSetup } from "./admin-setup";
import { packText, unpackText } from "./storage";
import { db } from "../db";
import { limit } from "../http";
import { ApiError } from "../security";
import { accountContext } from "./context";
import { consumeLink, unlinkAccount } from "./link";
import { lookupAccount } from "./lookup";
import { answerQuestion, Turn } from "./ai";
import { redact } from "./policy";
import { sendText, telegramCall, TelegramUpdate } from "./api";
import { createTicket } from "./tickets";
import {handleAdminPanel} from "./admin-panel";
export async function processUpdate(update: TelegramUpdate) {
  const callback = update.callback_query;
  const message = update.message || callback?.message;
  const from = update.message?.from || callback?.from;
  if (
    !message ||
    message.chat.type !== "private" ||
    !from ||
    String(from.id) !== String(message.chat.id)
  )
    return;
  const chatId = String(message.chat.id);
  if (callback)
    await telegramCall("answerCallbackQuery", {
      callback_query_id: callback.id,
    });
  const text = update.message?.text?.trim() || "";
  if(text==="/panel"||text==="/adminpanel"||callback?.data?.startsWith("pa:")||(text==="/admin"&&chatId===process.env.TELEGRAM_ADMIN_CHAT_ID?.trim())){
    await handleAdminPanel(chatId,callback?.data||"pa:home");return;
  }
  if (text === "/id") {
    await sendText(chatId, `Sizning Telegram chat ID: ${chatId}`);
    return;
  }
  if (text === "/help" || text === "/start") {
    await sendText(
      chatId,
      "FlowKey yordam botiga xush kelibsiz. Kabinet → Hisob sozlamalari → Telegram yordamchi orqali hisobingizni ulang.\n/check — hisob holati\n/admin — muammoni adminga yuborish\n/unlink — hisobni uzish"+(chatId===process.env.TELEGRAM_ADMIN_CHAT_ID?.trim()?"\n/panel — admin boshqaruvi":""),
    );
    return;
  }
  if (text.startsWith("/start admin_")) {
    try {
      await limit(`telegram-admin-setup:${chatId}`, 5);
      await claimAdminSetup(text.slice(7).trim(), chatId);
      await sendText(
        chatId,
        "Admin ulanishi saqlandi. Yangi murojaatlar shu Telegram chatiga yuboriladi.",
      );
    } catch (error) {
      await sendText(
        chatId,
        error instanceof ApiError
          ? error.message
          : "Adminni ulab bo‘lmadi. Local sozlashni tekshiring.",
      );
    }
    return;
  }
  if (text.startsWith("/start ")) {
    try {
      await limit(`telegram-link:${chatId}`, 5);
      await consumeLink(text.slice(7).trim(), chatId);
      await sendText(
        chatId,
        "Hisob ulandi. Savolingizni yozing yoki Hisobni tekshirish tugmasini bosing.",
        true,
      );
    } catch (error) {
      await sendText(
        chatId,
        error instanceof ApiError
          ? error.message
          : "Hisobni ulab bo‘lmadi. Kabinetdan yangi kod oling.",
      );
    }
    return;
  }
  const connection = await db.telegramConnection.findUnique({
    where: { chatId },
  });
  if (!connection) {
    await sendText(
      chatId,
      "Avval kabinetdagi Telegram yordamchi bo‘limidan hisobingizni ulang.",
    );
    return;
  }
  if (text === "/unlink") {
    await unlinkAccount(connection.userId);
    await sendText(
      chatId,
      "Telegram hisobdan uzildi. Oldingi ulash kodlari ham bekor qilindi.",
    );
    return;
  }
  try {
    await limit(`telegram:${connection.userId}`, 12);
  } catch {
    await sendText(
      chatId,
      "Bir daqiqada juda ko‘p so‘rov. Biroz kutib qayta urinib ko‘ring.",
    );
    return;
  }
  if (text === "/admin" || callback?.data === "admin") {
    const last = await db.telegramMessage.findFirst({
      where: { connectionId: connection.id, role: "user" },
      orderBy: { createdAt: "desc" },
    });
    if (!last) {
      await sendText(
        chatId,
        "Avval muammoni oddiy xabar bilan yozing, keyin Adminga yuborish tugmasini bosing.",
      );
      return;
    }
    const ticket = await createTicket(
      connection.userId,
      unpackText(last.content),
      `telegram:${connection.id}:${last.id}`,
    );
    await sendText(
      chatId,
      `Murojaat saqlandi. ID: ${ticket.id}. ${ticket.status === "sent" ? "Admin Telegram’iga yetkazilgan." : "Adminga yetkazish navbatida. Holatini kabinetda ko‘rasiz."}`,
      true,
    );
    return;
  }
  if (text === "/check" || callback?.data === "check") {
    const snapshot = await accountContext(connection.userId);
    await sendText(
      chatId,
      `Hisob tekshiruvi\n${snapshot.findings.join("\n\n")}`,
      true,
    );
    return;
  }
  if (callback) return;
  if (!text) {
    await sendText(chatId, "Savolingizni matn ko‘rinishida yuboring.");
    return;
  }
  if (text.length > 4000) {
    await sendText(chatId, "Xabarni 4000 belgidan qisqaroq yozing.");
    return;
  }
  const externalId = `message:${message.message_id}`;
  const cached = await db.telegramMessage.findUnique({
    where: {
      connectionId_externalId: {
        connectionId: connection.id,
        externalId: `reply:${message.message_id}`,
      },
    },
  });
  if (cached) {
    await sendText(chatId, unpackText(cached.content), true);
    return;
  }
  const history = await db.telegramMessage.findMany({
    where: { connectionId: connection.id, externalId: { not: externalId } },
    orderBy: { createdAt: "desc" },
    take: 8,
  });
  await db.telegramMessage.upsert({
    where: {
      connectionId_externalId: { connectionId: connection.id, externalId },
    },
    update: {},
    create: {
      connectionId: connection.id,
      externalId,
      role: "user",
      content: packText(redact(text)),
    },
  });
  let answer: string;
  try {
    answer = await answerQuestion(
      await accountContext(connection.userId),
      history.reverse().map((m) => ({
        role: m.role as Turn["role"],
        content: unpackText(m.content),
      })),
      text,
      fetch,
      async (args) => {
        if (
          !(await db.telegramConnection.findFirst({
            where: { id: connection.id, chatId, userId: connection.userId },
          }))
        )
          throw new Error("Telegram uzilgan.");
        return lookupAccount(connection.userId, args);
      },
    );
  } catch {
    answer =
      "AI hozir javob bera olmadi. /check orqali hisobni tekshiring yoki Adminga yuborish tugmasini bosing.";
  }
  // Re-check revocation after the provider request before persisting or sending account facts.
  const stillLinked = await db.telegramConnection.findFirst({
    where: { id: connection.id, chatId, userId: connection.userId },
  });
  if (!stillLinked) return;
  await db.telegramMessage.upsert({
    where: {
      connectionId_externalId: {
        connectionId: connection.id,
        externalId: `reply:${message.message_id}`,
      },
    },
    update: {},
    create: {
      connectionId: connection.id,
      externalId: `reply:${message.message_id}`,
      role: "assistant",
      content: packText(answer),
    },
  });
  await sendText(chatId, answer, true);
}

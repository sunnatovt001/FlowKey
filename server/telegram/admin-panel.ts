import { db } from "../db";
import { ApiError } from "../security";
import { limit } from "../http";
import { ticketStates, type TicketState } from "../admin-access";
import { updateAdminTicket } from "../admin-ticket-workflow";
import { requireTelegramAdmin } from "./admin-access";
import { telegramCall } from "./api";
import { unpackText } from "./storage";
import { redact } from "./policy";
type Button = { text: string; callback_data?: string; url?: string };
const home: Button[][] = [
  [
    { text: "Yangi murojaatlar", callback_data: "pa:list:open:0" },
    { text: "Jarayonda", callback_data: "pa:list:in_progress:0" },
  ],
  [{ text: "Hal qilingan", callback_data: "pa:list:resolved:0" }],
  [
    { text: "Foydalanuvchilar", callback_data: "pa:users:0" },
    { text: "Loyihalar", callback_data: "pa:projects:0" },
  ],
  [
    { text: "Holatni yangilash", callback_data: "pa:home" },
    { text: "Telegram adminni yopish", callback_data: "pa:logout" },
  ],
];
const short: Record<TicketState, string> = {
  open: "o",
  in_progress: "p",
  resolved: "r",
};
const states: Record<string, TicketState> = {
  o: "open",
  p: "in_progress",
  r: "resolved",
};
function web(path: string) {
  return new URL(
    path,
    process.env.APP_URL || "http://localhost:3000",
  ).toString();
}
async function send(chatId: string, text: string, keyboard: Button[][] = home) {
  await telegramCall("sendMessage", {
    chat_id: chatId,
    text,
    reply_markup: { inline_keyboard: keyboard },
    link_preview_options: { is_disabled: true },
  });
}
function page(value: string | undefined) {
  if (!value || !/^\d{1,4}$/.test(value))
    throw new ApiError(400, "Sahifa noto‘g‘ri.");
  return Math.min(Number(value), 1000);
}
function ticketId(value: string | undefined) {
  if (!value || !/^[A-Za-z0-9_-]{1,40}$/.test(value))
    throw new ApiError(400, "Murojaat ID noto‘g‘ri.");
  return value;
}
export async function handleAdminPanel(chatId: string, action = "pa:home") {
  try {
    const actor = await requireTelegramAdmin(chatId);
    await limit(`telegram-panel:${actor.id}`, 30);
    const [prefix, command, arg, a, b] = action.split(":");
    if (prefix !== "pa") throw new ApiError(400, "Buyruq noto‘g‘ri.");
    if (command === "logout") {
      // This revokes only Telegram administration; the website session stays intact.
      const { setTelegramAdminSession } = await import("./admin-access");
      await setTelegramAdminSession(actor.id, false, "telegram");
      await send(chatId, "Telegram admin boshqaruvi yopildi.", [
        [{ text: "Saytdan qayta yoqish", url: web("/admin/telegram") }],
      ]);
      return;
    }
    if (command === "home") {
      const [users, projects, open, progress, resolved] = await Promise.all([
        db.user.count(),
        db.project.count(),
        db.supportTicket.count({ where: { resolutionStatus: "open" } }),
        db.supportTicket.count({ where: { resolutionStatus: "in_progress" } }),
        db.supportTicket.count({ where: { resolutionStatus: "resolved" } }),
      ]);
      await send(
        chatId,
        `FlowKey admin\n\nFoydalanuvchilar: ${users}\nLoyihalar: ${projects}\nYangi murojaatlar: ${open}\nKo‘rib chiqilmoqda: ${progress}\nHal qilingan: ${resolved}`,
      );
      return;
    }
    if (command === "list") {
      if (!Object.hasOwn(ticketStates, arg))
        throw new ApiError(400, "Holat noto‘g‘ri.");
      const offset = page(a),
        where = { resolutionStatus: arg };
      const rows = await db.supportTicket.findMany({
        where,
        select: { id: true, summary: true, user: { select: { email: true } } },
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        skip: offset * 5,
        take: 6,
      });
      const keyboard: Button[][] = rows.slice(0, 5).map((row) => [
        {
          text: `${redact(row.user.email).slice(0, 40)} · ${redact(unpackText(row.summary)).slice(0, 40)}`,
          callback_data: `pa:ticket:${row.id}`,
        },
      ]);
      const pagination: Button[] = [];
      if (offset)
        pagination.push({
          text: "← Oldingi",
          callback_data: `pa:list:${arg}:${offset - 1}`,
        });
      if (rows.length > 5)
        pagination.push({
          text: "Keyingi →",
          callback_data: `pa:list:${arg}:${offset + 1}`,
        });
      if (pagination.length) keyboard.push(pagination);
      keyboard.push([{ text: "Bosh menyu", callback_data: "pa:home" }]);
      await send(
        chatId,
        `${ticketStates[arg as TicketState]} murojaatlar · ${offset + 1}-sahifa${!rows.length ? "\nMurojaatlar yo‘q." : "\nKo‘rish uchun murojaatni tanlang."}`,
        keyboard,
      );
      return;
    }
    if (command === "users" || command === "projects") {
      const offset = page(arg);
      let lines: string[],
        more = false;
      if (command === "users") {
        const rows = await db.user.findMany({
          select: { name: true, email: true, emailVerified: true },
          orderBy: [{ createdAt: "desc" }, { id: "desc" }],
          skip: offset * 5,
          take: 6,
        });
        more = rows.length > 5;
        lines = rows
          .slice(0, 5)
          .map(
            (r) =>
              `${redact(r.name).slice(0, 70)}\n${r.email}\n${r.emailVerified ? "Tasdiqlangan" : "Tasdiqlanmagan"}`,
          );
      } else {
        const rows = await db.project.findMany({
          select: {
            name: true,
            archivedAt: true,
            business: { select: { owner: { select: { email: true } } } },
          },
          orderBy: [{ createdAt: "desc" }, { id: "desc" }],
          skip: offset * 5,
          take: 6,
        });
        more = rows.length > 5;
        lines = rows
          .slice(0, 5)
          .map(
            (r) =>
              `${redact(r.name).slice(0, 80)}\n${r.business.owner.email}\n${r.archivedAt ? "Arxivlangan" : "Faol"}`,
          );
      }
      const nav: Button[] = [];
      if (offset)
        nav.push({
          text: "← Oldingi",
          callback_data: `pa:${command}:${offset - 1}`,
        });
      if (more)
        nav.push({
          text: "Keyingi →",
          callback_data: `pa:${command}:${offset + 1}`,
        });
      await send(
        chatId,
        `${command === "users" ? "Foydalanuvchilar" : "Loyihalar"} · ${offset + 1}-sahifa\n\n${lines.join("\n\n") || "Yozuvlar yo‘q."}`,
        [
          ...(nav.length ? [nav] : []),
          [{ text: "Bosh menyu", callback_data: "pa:home" }],
        ],
      );
      return;
    }
    if (command === "ticket" || command === "confirm" || command === "set") {
      const id = ticketId(arg);
      const row = await db.supportTicket.findUnique({
        where: { id },
        select: {
          id: true,
          summary: true,
          status: true,
          resolutionStatus: true,
          user: { select: { email: true } },
        },
      });
      if (!row) throw new ApiError(404, "Murojaat topilmadi.");
      if (command !== "ticket") {
        if (!Object.hasOwn(states, a) || !Object.hasOwn(states, b))
          throw new ApiError(400, "Holat noto‘g‘ri.");
        if (row.resolutionStatus !== states[a])
          throw new ApiError(
            409,
            "Holat boshqa joyda o‘zgargan. Murojaatni qayta oching.",
          );
        if (command === "confirm") {
          await send(
            chatId,
            `${id}\n${ticketStates[states[a]]} → ${ticketStates[states[b]]}\n\nO‘zgarishni tasdiqlaysizmi?`,
            [
              [{ text: "Tasdiqlash", callback_data: `pa:set:${id}:${a}:${b}` }],
              [{ text: "Bekor qilish", callback_data: `pa:ticket:${id}` }],
            ],
          );
          return;
        }
        await requireTelegramAdmin(chatId);
        await updateAdminTicket(actor.id, id, states[b], states[a], "telegram");
        await send(chatId, `Holat saqlandi: ${ticketStates[states[b]]}`, [
          [{ text: "Murojaatni ochish", callback_data: `pa:ticket:${id}` }],
          [{ text: "Bosh menyu", callback_data: "pa:home" }],
        ]);
        return;
      }
      const current = row.resolutionStatus as TicketState;
      const keyboard: Button[][] = Object.entries(ticketStates)
        .filter(([state]) => state !== current)
        .map(([state, label]) => [
          {
            text: label,
            callback_data: `pa:confirm:${id}:${short[current]}:${short[state as TicketState]}`,
          },
        ]);
      keyboard.push(
        [{ text: "Saytda ochish", url: web(`/admin/tickets/${id}`) }],
        [{ text: "Bosh menyu", callback_data: "pa:home" }],
      );
      await send(
        chatId,
        `Murojaat: ${id}\nHisob: ${row.user.email}\nHolat: ${ticketStates[current] || current}\nTelegram yetkazilishi: ${row.status === "sent" ? "Yetkazilgan" : row.status === "failed" ? "Xato" : "Navbatda"}\n\n${redact(unpackText(row.summary)).slice(0, 1800)}`,
        keyboard,
      );
      return;
    }
    throw new ApiError(400, "Buyruq topilmadi.");
  } catch (error) {
    await send(
      chatId,
      error instanceof ApiError
        ? error.message
        : "Admin so‘rovini bajarib bo‘lmadi. Qayta urinib ko‘ring.",
      [
        [
          {
            text: "Admin kirishini saytda yoqish",
            url: web("/admin/telegram"),
          },
        ],
      ],
    );
  }
}

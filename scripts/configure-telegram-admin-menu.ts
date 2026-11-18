import { telegramCall } from "../server/telegram/api";
const chat = process.env.TELEGRAM_ADMIN_CHAT_ID;
if (!chat || !/^\d{1,16}$/.test(chat)) throw Error("Admin chat sozlanmagan.");
await telegramCall("setMyCommands", {
  scope: { type: "chat", chat_id: chat },
  commands: [
    { command: "panel", description: "Admin boshqaruvi" },
    { command: "check", description: "Hisob holatini tekshirish" },
    { command: "help", description: "Qo‘llanma" },
  ],
});
console.log("Faqat admin chat uchun bot menyusi yangilandi.");

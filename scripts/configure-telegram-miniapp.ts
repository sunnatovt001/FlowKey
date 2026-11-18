import { telegramCall } from "../server/telegram/api";
if (!process.env.TELEGRAM_BOT_TOKEN) throw new Error("TELEGRAM_BOT_TOKEN kerak.");
const base = new URL(process.env.APP_URL || "https://flowkey.uz");
if (base.protocol !== "https:") throw new Error("Mini App uchun HTTPS kerak.");
await telegramCall("setChatMenuButton", { menu_button: { type: "web_app", text: "FlowKey Business", web_app: { url: new URL("/miniapp", base).href } } });
console.log("FlowKey Business Mini App bot menyusiga ulandi.");

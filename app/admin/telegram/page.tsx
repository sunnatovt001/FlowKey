import { requireAdminPage } from "@/server/admin";
import { telegramAdminStatus } from "@/server/telegram/admin-access";
import { AdminTelegram } from "@/components/admin-telegram";
export default async function TelegramAdminPage() {
  const user = await requireAdminPage();
  const state = await telegramAdminStatus(user.id);
  const username = process.env.TELEGRAM_BOT_USERNAME?.replace(/^@/, "") || "";
  return (
    <>
      <h1>Telegram admin</h1>
      <AdminTelegram
        linked={state.linked}
        expiresAt={state.expiresAt?.toISOString() || null}
        botUsername={/^[A-Za-z0-9_]{5,32}$/.test(username) ? username : null}
      />
    </>
  );
}

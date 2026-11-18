import { db } from "@/server/db";
import {aiConfigured} from "@/server/telegram/ai-config";
import { requireUser } from "@/server/auth";
import { handle, limit, sameOrigin } from "@/server/http";
import { createLink, unlinkAccount } from "@/server/telegram/link";
export async function GET() {
  return handle(async () => {
    const user = await requireUser();
    const connection = await db.telegramConnection.findUnique({
      where: { userId: user.id },
      select: { linkedAt: true },
    });
    return {
      linked: !!connection,
      linkedAt: connection?.linkedAt || null,
      botUsername: process.env.TELEGRAM_BOT_USERNAME?.replace(/^@/, "") || null,
      botConfigured: !!process.env.TELEGRAM_BOT_TOKEN,
      aiConfigured: aiConfigured(),
      adminConfigured: !!process.env.TELEGRAM_ADMIN_CHAT_ID,
    };
  });
}
export async function POST(req: Request) {
  return handle(async () => {
    sameOrigin(req);
    const user = await requireUser();
    await limit(`telegram-link-create:${user.id}`, 5);
    return createLink(user.id);
  });
}
export async function DELETE(req: Request) {
  return handle(async () => {
    sameOrigin(req);
    const user = await requireUser();
    await limit(`telegram-unlink:${user.id}`, 10);
    await unlinkAccount(user.id);
    return { ok: true };
  });
}

import { requireAdmin } from "@/server/admin";
import { handle, limit, sameOrigin } from "@/server/http";
import { setTelegramAdminSession } from "@/server/telegram/admin-access";
async function set(req: Request, enabled: boolean) {
  return handle(async () => {
    sameOrigin(req);
    const user = await requireAdmin();
    await limit(`telegram-admin-grant:${user.id}`, 10);
    return setTelegramAdminSession(user.id, enabled);
  });
}
export async function POST(req: Request) {
  return set(req, true);
}
export async function DELETE(req: Request) {
  return set(req, false);
}

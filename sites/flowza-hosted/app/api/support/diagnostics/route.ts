import { requireUser } from "@/server/auth";
import { handle, limit } from "@/server/http";
import { accountContext } from "@/server/telegram/context";
export async function GET() {
  return handle(async () => {
    const user = await requireUser();
    await limit(`diagnostics:${user.id}`, 20);
    const context = await accountContext(user.id);
    return { checkedAt: context.checkedAt, findings: context.findings };
  });
}

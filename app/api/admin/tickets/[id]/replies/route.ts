import { z } from "zod";
import { requireAdmin } from "@/server/admin";
import { body, handle, limit, sameOrigin } from "@/server/http";
import { replyToTicket } from "@/server/support-replies";
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  return handle(async () => {
    sameOrigin(req);
    const user = await requireAdmin();
    await limit(`admin-reply:${user.id}`, 20);
    const input = z
      .object({
        content: z.string().trim().min(2).max(2000),
        requestKey: z.string().uuid(),
      })
      .strict()
      .parse(await body(req));
    return replyToTicket(
      user.id,
      (await params).id,
      input.content,
      input.requestKey,
    );
  });
}

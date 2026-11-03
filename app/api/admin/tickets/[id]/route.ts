import { z } from "zod";
import { requireAdmin, updateAdminTicket } from "@/server/admin";
import { body, handle, limit, sameOrigin } from "@/server/http";
const input = z
  .object({
    status: z.enum(["open", "in_progress", "resolved"]),
    expectedStatus: z.enum(["open", "in_progress", "resolved"]),
  })
  .strict();
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  return handle(async () => {
    sameOrigin(req);
    const user = await requireAdmin();
    await limit(`admin-write:${user.id}`, 30);
    const data = input.parse(await body(req));
    const { id } = await params;
    return updateAdminTicket(user.id, id, data.status, data.expectedStatus);
  });
}

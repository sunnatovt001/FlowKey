import { apiProject } from "@/server/auth";
import { handle, limit } from "@/server/http";
import { db } from "@/server/db";
import { ApiError } from "@/server/security";
import { serializePayment } from "@/server/payments";
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  return handle(async () => {
    const projectId = await apiProject(req);
    await limit(`api:${projectId}`, 120);
    const { id } = await params;
    const t = await db.transaction.findFirst({ where: { id, projectId } });
    if (!t) throw new ApiError(404, "To‘lov topilmadi.");
    return serializePayment(t);
  });
}

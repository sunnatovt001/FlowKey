import { apiProject } from "@/server/auth";
import { body, handle, limit } from "@/server/http";
import { createPayment } from "@/server/payments";
export async function POST(req: Request) {
  return handle(async () => {
    const projectId = await apiProject(req);
    await limit(`api:${projectId}`, 120);
    return createPayment(
      projectId,
      await body(req),
      req.headers.get("idempotency-key"),
    );
  });
}

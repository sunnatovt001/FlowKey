import { apiProject } from "@/server/auth";
import { body, handle, limit } from "@/server/http";
import { newSession } from "@/server/checkout";
export async function POST(req: Request) {
  return handle(async () => {
    const projectId = await apiProject(req);
    await limit(`checkout-create:${projectId}`, 60);
    return newSession(projectId, await body(req), req.headers.get("idempotency-key"));
  });
}

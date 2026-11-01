import { requireUser, requireProject } from "@/server/auth";
import { body, handle, limit, sameOrigin } from "@/server/http";
import { createLink, disableLink } from "@/server/checkout";
import { ApiError } from "@/server/security";
type Context = { params: Promise<{ projectId: string }> };
export async function POST(req: Request, { params }: Context) {
  return handle(async () => {
    sameOrigin(req);
    const user = await requireUser();
    const { projectId } = await params;
    await requireProject(projectId, user.id);
    await limit(`links:${user.id}`, 20);
    return createLink(projectId, await body(req));
  });
}
export async function DELETE(req: Request, { params }: Context) {
  return handle(async () => {
    sameOrigin(req);
    const user = await requireUser();
    const { projectId } = await params;
    await requireProject(projectId, user.id);
    const input = await body(req) as { id?: unknown };
    if (typeof input.id !== "string") throw new ApiError(400, "Havola ID’si kerak.");
    return disableLink(projectId, input.id);
  });
}

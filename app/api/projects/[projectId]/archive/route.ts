import { db } from "@/server/db";
import { requireUser, requireProject } from "@/server/auth";
import { handle, limit, sameOrigin } from "@/server/http";
export async function POST(
  req: Request,
  context: { params: Promise<{ projectId: string }> },
) {
  return handle(async () => {
    sameOrigin(req);
    const user = await requireUser();
    const { projectId } = await context.params;
    await requireProject(projectId, user.id);
    await limit(`write:${user.id}`);
    await db.$transaction(async (tx) => {
      await tx.project.update({
        where: { id: projectId },
        data: { archivedAt: new Date() },
      });
      await tx.apiKey.updateMany({
        where: { projectId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
      await tx.webhookEndpoint.updateMany({
        where: { projectId, disabledAt: null },
        data: { disabledAt: new Date() },
      });
      await tx.auditLog.create({
        data: {
          projectId,
          actorId: user.id,
          action: "project.archived",
          resourceId: projectId,
        },
      });
    });
    return { ok: true };
  });
}

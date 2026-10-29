import { db } from "@/server/db";
import { requireProject, requireUser } from "@/server/auth";
import { body, handle, limit, sameOrigin } from "@/server/http";
import { onboarding } from "@/server/validators";
export async function PATCH(
  req: Request,
  context: { params: Promise<{ projectId: string }> },
) {
  return handle(async () => {
    sameOrigin(req);
    const user = await requireUser();
    const { projectId } = await context.params;
    await requireProject(projectId, user.id);
    await limit(`write:${user.id}`);
    const input = onboarding
      .pick({ projectName: true, website: true, description: true })
      .parse(await body(req));
    return db.$transaction(async (tx) => {
      const project = await tx.project.update({
        where: { id: projectId },
        data: {
          name: input.projectName,
          website: input.website || null,
          description: input.description || null,
        },
      });
      await tx.auditLog.create({
        data: {
          projectId,
          actorId: user.id,
          action: "project.updated",
          resourceId: projectId,
        },
      });
      return project;
    });
  });
}

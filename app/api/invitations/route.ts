import { z } from "zod";
import { db } from "@/server/db";
import { requireUser } from "@/server/auth";
import { body, handle, sameOrigin, limit } from "@/server/http";
import { ApiError } from "@/server/security";
export async function POST(req: Request) {
  return handle(async () => {
    sameOrigin(req);
    const user = await requireUser();
    await limit(`invite-accept:${user.id}`, 20);
    const data = z
      .object({ id: z.string().max(128), accept: z.boolean() })
      .parse(await body(req));
    return db.$transaction(async (tx) => {
      // Conditional update serializes accept/revoke without widening an expired invitation.
      const changed = await tx.projectInvite.updateMany({
        where: {
          id: data.id,
          email: user.email.toLowerCase(),
          status: "pending",
          expiresAt: { gt: new Date() },
        },
        data: { status: data.accept ? "accepted" : "declined" },
      });
      if (!changed.count)
        throw new ApiError(
          409,
          "Taklif muddati tugagan yoki allaqachon ko‘rib chiqilgan.",
        );
      const invite = await tx.projectInvite.findUniqueOrThrow({
        where: { id: data.id },
      });
      const project = await tx.project.findUnique({
        where: { id: invite.projectId },
      });
      if (!project || project.archivedAt)
        throw new ApiError(409, "Loyiha faol emas.");
      if (data.accept)
        await tx.membership.upsert({
          where: {
            userId_projectId: { userId: user.id, projectId: project.id },
          },
          create: { userId: user.id, projectId: project.id, role: invite.role },
          update: {},
        });
      await tx.auditLog.create({
        data: {
          projectId: project.id,
          actorId: user.id,
          action: data.accept ? "team.accepted" : "team.declined",
          resourceId: invite.id,
        },
      });
      return { ok: true, projectId: project.id };
    });
  });
}

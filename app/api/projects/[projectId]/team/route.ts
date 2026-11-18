import { z } from "zod";
import { db } from "@/server/db";
import { requireUser } from "@/server/auth";
import { projectAccess } from "@/server/project-access";
import { body, handle, sameOrigin, limit } from "@/server/http";
import { ApiError } from "@/server/security";
type Context = { params: Promise<{ projectId: string }> };
const input = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("invite"),
    email: z
      .email()
      .max(254)
      .transform((v) => v.toLowerCase()),
    role: z.enum(["developer", "accountant"]),
  }),
  z.object({ action: z.literal("remove"), userId: z.string().max(128) }),
  z.object({ action: z.literal("revoke"), id: z.string().max(128) }),
]);
export async function POST(req: Request, { params }: Context) {
  return handle(async () => {
    sameOrigin(req);
    const user = await requireUser();
    const { projectId } = await params;
    await projectAccess(projectId, user.id, "owner");
    await limit(`team:${user.id}`, 20);
    const data = input.parse(await body(req));
    return db.$transaction(async (tx) => {
      if (data.action === "invite") {
        if (data.email === user.email.toLowerCase())
          throw new ApiError(400, "O‘zingizni taklif qila olmaysiz.");
        if (
          await tx.membership.findFirst({
            where: { projectId, user: { email: data.email } },
            select: { userId: true },
          })
        )
          throw new ApiError(409, "Bu foydalanuvchi allaqachon loyiha a’zosi.");
        const invite = await tx.projectInvite.upsert({
          where: { projectId_email: { projectId, email: data.email } },
          create: {
            projectId,
            email: data.email,
            role: data.role,
            expiresAt: new Date(Date.now() + 7 * 86400000),
          },
          update: {
            role: data.role,
            status: "pending",
            expiresAt: new Date(Date.now() + 7 * 86400000),
          },
        });
        await tx.auditLog.create({
          data: {
            projectId,
            actorId: user.id,
            action: "team.invited",
            resourceId: invite.id,
          },
        });
      } else if (data.action === "remove") {
        const count = await tx.membership.deleteMany({
          where: {
            projectId,
            userId: data.userId,
            role: { in: ["developer", "accountant"] },
          },
        });
        if (!count.count)
          throw new ApiError(404, "O‘chiriladigan a’zo topilmadi.");
        await tx.auditLog.create({
          data: {
            projectId,
            actorId: user.id,
            action: "team.removed",
            resourceId: data.userId,
          },
        });
      } else {
        const count = await tx.projectInvite.updateMany({
          where: { id: data.id, projectId, status: "pending" },
          data: { status: "revoked" },
        });
        if (!count.count) throw new ApiError(404, "Faol taklif topilmadi.");
        await tx.auditLog.create({
          data: {
            projectId,
            actorId: user.id,
            action: "team.invite_revoked",
            resourceId: data.id,
          },
        });
      }
      return { ok: true };
    });
  });
}

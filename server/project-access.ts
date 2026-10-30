import { db } from "./db";
import { ApiError } from "./security";
import { roleAllows } from "../shared/project-role";
export async function projectAccess(
  projectId: string,
  userId: string,
  scope: "read" | "technical" | "finance" | "owner" = "read",
) {
  const member = await db.membership.findUnique({
    where: { userId_projectId: { userId, projectId } },
    include: { project: { include: { business: true } } },
  });
  if (!member || member.project.archivedAt)
    throw new ApiError(404, "Faol loyiha topilmadi.");
  // An owner membership alone cannot transfer the business's ownership.
  if (member.role === "owner" && member.project.business.ownerId !== userId)
    throw new ApiError(403, "Loyiha egasi mos emas.");
  if (!roleAllows(member.role, scope))
    throw new ApiError(403, "Bu amal uchun huquqingiz yetarli emas.");
  return member;
}

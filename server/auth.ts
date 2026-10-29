import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "./db";
import { auth } from "./auth-instance";
import { ApiError, hash } from "./security";
export async function currentUser() {
  const session = await auth.api.getSession({ headers: await headers() });
  return session
    ? db.user.findUnique({ where: { id: session.user.id } })
    : null;
}
export async function requireUser() {
  const user = await currentUser();
  if (!user) throw new ApiError(401, "Hisobga kiring.");
  if (!user.emailVerified)
    throw new ApiError(403, "Davom etishdan oldin elektron pochtangizni tasdiqlang.");
  return user;
}
export async function pageUser() {
  const user = await currentUser();
  if (!user) redirect("/login");
  if (!user.emailVerified) redirect("/login?mode=verify");
  return user;
}
export async function requireProject(
  projectId: string,
  userId: string,
  active = true,
) {
  const member = await db.membership.findUnique({
    where: { userId_projectId: { userId, projectId } },
    include: { project: { include: { business: true } } },
  });
  if (
    !member ||
    member.role !== "owner" ||
    member.project.business.ownerId !== userId
  )
    throw new ApiError(404, "Loyiha topilmadi.");
  if (active && member.project.archivedAt)
    throw new ApiError(409, "Bu loyiha arxivlangan.");
  return member.project;
}
export async function apiProject(req: Request) {
  const token = req.headers.get("authorization")?.replace(/^Bearer /, "");
  if (!token?.startsWith("fz_test_"))
    throw new ApiError(401, "Sinov muhitining Bearer API kaliti kerak.");
  const key = await db.apiKey.findUnique({
    where: { secretHash: hash(token) },
    include: {
      project: { include: { business: { include: { owner: true } } } },
    },
  });
  if (
    !key ||
    key.revokedAt ||
    key.project.archivedAt ||
    !key.project.business.owner.emailVerified
  )
    throw new ApiError(401, "Sinov kaliti noto‘g‘ri, bekor qilingan yoki loyiha arxivlangan.");
  await db.apiKey.update({
    where: { id: key.id },
    data: { lastUsedAt: new Date() },
  });
  return key.projectId;
}

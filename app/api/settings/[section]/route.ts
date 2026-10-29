import { z } from "zod";
import { db } from "@/server/db";
import { requireUser } from "@/server/auth";
import { body, handle, limit, sameOrigin } from "@/server/http";
import { ApiError } from "@/server/security";
import { onboarding } from "@/server/validators";
type Context = { params: Promise<{ section: string }> };
export async function GET(_req: Request, { params }: Context) {
  return handle(async () => {
    const user = await requireUser();
    const { section } = await params;
    if (section === "profile")
      return { id: user.id, name: user.name, email: user.email };
    if (section === "business")
      return db.business.findUnique({ where: { ownerId: user.id } });
    if (section === "sessions")
      return db.session.findMany({
        where: { userId: user.id, expiresAt: { gt: new Date() } },
        select: { id: true, userAgent: true, createdAt: true, expiresAt: true },
      });
    throw new ApiError(404, "Bo‘lim topilmadi.");
  });
}
export async function POST(req: Request, { params }: Context) {
  return handle(async () => {
    sameOrigin(req);
    const user = await requireUser();
    await limit(`write:${user.id}`);
    if ((await params).section !== "sessions")
      throw new ApiError(404, "Bo‘lim topilmadi.");
    const { id } = z
      .object({ id: z.string().min(1).max(100) })
      .parse(await body(req));
    await db.session.deleteMany({ where: { id, userId: user.id } });
    return { ok: true };
  });
}
export async function PATCH(req: Request, { params }: Context) {
  return handle(async () => {
    sameOrigin(req);
    const user = await requireUser();
    await limit(`write:${user.id}`);
    const { section } = await params;
    const input = await body(req);
    if (section === "profile") {
      const data = z
        .object({ name: z.string().trim().min(2).max(100) })
        .parse(input);
      await db.user.update({ where: { id: user.id }, data });
      return { ok: true };
    }
    if (section === "business") {
      const data = onboarding
        .pick({ businessName: true, businessType: true })
        .parse(input);
      await db.business.update({
        where: { ownerId: user.id },
        data: { name: data.businessName, type: data.businessType },
      });
      return { ok: true };
    }
    throw new ApiError(404, "Bo‘lim topilmadi.");
  });
}

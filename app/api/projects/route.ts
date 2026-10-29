import { db } from "@/server/db";
import { requireUser } from "@/server/auth";
import { body, handle, limit, sameOrigin } from "@/server/http";
import { onboarding } from "@/server/validators";
import { hash, secret, ApiError } from "@/server/security";
export async function GET() {
  return handle(async () => {
    const user = await requireUser();
    return db.project.findMany({
      where: { business: { ownerId: user.id } },
      orderBy: { createdAt: "asc" },
    });
  });
}
export async function POST(req: Request) {
  return handle(async () => {
    sameOrigin(req);
    const user = await requireUser();
    await limit(`write:${user.id}`);
    const input = onboarding
      .pick({ projectName: true, website: true, description: true })
      .parse(await body(req));
    const business = await db.business.findUnique({
      where: { ownerId: user.id },
    });
    if (!business)
      throw new ApiError(409, "Avval boshlang‘ich sozlashni yakunlang.");
    const fullSecret = secret("fz_test_");
    return db.$transaction(async (tx) => {
      const project = await tx.project.create({
        data: {
          businessId: business.id,
          name: input.projectName,
          website: input.website || null,
          description: input.description || null,
          memberships: { create: { userId: user.id } },
        },
      });
      await tx.apiKey.create({
        data: {
          projectId: project.id,
          name: "Birinchi Unit kaliti",
          prefix: fullSecret.slice(0, 16),
          secretHash: hash(fullSecret),
        },
      });
      await tx.auditLog.create({
        data: {
          projectId: project.id,
          actorId: user.id,
          action: "project.created",
          resourceId: project.id,
        },
      });
      return { ...project, secret: fullSecret };
    });
  });
}

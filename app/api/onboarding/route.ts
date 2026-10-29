import { db } from "@/server/db";
import { requireUser } from "@/server/auth";
import { body, handle, limit, sameOrigin } from "@/server/http";
import { onboarding } from "@/server/validators";
export async function GET() {
  return handle(async () => {
    const user = await requireUser();
    const draft = await db.onboardingDraft.findUnique({
      where: { userId: user.id },
    });
    return { values: draft?.values || null };
  });
}
export async function PUT(req: Request) {
  return handle(async () => {
    sameOrigin(req);
    const user = await requireUser();
    await limit(`draft:${user.id}`, 120);
    const values = onboarding.partial().parse(await body(req));
    await db.onboardingDraft.upsert({
      where: { userId: user.id },
      create: { userId: user.id, values },
      update: { values },
    });
    return { ok: true };
  });
}
export async function POST(req: Request) {
  return handle(async () => {
    sameOrigin(req);
    const user = await requireUser();
    await limit(`onboard:${user.id}`, 10);
    const data = onboarding
      .pick({ businessName: true, businessType: true })
      .parse(await body(req));
    const business = await db.business.upsert({
      where: { ownerId: user.id },
      update: {},
      create: {
        ownerId: user.id,
        name: data.businessName,
        type: data.businessType,
      },
      include: { projects: true },
    });
    await db.onboardingDraft.deleteMany({ where: { userId: user.id } });
    return {
      project: business.projects[0] || null,
      redirect: business.projects.length
        ? "/dashboard"
        : "/settings?welcome=1#create-project",
    };
  });
}

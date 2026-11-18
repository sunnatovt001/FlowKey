import { redirect } from "next/navigation";
import { pageUser } from "@/server/auth";
import { db } from "@/server/db";
import { SetupWizard } from "@/components/setup-wizard";
import "@/styles/project-setup.css";
export const metadata = { title: "Loyiha yaratish" };
export default async function NewProject() {
  const user = await pageUser();
  const business = await db.business.findUnique({
    where: { ownerId: user.id },
    select: { name: true, type: true },
  });
  if (!business) redirect("/onboarding");
  const existing = await db.project.findFirst({
    where: { business: { ownerId: user.id }, archivedAt: null },
    select: { id: true },
  });
  return (
    <SetupWizard
      initial={business}
      initialStep={2}
      existing={!!existing}
      avatar={(user.name || user.email).slice(0, 1).toUpperCase()}
    />
  );
}

import { redirect } from "next/navigation";
import { pageUser } from "@/server/auth";
import { db } from "@/server/db";
import { SetupWizard } from "@/components/setup-wizard";
import "@/styles/project-setup.css";
export const metadata = { title: "Boshlang‘ich sozlash" };
export default async function Onboarding({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string }>;
}) {
  const user = await pageUser();
  const business = await db.business.findUnique({
    where: { ownerId: user.id },
    include: { projects: { where: { archivedAt: null }, take: 1 } },
  });
  const edit = (await searchParams).edit === "1";
  if (business?.projects.length && !edit) redirect("/dashboard");
  return (
    <SetupWizard
      initial={
        business ? { name: business.name, type: business.type } : undefined
      }
      initialStep={business && !edit ? 2 : 1}
      avatar={(user.name || user.email).slice(0, 1).toUpperCase()}
    />
  );
}

import { roleAllows } from "@/shared/project-role";
import { notFound } from "next/navigation";
import { workspace, type Search } from "@/server/workspace";
import { SubscriptionsSection } from "@/components/subscriptions-section";
export const metadata = { title: "Obunalar" };
export default async function Subscriptions({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  const { project, role } = await workspace(await searchParams);
  if (!roleAllows(role, "technical")) notFound();
  return (
    <>
      <SubscriptionsSection projectId={project.id} role={role} />
    </>
  );
}

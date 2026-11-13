import { roleAllows } from "@/shared/project-role";
import { notFound } from "next/navigation";
import { workspace, type Search } from "@/server/workspace";
import { FinanceSection } from "@/components/finance-section";
import Link from "next/link";
export const metadata = { title: "Mablag‘lar" };
export default async function Finance({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  const { project, role } = await workspace(await searchParams);
  if (!roleAllows(role, "finance")) notFound();
  return (
    <>
      <Link
        className="text-link"
        href={`/testing?project=${project.id}&area=finance`}
      >
        Sinov markazini ochish →
      </Link>
      <FinanceSection projectId={project.id} role={role} />
    </>
  );
}

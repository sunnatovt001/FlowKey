import { workspace, type Search } from "@/server/workspace";
import { integrationData } from "@/server/integration-data";
import { IntegrationChooser } from "@/components/integration-chooser";
import { roleAllows } from "@/shared/project-role";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { BookOpen } from "lucide-react";
export const metadata = { title: "Integratsiya" };
export default async function Developers({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  const search = await searchParams;
  const { project, role } = await workspace(search);
  if (!roleAllows(role, "technical")) notFound();
  if (search.tab === "sandbox")
    redirect(`/testing?project=${project.id}&area=payments`);
  const data = await integrationData(project.id);
  return (
    <>
      <div className="page-heading">
        <h1>Integratsiya</h1>
        <Link className="text-link" href={`/guide?project=${project.id}`}>
          <BookOpen size={17} />
          Qo‘llanmani ochish
        </Link>
      </div>
      <IntegrationChooser
        key={`${project.id}:${String(search.tab || "keys")}`}
        {...data}
      />
    </>
  );
}

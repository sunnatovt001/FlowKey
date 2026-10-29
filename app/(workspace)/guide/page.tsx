import { Documentation } from "@/components/documentation";
import { Search } from "@/server/workspace";
export const metadata = { title: "Qo‘llanma" };
export default async function Guide({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  const search = await searchParams;
  const projectId = typeof search.project === "string" ? search.project : "";
  return (
    <div className="workspace-docs">
      <Documentation workspace projectId={projectId} />
    </div>
  );
}

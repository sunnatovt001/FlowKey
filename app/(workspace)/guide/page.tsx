import { Documentation } from "@/components/documentation";
import { Search } from "@/server/workspace";
import { pageUser } from "@/server/auth";
import { db } from "@/server/db";
import { notFound } from "next/navigation";
export const metadata = { title: "Qo‘llanma" };
export default async function Guide({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  const search = await searchParams;
  const requested = typeof search.project === "string" ? search.project : "";
  const user = await pageUser();
  const membership = await db.membership.findFirst({
    where: {
      userId: user.id,
      project: { archivedAt: null },
      ...(requested ? { projectId: requested } : {}),
    },
    select: { projectId: true, role: true },
    orderBy: { project: { createdAt: "asc" } },
  });
  if (requested && !membership) notFound();
  const projectId = membership?.projectId || "";
  return (
    <div className="workspace-docs">
      <Documentation
        workspace
        projectId={projectId}
        role={membership?.role || "owner"}
      />
    </div>
  );
}

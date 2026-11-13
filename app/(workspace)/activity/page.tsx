import { workspace, type Search } from "@/server/workspace";
import { notFound } from "next/navigation";
import { db } from "@/server/db";
import { ActivityHub } from "@/components/activity-hub";
async function snapshotTime() { return Date.now(); }
export const metadata = { title: "Hodisalar" };
export default async function Activity({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  const { project, role } = await workspace(await searchParams);
  if (role !== "owner") notFound();
  const rows = await db.auditLog.findMany({
    where: { projectId: project.id },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: 201,
    select: { id: true, action: true, resourceId: true, createdAt: true },
  });
  return (
    <>
      <div className="page-heading">
        <h1>Hodisalar</h1>
      </div>
      <ActivityHub
        rows={rows
          .slice(0, 200)
          .map((row) => ({ ...row, createdAt: row.createdAt.toISOString() }))}
        limited={rows.length > 200}
        now={await snapshotTime()}
      />
    </>
  );
}

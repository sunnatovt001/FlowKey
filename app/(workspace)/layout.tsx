import { pageUser } from "@/server/auth";
import { db } from "@/server/db";
import { AppShell } from "@/components/app-shell";
export default async function WorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await pageUser();
  const projects = await db.project.findMany({
    where: {
      business: { ownerId: user.id },
      archivedAt: null,
      memberships: { some: { userId: user.id, role: "owner" } },
    },
    select: { id: true, name: true },
    orderBy: { createdAt: "asc" },
  });
  return (
    <AppShell projects={projects} email={user.email}>
      {children}
    </AppShell>
  );
}

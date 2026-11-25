import "@/styles/workspace-review.css";
import { pageUser } from "@/server/auth";
import { db } from "@/server/db";
import { AppShell } from "@/components/app-shell";
import { isPlatformAdmin } from "@/server/admin-access";
export default async function WorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await pageUser();
  const projects = await db.project.findMany({
    where: {
      archivedAt: null,
      memberships: { some: { userId: user.id } },
    },
    select: {
      id: true,
      name: true,
      memberships: { where: { userId: user.id }, select: { role: true } },
    },
    orderBy: { createdAt: "asc" },
  });
  return (
    <AppShell
      projects={projects.map((p) => ({
        id: p.id,
        name: p.name,
        role: p.memberships[0]?.role || "",
      }))}
      email={user.email}
      isAdmin={isPlatformAdmin(user.id)}
    >
      {children}
    </AppShell>
  );
}

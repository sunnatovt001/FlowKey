import { redirect } from "next/navigation";
import { pageUser } from "./auth";
import { db } from "./db";
import { notFound } from "next/navigation";
export type Search = { [key: string]: string | string[] | undefined };
export async function workspace(search: Search, allowArchivedHistory = false) {
  const user = await pageUser();
  const requested =
    typeof search.project === "string" ? search.project : undefined;
  const memberships = await db.membership.findMany({
    where: {
      userId: user.id,
      project: {
        ...(allowArchivedHistory && requested
          ? { OR: [{ archivedAt: null }, { id: requested }] }
          : { archivedAt: null }),
      },
    },
    include: { project: true },
    orderBy: { project: { createdAt: "asc" } },
  });
  if (!memberships.length) {
    const business = await db.business.findUnique({
      where: { ownerId: user.id },
    });
    redirect(business ? "/projects/new" : "/onboarding");
  }
  const available = memberships.map((m) => m.project);
  const projects = available.filter((project) => !project.archivedAt);
  const selected = requested || projects[0]?.id;
  const project = available.find((p) => p.id === selected);
  if (!project) notFound();
  return {
    user,
    projects,
    project,
    role: memberships.find((m) => m.projectId === project.id)!.role,
  };
}

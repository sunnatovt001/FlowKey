import { redirect } from "next/navigation";
import { pageUser } from "./auth";
import { db } from "./db";
import { notFound } from "next/navigation";
export type Search = { [key: string]: string | string[] | undefined };
export async function workspace(search: Search) {
  const user = await pageUser();
  const memberships = await db.membership.findMany({
    where: { userId: user.id, role: "owner", project: { archivedAt: null, business: { ownerId: user.id } } },
    include: { project: true },
    orderBy: { project: { createdAt: "asc" } },
  });
  if (!memberships.length) { const business=await db.business.findUnique({where:{ownerId:user.id}}); redirect(business ? "/settings?empty=1#create-project" : "/onboarding"); }
  const projects = memberships.map((m) => m.project);
  const selected =
    typeof search.project === "string" && search.project ? search.project : projects[0].id;
  const project = projects.find((p) => p.id === selected);
  if (!project) notFound();
  return { user, projects, project };
}

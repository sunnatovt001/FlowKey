import { db } from "@/server/db";
import { Search } from "@/server/workspace";

import { SettingsForm } from "@/components/settings-form";
import { pageUser } from "@/server/auth";
export const metadata = { title: "Sozlamalar" };
export default async function Settings({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  await searchParams;
  const user = await pageUser();
  const business = await db.business.findUnique({
    where: { ownerId: user.id },
  });
  const allProjects = business
    ? await db.project.findMany({
        where: { businessId: business.id },
        orderBy: { createdAt: "asc" },
      })
    : [];
  return (
    <>
      <div className="page-heading">
        <div>
          <h1>Sozlamalar</h1>
        </div>
      </div>
      <SettingsForm
        joinedAt={user.createdAt.toLocaleDateString("uz-UZ", {
          timeZone: "Asia/Tashkent",
        })}
        name={user.name}
        email={user.email}
        business={business}
        projects={allProjects.map((project) => ({
          id: project.id,
          name: project.name,
          website: project.website,
          description: project.description,
          archivedAt: project.archivedAt?.toISOString() || null,
        }))}
      />
    </>
  );
}

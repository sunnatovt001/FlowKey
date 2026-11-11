import { businessLabel } from "@/shared/locale";
import { db } from "@/server/db";
import { Search } from "@/server/workspace";

import { SettingsForm } from "@/components/settings-form";
import { pageUser } from "@/server/auth";
import { redirect } from "next/navigation";
export const metadata = { title: "Hisob sozlamalari" };
export default async function Settings({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  const search = await searchParams;
  const user = await pageUser();
  const business = await db.business.findUnique({
    where: { ownerId: user.id },
  });
  if (!business) redirect("/onboarding");
  const allProjects = await db.project.findMany({
    where: { businessId: business.id },
    orderBy: { createdAt: "asc" },
  });
  if (!allProjects.length) redirect("/projects/new");
  const projects = allProjects.filter((project) => !project.archivedAt);
  const project =
    allProjects.find((p) => p.id === search.project) ||
    projects[0] ||
    allProjects[0];
  return (
    <>
      <div className="page-heading">
        <div>
          <h1>Hisob sozlamalari</h1>
        </div>
      </div>
      {user.email.endsWith("@telegram.flowkey.invalid") && <p className="notice">Bu hisob Telegram orqali yaratilgan. Elektron pochta ulanmagan; qayta kirish uchun Telegram tugmasidan foydalaning.</p>}
      <SettingsForm
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
      {project && (
        <section className="panel settings-panel">
          <h2>Hisob</h2>
          <dl className="detail-list">
            <div>
              <dt>Elektron pochta</dt>
              <dd>{user.email.endsWith("@telegram.flowkey.invalid") ? "Ulanmagan · Telegram orqali kirish" : user.email}</dd>
            </div>
            <div>
              <dt>Ro‘yxatdan o‘tgan sana</dt>
              <dd>
                {user.createdAt.toLocaleDateString("uz-UZ", {
                  timeZone: "Asia/Tashkent",
                })}
              </dd>
            </div>
            <div>
              <dt>Mahsulot</dt>
              <dd>{business.name}</dd>
            </div>
            <div>
              <dt>Mahsulot turi</dt>
              <dd>{businessLabel(business.type)}</dd>
            </div>
          </dl>
          <h2>Tanlangan loyiha</h2>
          <dl className="detail-list">
            <div>
              <dt>Nomi</dt>
              <dd>{project.name}</dd>
            </div>
            <div>
              <dt>Loyiha ID’si</dt>
              <dd>{project.id}</dd>
            </div>
            <div>
              <dt>Veb-sayt</dt>
              <dd>{project.website || "Kiritilmagan"}</dd>
            </div>

            <div>
              <dt>Muhit</dt>
              <dd>Faqat sinov</dd>
            </div>
            <div>
              <dt>Haqiqiy to‘lovlar</dt>
              <dd>Ulanmagan</dd>
            </div>
          </dl>
          <p className="panel-note">
            Sessiya 7 kundan so‘ng tugaydi. Parolingizni ishonchli parol
            menejerida saqlang.
          </p>
        </section>
      )}
    </>
  );
}

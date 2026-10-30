import { pageUser } from "@/server/auth";
import { db } from "@/server/db";
import { OperationForm } from "@/components/operation-form";
import Link from "next/link";
export const metadata = { title: "Loyiha takliflari" };
export default async function Invitations() {
  const user = await pageUser();
  const invites = await db.projectInvite.findMany({
    where: {
      email: user.email.toLowerCase(),
      status: "pending",
      expiresAt: { gt: new Date() },
    },
  });
  const projects = await db.project.findMany({
    where: { id: { in: invites.map((i) => i.projectId) }, archivedAt: null },
    select: { id: true, name: true },
  });
  const active = invites.filter((i) =>
    projects.some((p) => p.id === i.projectId),
  );
  return (
    <main className="invitations-page">
      <Link href="/dashboard">Kabinetga qaytish</Link>
      <h1>Loyiha takliflari</h1>
      <p>
        {user.email} uchun takliflar. Qabul qilish loyiha ma’lumotlariga
        ko‘rsatilgan rol bo‘yicha kirish imkonini beradi.
      </p>
      {active.map((i) => (
        <section className="panel operation-panel" key={i.id}>
          <h2>{projects.find((p) => p.id === i.projectId)?.name}</h2>
          <p>Rol: {i.role === "developer" ? "Dasturchi" : "Buxgalter"}</p>
          <div className="operation-actions">
            <OperationForm
              endpoint="/api/invitations"
              action="accept"
              fixed={{ id: i.id, accept: true }}
              label="Qabul qilish"
            />
            <OperationForm
              endpoint="/api/invitations"
              action="decline"
              fixed={{ id: i.id, accept: false }}
              label="Rad etish"
            />
          </div>
        </section>
      ))}
      {!active.length && <p>Hozircha faol taklif yo‘q.</p>}
    </main>
  );
}

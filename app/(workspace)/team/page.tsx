import { workspace, type Search } from "@/server/workspace";
import { notFound } from "next/navigation";
import { db } from "@/server/db";
import { OperationForm } from "@/components/operation-form";
import { TeamActions, TeamDirectory, TeamInvite } from "@/components/team-controls";
import "@/styles/team.css";

export const metadata = { title: "Jamoa" };
const roles: Record<string, string> = {
  owner: "Egasi",
  developer: "Dasturchi",
  accountant: "Buxgalter",
};
export default async function Team({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  const { project, role } = await workspace(await searchParams);
  if (role !== "owner") notFound();
  const [members, invites] = await Promise.all([
    db.membership.findMany({
      where: { projectId: project.id },
      include: { user: { select: { email: true, name: true } } },
      orderBy: { user: { email: "asc" } },
    }),
    db.projectInvite.findMany({
      where: {
        projectId: project.id,
        status: "pending",
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);
  const endpoint = `/api/projects/${project.id}/team`;
  const orderedMembers = [...members.filter(member => member.role === "owner"), ...members.filter(member => member.role !== "owner")];
  return (
    <div className="team-page">
      <header className="team-heading">
        <div>
          <h1>Jamoa</h1>
          <p>Loyiha a’zolari va ularning rollarini boshqaring.</p>
        </div>
        <TeamInvite>
          <OperationForm endpoint={endpoint} action="invite" label="Taklif yaratish">
            <label>
              Elektron pochta
              <input type="email" name="email" required maxLength={254} autoComplete="email" />
            </label>
            <label>
              Rol
              <select name="role">
                <option value="developer">Dasturchi</option>
                <option value="accountant">Buxgalter</option>
              </select>
            </label>
          </OperationForm>
          <p className="team-note">
            Taklif 7 kun amal qiladi. Oluvchi shu email bilan kirib,
            “Loyiha takliflari” sahifasida qabul qiladi. Email xabari yuborilmaydi.
          </p>
          <details className="team-note">
            <summary>Rollar va ruxsatlar</summary>
            <p>
              Dasturchi integratsiya, API va sinov obunalari bilan ishlaydi.
              Buxgalter moliyaviy hisobotlar va pul chiqarish arizalari bilan ishlaydi.
              Qaytarish va pul chiqarishni loyiha egasi tasdiqlaydi.
            </p>
          </details>
        </TeamInvite>
      </header>
      <TeamDirectory
        count={invites.length}
        members={
          <table className="team-table">
            <thead><tr><th scope="col">A’zo</th><th scope="col">Rol</th><th scope="col">Amallar</th></tr></thead>
            <tbody>
              {orderedMembers.map(({ user, userId, role }) => {
                const name = user.name?.trim();
                const initials = (name || user.email).split(/\s+/).slice(0, 2)
                  .map(part => Array.from(part)[0]).join("").toLocaleUpperCase("uz");
                return (
                  <tr key={userId}>
                    <td>
                      <div className="team-person">
                        <span className="team-avatar" data-owner={role === "owner"} aria-hidden="true">{initials}</span>
                        <div>
                          {name && <strong>{name}</strong>}
                          <span className={name ? "team-email" : undefined}>{user.email}</span>
                        </div>
                      </div>
                    </td>
                    <td><span className="team-role" data-owner={role === "owner"}>{roles[role] || role}</span></td>
                    <td>{role !== "owner" && (
                      <TeamActions label={`${user.email} uchun amallar`}>
                        <OperationForm endpoint={endpoint} action="remove" fixed={{ userId }} label="A’zolikni bekor qilish" />
                      </TeamActions>
                    )}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        }
        invitations={invites.length ? (
          <table className="team-table">
            <thead><tr><th scope="col">Email</th><th scope="col">Rol</th><th scope="col">Amallar</th></tr></thead>
            <tbody>{invites.map(invite => (
              <tr key={invite.id}>
                <td>{invite.email}</td>
                <td><span className="team-role">{roles[invite.role] || invite.role}</span></td>
                <td>
                  <TeamActions label={`${invite.email} taklifi uchun amallar`}>
                    <OperationForm endpoint={endpoint} action="revoke" fixed={{ id: invite.id }} label="Taklifni bekor qilish" />
                  </TeamActions>
                </td>
              </tr>
            ))}</tbody>
          </table>
        ) : <p className="team-empty">Kutilayotgan takliflar yo‘q.</p>}
      />
    </div>
  );
}

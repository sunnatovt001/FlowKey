import { workspace, type Search } from "@/server/workspace";
import { notFound } from "next/navigation";
import { db } from "@/server/db";
import { OperationForm } from "@/components/operation-form";
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
      include: { user: { select: { email: true } } },
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
  return (
    <>
      <div className="page-heading">
        <div>
          <h1>Loyiha jamoasi.</h1>
        </div>
      </div>
      <section className="panel operation-panel">
        <h2>A’zo taklif qilish</h2>
        <p className="muted">
          Taklif 7 kun amal qiladi. Xat yuborilmaydi: oluvchi shu email bilan
          kirib, “Loyiha takliflari” sahifasida qabul qiladi.
        </p>
        <OperationForm
          endpoint={endpoint}
          action="invite"
          label="Taklif yaratish"
        >
          <label>
            Elektron pochta
            <input
              type="email"
              name="email"
              required
              maxLength={254}
              autoComplete="email"
            />
          </label>
          <label>
            Rol
            <select name="role">
              <option value="developer">Dasturchi</option>
              <option value="accountant">Buxgalter</option>
            </select>
          </label>
        </OperationForm>
        <p className="panel-note">
          Dasturchi: integratsiya, API va sinov obunalari. Buxgalter: moliyaviy
          hisobot va pul chiqarish arizalari. Faqat egasi qaytarish va pul
          chiqarishni tasdiqlaydi.
        </p>
      </section>
      <section className="panel operation-panel">
        <h2>Ishtirokchilar</h2>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Email</th>
                <th>Rol</th>
                <th>Amal</th>
              </tr>
            </thead>
            <tbody>
              {members.map((m) => (
                <tr key={m.userId}>
                  <td>{m.user.email}</td>
                  <td>{roles[m.role] || m.role}</td>
                  <td>
                    {m.role !== "owner" && (
                      <OperationForm
                        endpoint={endpoint}
                        action="remove"
                        fixed={{ userId: m.userId }}
                        label="A’zolikni bekor qilish"
                      />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <section className="panel operation-panel">
        <h2>Kutilayotgan takliflar</h2>
        {invites.length ? (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Email</th>
                  <th>Rol</th>
                  <th>Amal</th>
                </tr>
              </thead>
              <tbody>
                {invites.map((i) => (
                  <tr key={i.id}>
                    <td>{i.email}</td>
                    <td>{roles[i.role]}</td>
                    <td>
                      <OperationForm
                        endpoint={endpoint}
                        action="revoke"
                        fixed={{ id: i.id }}
                        label="Taklifni bekor qilish"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="muted">Kutilayotgan takliflar yo‘q.</p>
        )}
      </section>
    </>
  );
}

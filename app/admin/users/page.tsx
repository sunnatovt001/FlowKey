import { adminUsers } from "@/server/admin";
import { AdminTime, AdminSearch, AdminPager } from "@/components/admin-ui";
export default async function Users({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const data = await adminUsers(await searchParams);
  return (
    <>
      <h1>Foydalanuvchilar</h1>
      <AdminSearch q={data.q} placeholder="Ism yoki email" />
      <section className="panel admin-panel">
        {data.rows.length ? (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Ism</th>
                  <th>Email</th>
                  <th>Tasdiqlash</th>
                  <th>Loyihalar</th>
                  <th>Ro‘yxatdan o‘tgan</th>
                </tr>
              </thead>
              <tbody>
                {data.rows.map((row) => (
                  <tr key={row.id}>
                    <td>{row.name || "—"}</td>
                    <td>{row.email}</td>
                    <td>{row.emailVerified ? "Tasdiqlangan" : "Kutilmoqda"}</td>
                    <td>
                      {row.businesses.reduce(
                        (sum, business) => sum + business._count.projects,
                        0,
                      )}
                    </td>
                    <td>
                      <AdminTime date={row.createdAt} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="admin-empty">Foydalanuvchi topilmadi.</p>
        )}
        <AdminPager {...data} path="/admin/users" />
      </section>
    </>
  );
}

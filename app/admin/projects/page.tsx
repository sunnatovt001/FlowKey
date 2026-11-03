import { adminProjects } from "@/server/admin";
import { AdminTime, AdminSearch, AdminPager } from "@/components/admin-ui";
export default async function Projects({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const data = await adminProjects(await searchParams);
  return (
    <>
      <h1>Loyihalar</h1>
      <AdminSearch
        q={data.q}
        placeholder="Loyiha nomi, ID yoki egasining emaili"
      />
      <section className="panel admin-panel">
        {data.rows.length ? (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Loyiha</th>
                  <th>Egasi</th>
                  <th>Holat</th>
                  <th>Tranzaksiyalar</th>
                  <th>A’zolar</th>
                  <th>Yaratilgan</th>
                </tr>
              </thead>
              <tbody>
                {data.rows.map((row) => (
                  <tr key={row.id}>
                    <td>
                      <strong>{row.name}</strong>
                      <code className="admin-id">{row.id}</code>
                    </td>
                    <td>{row.business.owner.email}</td>
                    <td>{row.archivedAt ? "Arxivlangan" : "Faol"}</td>
                    <td>{row._count.transactions}</td>
                    <td>{row._count.memberships}</td>
                    <td>
                      <AdminTime date={row.createdAt} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="admin-empty">Loyiha topilmadi.</p>
        )}
        <AdminPager {...data} path="/admin/projects" />
      </section>
    </>
  );
}

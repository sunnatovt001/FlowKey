import { adminAudit } from "@/server/admin";
import { ticketStates } from "@/server/admin-access";
import { AdminTime, AdminPager } from "@/components/admin-ui";
import Link from "next/link";
export default async function Audit({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const data = await adminAudit(await searchParams);
  return (
    <>
      <h1>Amallar jurnali</h1>
      <section className="panel admin-panel">
        {data.rows.length ? (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Vaqt (Toshkent)</th>
                  <th>Amal</th>
                  <th>Murojaat</th>
                  <th>Admin ID</th>
                </tr>
              </thead>
              <tbody>
                {data.rows.map((row) => {
                  const details = row.details as { from?: string; to?: string };
                  const label = (value?: string) =>
                    ticketStates[value as keyof typeof ticketStates] ||
                    value ||
                    "—";
                  return (
                    <tr key={row.id}>
                      <td>
                        <AdminTime date={row.createdAt} />
                      </td>
                      <td>
                        Holat o‘zgartirildi: {label(details.from)} →{" "}
                        {label(details.to)}
                      </td>
                      <td>
                        <Link
                          href={`/admin/tickets/${encodeURIComponent(row.targetId)}`}
                        >
                          {row.targetId}
                        </Link>
                      </td>
                      <td>
                        <code>{row.actorId}</code>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="admin-empty">Hali admin amallari yo‘q.</p>
        )}
        <AdminPager {...data} path="/admin/audit" />
      </section>
    </>
  );
}

import Link from "next/link";
import { adminOverview, adminTickets } from "@/server/admin";
import { AdminTime, TicketBadge } from "@/components/admin-ui";
export default async function AdminHome() {
  const [stats, tickets] = await Promise.all([
    adminOverview(),
    adminTickets({}),
  ]);
  return (
    <>
      <div className="admin-heading">
        <h1>Admin panel</h1>
        <Link className="button primary" href="/admin/tickets">
          Murojaatlarni ko‘rish
        </Link>
      </div>
      <div className="admin-stats">
        {[
          ["Foydalanuvchilar", stats.users, "/admin/users"],
          ["Loyihalar", stats.projects, "/admin/projects"],
          ["Yangi murojaatlar", stats.open, "/admin/tickets?state=open"],
          ["Hal qilingan", stats.resolved, "/admin/tickets?state=resolved"],
        ].map(([label, value, href]) => (
          <Link className="panel" href={String(href)} key={label}>
            <span>{label}</span>
            <strong>{value}</strong>
          </Link>
        ))}
      </div>
      <section className="panel admin-panel">
        <div className="admin-section-heading">
          <h2>Oxirgi murojaatlar</h2>
          <span>{stats.inProgress} ta ko‘rib chiqilmoqda</span>
        </div>
        {tickets.rows.length ? (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Foydalanuvchi</th>
                  <th>Muammo</th>
                  <th>Holat</th>
                  <th>Vaqt (Toshkent)</th>
                </tr>
              </thead>
              <tbody>
                {tickets.rows.slice(0, 6).map((row) => (
                  <tr key={row.id}>
                    <td>{row.user.email}</td>
                    <td>
                      <Link
                        href={`/admin/tickets/${encodeURIComponent(row.id)}`}
                      >
                        {row.summary.slice(0, 100)}
                      </Link>
                    </td>
                    <td>
                      <TicketBadge status={row.resolutionStatus} />
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
          <p className="admin-empty">Hali murojaatlar yo‘q.</p>
        )}
        {stats.failed > 0 && (
          <p className="admin-note">
            {stats.failed} ta murojaat Telegram’ga yetkazilmagan. Ularni shu
            paneldan ham ko‘rish mumkin.
          </p>
        )}
      </section>
    </>
  );
}

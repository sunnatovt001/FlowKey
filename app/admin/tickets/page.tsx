import Link from "next/link";
import { adminTickets } from "@/server/admin";
import { ticketStates } from "@/server/admin-access";
import {
  AdminTime,
  AdminSearch,
  AdminPager,
  TicketBadge,
  DeliveryBadge,
} from "@/components/admin-ui";
export default async function Tickets({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const data = await adminTickets(await searchParams);
  return (
    <>
      <h1>Murojaatlar</h1>
      <AdminSearch q={data.q} placeholder="Murojaat ID yoki email">
        <label>
          <span className="sr-only">
            Murojaatlarni holati bo‘yicha saralash
          </span>
          <select name="state" defaultValue={data.state}>
            <option value="">Barcha holatlar</option>
            {Object.entries(ticketStates).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
      </AdminSearch>
      <section className="panel admin-panel">
        {data.rows.length ? (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Muammo</th>
                  <th>Foydalanuvchi</th>
                  <th>Holat</th>
                  <th>Telegram</th>
                  <th>Yaratilgan</th>
                </tr>
              </thead>
              <tbody>
                {data.rows.map((row) => (
                  <tr key={row.id}>
                    <td>
                      <Link
                        href={`/admin/tickets/${encodeURIComponent(row.id)}`}
                      >
                        {row.summary.slice(0, 130) || row.id}
                      </Link>
                      <code className="admin-id">{row.id}</code>
                    </td>
                    <td>{row.user.email}</td>
                    <td>
                      <TicketBadge status={row.resolutionStatus} />
                    </td>
                    <td>
                      <DeliveryBadge status={row.status} />
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
          <p className="admin-empty">Murojaat topilmadi.</p>
        )}
        <AdminPager {...data} path="/admin/tickets" />
      </section>
    </>
  );
}

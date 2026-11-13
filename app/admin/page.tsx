import Link from "next/link";
import { adminOverview, adminTickets } from "@/server/admin";
import { AdminTime, TicketBadge, AdminPager } from "@/components/admin-ui";
import { AdminRefresh, AdminTicketSearch } from "@/components/admin-nav";
import {
  UsersRound,
  Layers,
  MessageSquare,
  CheckCircle2,
  ChevronRight,
  ArrowUpRight,
  ShieldCheck,
  Send,
  Inbox,
  Clock3,
} from "lucide-react";
export default async function AdminHome({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const state = ["all", "open", "in_progress", "resolved"].includes(
    String(params.state),
  )
    ? String(params.state)
    : "open";
  const [stats, tickets] = await Promise.all([
    adminOverview(),
    adminTickets({ ...params, state: state === "all" ? "" : state }),
  ]);
  const tabs = [
    ["all", "Barchasi", stats.open + stats.inProgress + stats.resolved],
    ["open", "Yangi", stats.open],
    ["in_progress", "Jarayonda", stats.inProgress],
    ["resolved", "Hal qilingan", stats.resolved],
  ] as const;
  const href = (state: string) => {
    const p = new URLSearchParams({ state });
    if (tickets.q) p.set("q", tickets.q);
    return "/admin?" + p;
  };
  return (
    <>
      <div className="admin-heading admin-dashboard-heading">
        <div>
          <h1>Dashboard</h1>
        </div>
        <div className="admin-dashboard-tools">
          <span>Barcha vaqt</span>
          <AdminRefresh />
        </div>
      </div>
      <div className="panel admin-overview-strip">
        {[
          {
            label: "Foydalanuvchilar",
            value: stats.users,
            href: "/admin/users",
            Icon: UsersRound,
          },
          {
            label: "Loyihalar",
            value: stats.projects,
            href: "/admin/projects",
            Icon: Layers,
          },
          {
            label: "Yangi murojaatlar",
            value: stats.open,
            href: "/admin?state=open",
            Icon: MessageSquare,
          },
          {
            label: "Hal qilingan",
            value: stats.resolved,
            href: "/admin?state=resolved",
            Icon: CheckCircle2,
          },
        ].map(({ label, value, href, Icon }) => (
          <Link key={label} href={href}>
            <Icon size={27} aria-hidden="true" />
            <div>
              <span>{label}</span>
              <strong>{value}</strong>
            </div>
          </Link>
        ))}
      </div>
      <div className="admin-dashboard-grid">
        <section className="panel admin-panel admin-dashboard-tickets">
          <div className="admin-section-heading">
            <h2>Murojaatlar</h2>
            <Link href="/admin/tickets">
              Barchasini ko‘rish <ArrowUpRight size={15} />
            </Link>
          </div>
          <AdminTicketSearch
            key={tickets.q + state}
            q={tickets.q}
            state={state}
          />
          <nav className="admin-ticket-tabs" aria-label="Murojaat holati">
            {tabs.map(([value, label, count]) => (
              <Link
                key={value}
                href={href(value)}
                aria-current={state === value ? "page" : undefined}
              >
                {label}
                <span>{count}</span>
              </Link>
            ))}
          </nav>
          {tickets.rows.length ? (
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>Foydalanuvchi</th>
                    <th>Murojaat</th>
                    <th>Holat</th>
                    <th>Vaqt</th>
                    <th>
                      <span className="sr-only">Amal</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {tickets.rows.map((row) => (
                    <tr key={row.id}>
                      <td>
                        <div className="admin-ticket-user">
                          <span aria-hidden="true">
                            {row.user.email[0]?.toUpperCase() || "F"}
                          </span>
                          <span>{row.user.email}</span>
                        </div>
                      </td>
                      <td className="admin-ticket-summary">
                        <Link
                          href={`/admin/tickets/${encodeURIComponent(row.id)}`}
                        >
                          {row.summary.slice(0, 120) || "Murojaat"}
                        </Link>
                      </td>
                      <td>
                        <TicketBadge status={row.resolutionStatus} />
                      </td>
                      <td className="admin-ticket-date">
                        <AdminTime date={row.createdAt} />
                      </td>
                      <td>
                        <Link
                          className="button secondary"
                          href={`/admin/tickets/${encodeURIComponent(row.id)}`}
                        >
                          Ko‘rib chiqish
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="admin-dashboard-empty">
              <Inbox size={28} />
              <h3>Murojaat topilmadi</h3>
              <p>
                {tickets.q
                  ? "Boshqa email yoki ID bilan qidiring."
                  : "Bu holatda murojaatlar yo‘q."}
              </p>
              {tickets.q && (
                <Link
                  className="button secondary"
                  href={"/admin?state=" + state}
                >
                  Qidiruvni tozalash
                </Link>
              )}
            </div>
          )}
          <AdminPager
            page={tickets.page}
            total={tickets.total}
            q={tickets.q}
            state={state}
            path="/admin"
          />
          {stats.failed > 0 && (
            <p className="admin-note">
              {stats.failed} ta murojaat Telegram’ga yetkazilmagan. Ularni shu
              paneldan ko‘rish mumkin.
            </p>
          )}
        </section>
        <aside className="panel admin-panel admin-quick-panel">
          <h2>Tezkor boshqaruv</h2>
          <nav aria-label="Tezkor boshqaruv">
            {(
              [
                ["/admin/users", "Foydalanuvchilar", UsersRound],
                ["/admin/projects", "Loyihalar", Layers],
                ["/admin/telegram", "Telegram boshqaruvi", Send],
              ] as const
            ).map(([path, label, Icon]) => (
              <Link key={String(path)} href={String(path)}>
                <Icon size={20} />
                <span>{label}</span>
                <ChevronRight size={17} />
              </Link>
            ))}
          </nav>
          <div className="admin-security-note">
            <ShieldCheck size={22} />
            <div>
              <strong>Faqat administrator</strong>
              <p>Boshqaruv amallari jurnalga yoziladi.</p>
            </div>
          </div>
        </aside>
      </div>
      <p className="admin-time-note">
        <Clock3 size={15} />
        Vaqtlar Toshkent vaqti bilan ko‘rsatilgan.
      </p>
    </>
  );
}

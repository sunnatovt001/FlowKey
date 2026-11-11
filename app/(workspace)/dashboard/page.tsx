import Link from "next/link";
import {
  CircleCheck,
  Clock3,
  CircleX,
  Coins,
  Info,
  ArrowRight,
  KeyRound,
  Settings,
  Webhook,
  ReceiptText,
  BookOpen,
} from "lucide-react";
import { dashboardData } from "@/server/dashboard";
import type { Search } from "@/server/workspace";
import { roleAllows } from "@/shared/project-role";
import { money, Status } from "@/components/ui";
import { DashboardControls } from "@/components/dashboard-controls";
import { DashboardChart } from "@/components/dashboard-chart";
import { dashboardVolumeLabel } from "@/shared/dashboard";
import "@/styles/dashboard.css";
export const metadata = { title: "Dashboard" };
const compact = (value: bigint) =>
  new Intl.NumberFormat("uz-UZ", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
export default async function Dashboard({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  const data = await dashboardData(await searchParams);
  const { project, role, period } = data;
  const technical = roleAllows(role, "technical");
  const developers = `/developers?project=${encodeURIComponent(project.id)}`;
  const transactionQuery = new URLSearchParams({
    project: project.id,
    from: period.dates[0],
    to: period.dates.at(-1)!,
  });
  const transactions = `/transactions?${transactionQuery}`;
  const maxVolume = data.days.reduce(
      (max, day) => (day.volume > max ? day.volume : max),
      0n,
    ),
    maxCount = data.days.reduce(
      (max, day) => (day.count > max ? day.count : max),
      0n,
    );
  const points = data.days.map((day) => ({
    date: day.date,
    label: new Intl.DateTimeFormat(
      "uz-UZ",
      period.days === 7
        ? { weekday: "short", timeZone: "Asia/Tashkent" }
        : { day: "numeric", month: "numeric", timeZone: "Asia/Tashkent" },
    ).format(new Date(`${day.date}T12:00:00+05:00`)),
    volume: money(day.volume),
    count: String(day.count),
    volumeHeight: maxVolume
      ? Number((day.volume * 10000n) / maxVolume) / 100
      : 0,
    countHeight: maxCount ? Number((day.count * 10000n) / maxCount) / 100 : 0,
  }));
  const metrics = [
    {
      title: "Jami to‘lov hajmi",
      value: money(data.volume),
      unit: "UZS",
      icon: Coins,
      status: "successful",
    },
    {
      title: "Muvaffaqiyatli",
      value: String(data.successful),
      icon: CircleCheck,
      status: "successful",
    },
    {
      title: "Kutilmoqda",
      value: String(data.pending),
      icon: Clock3,
      status: "pending",
    },
    {
      title: "Muvaffaqiyatsiz",
      value: String(data.failed),
      icon: CircleX,
      status: "failed",
    },
  ];
  const actions = technical
    ? [
        {
          label: "API kaliti yaratish",
          href: `${developers}&tab=keys#api-keys`,
          icon: KeyRound,
        },
        ...(role === "owner"
          ? [
              {
                label: "Loyiha sozlamalari",
                href: `/settings?project=${project.id}`,
                icon: Settings,
              },
            ]
          : []),
        {
          label: "Webhook qo‘shish",
          href: `${developers}&tab=webhooks#webhooks`,
          icon: Webhook,
        },
      ]
    : [
        { label: "Tranzaksiyalar", href: transactions, icon: ReceiptText },
        {
          label: "Moliya",
          href: `/finance?project=${project.id}`,
          icon: Coins,
        },
        {
          label: "Qo‘llanma",
          href: `/guide?project=${project.id}`,
          icon: BookOpen,
        },
      ];
  return (
    <div className="dashboard-page">
      <header className="dashboard-heading">
        <h1>Dashboard</h1>
        <DashboardControls days={period.days} />
      </header>
      <div className="dashboard-environment" role="note">
        <Info size={19} aria-hidden="true" />
        <span>Pul protsessingi ulanmagan</span>
        <span className="dashboard-environment-detail">Unit muhiti</span>
      </div>
      <div className="dashboard-metrics">
        {metrics.map(({ title, value, unit, icon: Icon, status }) => (
          <Link
            key={title}
            className="dashboard-card dashboard-metric"
            href={`${transactions}&status=${status}`}
          >
            <Icon size={23} aria-hidden="true" />
            <div>
              <h2>{title}</h2>
              <strong>{value}</strong>
              {unit && <span className="dashboard-metric-unit">{unit}</span>}
            </div>
          </Link>
        ))}
      </div>
      <div className="dashboard-main-grid">
        <DashboardChart
          key={project.id}
          points={points}
          volumeAxis={[
            dashboardVolumeLabel(maxVolume),
            dashboardVolumeLabel(maxVolume / 2n),
            "0",
          ]}
          countAxis={[compact(maxCount), compact(maxCount / 2n), "0"]}
          hasData={data.total > 0}
        />
        <section className="dashboard-card dashboard-integration">
          <header className="dashboard-card-heading">
            <h2>API va ulanish</h2>
          </header>
          <dl className="dashboard-connection-list">
            <div>
              <dt>
                <i
                  className={`dashboard-dot ${data.keyCount ? "success" : "neutral"}`}
                  aria-hidden="true"
                />
                API kaliti
              </dt>
              <dd>
                {data.keyCount ? `${data.keyCount} ta faol` : "Yaratilmagan"}
              </dd>
            </div>
            <div>
              <dt>
                <i
                  className={`dashboard-dot ${data.webhook.tone}`}
                  aria-hidden="true"
                />
                Webhook
              </dt>
              <dd>{data.webhook.text}</dd>
            </div>
            <div>
              <dt>
                <i
                  className={`dashboard-dot ${data.lastUsedAt ? "success" : "neutral"}`}
                  aria-hidden="true"
                />
                Oxirgi so‘rov
              </dt>
              <dd title="Faol API kaliti oxirgi ishlatilgan vaqt">
                {data.lastUsedAt
                  ? new Intl.DateTimeFormat("uz-UZ", {
                      day: "2-digit",
                      month: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                      timeZone: "Asia/Tashkent",
                    }).format(data.lastUsedAt)
                  : "—"}
              </dd>
            </div>
          </dl>
          <div className="dashboard-integration-actions">
            {technical ? (
              <Link className="button primary" href={developers}>
                Ulashni sozlash
              </Link>
            ) : (
              <span className="dashboard-readonly">Faqat ko‘rish ruxsati</span>
            )}
            <Link
              className="dashboard-text-link"
              href={`/guide?project=${project.id}`}
            >
              Qo‘llanma
            </Link>
          </div>
        </section>
        <section className="dashboard-card dashboard-transactions">
          <header className="dashboard-card-heading">
            <h2>Oxirgi tranzaksiyalar</h2>
            <Link className="dashboard-text-link" href={transactions}>
              Barchasini ko‘rish <ArrowRight size={15} aria-hidden="true" />
            </Link>
          </header>
          <div className="dashboard-table-scroll">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Summa</th>
                  <th>Holat</th>
                  <th>Sana</th>
                </tr>
              </thead>
              <tbody>
                {data.recent.map((row) => (
                  <tr key={row.id}>
                    <td>
                      <Link
                        className="dashboard-transaction-id"
                        href={`${transactions}&q=${encodeURIComponent(row.id)}`}
                        title={row.id}
                      >
                        {row.id}
                      </Link>
                    </td>
                    <td className="dashboard-amount">
                      {money(row.amountMinor)} <span>UZS</span>
                    </td>
                    <td>
                      <Status status={row.status} />
                    </td>
                    <td className="dashboard-time">
                      {new Intl.DateTimeFormat("uz-UZ", {
                        day: "2-digit",
                        month: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                        timeZone: "Asia/Tashkent",
                      }).format(row.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!data.recent.length && (
            <div className="dashboard-table-empty">
              <ReceiptText size={31} aria-hidden="true" />
              <p>Hozircha tranzaksiyalar yo‘q</p>
            </div>
          )}
        </section>
        <section className="dashboard-card dashboard-quick-actions">
          <header className="dashboard-card-heading">
            <h2>Tezkor amallar</h2>
          </header>
          <div>
            {actions.map(({ label, href, icon: Icon }) => (
              <Link href={href} key={label}>
                <Icon size={19} aria-hidden="true" />
                {label}
                <ArrowRight
                  size={15}
                  className="dashboard-action-arrow"
                  aria-hidden="true"
                />
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

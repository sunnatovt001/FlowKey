import { tashkentDayKey, tashkentWeekday } from "@/shared/format";
export const dynamic='force-dynamic';
import Link from "@/components/site-link";
import {
  ArrowUpRight,
  Check,
  ArrowRight,
  ArrowDownLeft,
  Activity,
  KeyRound,
  Code2,
} from "lucide-react";
import { db } from "@/server/db";
import { workspace, Search } from "@/server/workspace";

import { Empty, money, Status } from "@/components/ui";
export const metadata = { title: "Umumiy ko‘rinish" };
export default async function Dashboard({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  const { project } = await workspace(await searchParams);
  const [groups, recent, keyCount, endpointCount, activity] = await Promise.all(
    [
      db.transaction.groupBy({
        by: ["status"],
        where: { projectId: project.id },
        _count: true,
        _sum: { amountMinor: true },
      }),
      db.transaction.findMany({
        where: { projectId: project.id },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
      db.apiKey.count({ where: { projectId: project.id, revokedAt: null } }),
      db.webhookEndpoint.count({
        where: { projectId: project.id, disabledAt: null },
      }),
      db.transaction.findMany({
        where: {
          projectId: project.id,
          createdAt: { gte: new Date(new Date().getTime() - 7 * 86400000) },
        },
        select: { createdAt: true, amountMinor: true, status: true },
      }),
    ],
  );
  const total = groups.reduce((s, g) => s + g._count, 0);
  const successful = groups.find((g) => g.status === "successful");
  const failed = groups.find((g) => g.status === "failed");
  const days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setUTCDate(date.getUTCDate() - 6 + i);
    const iso = tashkentDayKey(date);
    return {
      date: tashkentWeekday(date),
      volume: activity
        .filter(
          (t) =>
            tashkentDayKey(t.createdAt) === iso &&
            t.status === "successful",
        )
        .reduce((s, t) => s + t.amountMinor, 0),
    };
  });
  const max = Math.max(...days.map((d) => d.volume), 1);
  return (
    <>
      <div className="page-heading">
        <div>
          <p className="breadcrumb">Kabinet / Umumiy ko‘rinish</p>
          <h1>To‘lovlaringiz bir qarashda.</h1>
          <p className="muted">
            Loyihadagi barcha amallar: {project.name}. Barcha amallar sinov tariqasida.
          </p>
        </div>
        <Link
          className="button primary"
          href={`/developers?project=${project.id}&tab=sandbox`}
        >
          Sinov to‘lovi yaratish <ArrowUpRight size={16} />
        </Link>
      </div>
      <div className="notice">
        <Activity size={17} />
        <span>
          Siz Unit muhitidasiz. Haqiqiy pul o‘tkazmasdan integratsiyangizni yarating va tekshiring.
        </span>
        <Link href={`/guide?project=${project.id}`}>
          Batafsil <ArrowRight size={14} />
        </Link>
      </div>
      <div className="stats-grid">
        {[
          [
            "Jami to‘lov hajmi",
            money(successful?._sum.amountMinor || 0),
            "UZS · muvaffaqiyatli sinov to‘lovlari",
            ArrowDownLeft,
          ],
          [
            "Muvaffaqiyatli to‘lovlar",
            String(successful?._count || 0),
            "Muvaffaqiyatli sinov",
            Check,
          ],
          [
            "Muvaffaqiyatsiz to‘lovlar",
            String(failed?._count || 0),
            "Muvaffaqiyatsiz sinov",
            Activity,
          ],
          ["Jami tranzaksiyalar", String(total), "Barcha sinov natijalari", Code2],
        ].map(([title, value, caption, Icon]) => {
          const MetricIcon = Icon as typeof Check;
          return (
            <div className="stat-card" key={String(title)}>
              <div>
                <p>{String(title)}</p>
                <MetricIcon size={17} />
              </div>
              <strong>{String(value)}</strong>
              <span>{String(caption)}</span>
            </div>
          );
        })}
      </div>
      <div className="overview-grid">
        <section className="panel activity-panel">
          <div className="panel-heading">
            <div>
              <h2>To‘lovlar faolligi</h2>
              <p>Muvaffaqiyatli sinov to‘lovlari hajmi · UZS</p>
            </div>
            <span className="subtle-label">Oxirgi 7 kun · Toshkent vaqti</span>
          </div>
          <div
            className="chart"
            role="img"
            aria-label={`Muvaffaqiyatli sinov to‘lovlari hajmi: ${days.map((d) => `${d.date} ${money(d.volume)} UZS`).join(", ")}`}
          >
            <div className="chart-bars">
              {days.map((d, i) => (
                <div key={i}>
                  <span
                    title={`${money(d.volume)} UZS`}
                    style={{
                      height: d.volume
                        ? `${Math.max(3, (d.volume / max) * 100)}%`
                        : "2px",
                    }}
                  />
                  <small>{d.date}</small>
                </div>
              ))}
            </div>
            {!activity.length && (
              <div className="chart-empty">
                <strong>Birinchi to‘lovga tayyormisiz?</strong>
                <span>Sinov amallaringiz shu yerda ko‘rinadi.</span>
              </div>
            )}
          </div>
        </section>
        <section className="panel checklist">
          <div className="panel-heading">
            <div>
              <h2>Kabinetga xush kelibsiz.</h2>
              <p>Integratsiyangiz shu yerdan boshlanadi.</p>
            </div>
          </div>
          {[
            [
              true,
              "Loyihangizni yarating",
              "Kabinet tayyor.",
              "/settings#create-project",
            ],
            [
              keyCount > 0,
              "API kalit yarating",
              "Unit muhitiga kirish kalitingiz.",
              `/developers?project=${project.id}`,
            ],
            [
              total > 0,
              "Sinov to‘lovi yuboring",
              "To‘liq jarayonni amalda ko‘ring.",
              `/developers?project=${project.id}&tab=sandbox`,
            ],
            [
              endpointCount > 0,
              "Webhook ulang",
              "Ilovangizni yangiliklardan xabardor qiling.",
              `/developers?project=${project.id}&tab=webhooks`,
            ],
          ].map(([done, title, description, href]) => (
            <Link
              className="checklist-item"
              href={String(href)}
              key={String(title)}
            >
              <span className={done ? "checked" : "unchecked"}>
                {done ? <Check size={13} /> : null}
              </span>
              <div>
                <strong>{String(title)}</strong>
                <p>{String(description)}</p>
              </div>
              <ArrowUpRight size={15} />
            </Link>
          ))}
        </section>
      </div>
      <section className="panel recent">
        <div className="panel-heading">
          <div>
            <h2>So‘nggi tranzaksiyalar</h2>
            <p>Unit muhitingizdagi so‘nggi amallar.</p>
          </div>
          <Link href={`/transactions?project=${project.id}`}>
            Barchasini ko‘rish <ArrowRight size={15} />
          </Link>
        </div>
        {recent.length ? (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Tranzaksiya</th>
                  <th>Summa</th>
                  <th>Holat</th>
                  <th>Sana</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((t) => (
                  <tr key={t.id}>
                    <td>
                      <Link
                        href={`/transactions?project=${project.id}&q=${t.id}`}
                      >
                        {t.id}
                      </Link>
                      <small>Sinov to‘lovi</small>
                    </td>
                    <td>
                      {money(t.amountMinor)} <span className="muted">UZS</span>
                    </td>
                    <td>
                      <Status status={t.status} />
                    </td>
                    <td>
                      {t.createdAt.toLocaleString("uz-UZ", {
                        timeZone: "Asia/Tashkent",
                      })}{" "}
                      UZT
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty title="Boshlash uchun qulay joy.">
            Birinchi tranzaksiyani ko‘rish uchun sinov to‘lovi yarating.{" "}
            <Link href={`/developers?project=${project.id}&tab=sandbox`}>
              Unit muhitini ochish <ArrowRight size={14} />
            </Link>
          </Empty>
        )}
      </section>
      <div className="integration-strip">
        <KeyRound size={20} />
        <div>
          <h3>
            {keyCount
              ? "API ulanishga tayyor."
              : "API kalitingiz sizni kutmoqda."}
          </h3>
          <p>
            {keyCount
              ? `Loyihada ${keyCount} ta faol sinov kaliti bor.`
              : "Sinov kalitini yarating va birinchi API so‘rovini yuboring."}
          </p>
        </div>
        <Link
          href={`/developers?project=${project.id}`}
          className="button secondary"
        >
          Dasturchi vositalari <ArrowRight size={15} />
        </Link>
      </div>
    </>
  );
}


"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  RefreshCw,
  ReceiptText,
  FolderCog,
  PlugZap,
  WalletCards,
  UsersRound,
  CalendarClock,
  Activity,
  ChevronDown,
  X,
} from "lucide-react";
import {
  activityCategories,
  activityActions,
  activityCategory,
  activitySearch,
} from "@/shared/activity";
import "@/styles/activity.css";
type Row = {
  id: string;
  action: string;
  resourceId: string;
  createdAt: string;
};
const icons = {
  payment: ReceiptText,
  project: FolderCog,
  integration: PlugZap,
  finance: WalletCards,
  team: UsersRound,
  subscription: CalendarClock,
  other: Activity,
};
function dateParts(value: string) {
  const d = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Tashkent",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date(value));
  const part = (type: string) => d.find((p) => p.type === type)?.value || "";
  return {
    day: `${part("day")}.${part("month")}.${part("year")}`,
    time: `${part("hour")}:${part("minute")}`,
  };
}
export function ActivityHub({
  rows,
  limited,
  now,
}: {
  rows: Row[];
  limited: boolean;
  now: number;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [period, setPeriod] = useState("all");
  const [visible, setVisible] = useState(20);
  const filtered = rows.filter(
    (row) =>
      (category === "all" || activityCategory(row.action) === category) &&
      (period === "all" ||
        new Date(row.createdAt).getTime() >= now - Number(period) * 86400000) &&
      activitySearch(
        `${activityActions[row.action] || "Boshqa hodisa"} ${row.action} ${row.resourceId}`,
      ).includes(activitySearch(query)),
  );
  const displayed = filtered.slice(0, visible);
  const reset = () => {
    setQuery("");
    setCategory("all");
    setPeriod("all");
    setVisible(20);
  };
  return (
    <section className="activity-hub" aria-label="Loyiha hodisalari">
      <div className="activity-toolbar">
        <label className="activity-search">
          <Search size={18} aria-hidden="true" />
          <span className="sr-only">Hodisalarni qidirish</span>
          <input
            type="search"
            placeholder="Amal yoki ID bo‘yicha qidirish"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setVisible(20);
            }}
          />
        </label>
        <label>
          <span className="sr-only">Hodisa turi</span>
          <select
            value={category}
            onChange={(e) => {
              setCategory(e.target.value);
              setVisible(20);
            }}
          >
            {activityCategories.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className="sr-only">Vaqt oralig‘i</span>
          <select
            value={period}
            onChange={(e) => {
              setPeriod(e.target.value);
              setVisible(20);
            }}
          >
            <option value="all">Barcha vaqt</option>
            <option value="7">Oxirgi 7 kun</option>
            <option value="30">Oxirgi 30 kun</option>
          </select>
        </label>
        <button
          className="button secondary activity-refresh"
          aria-label="Hodisalarni yangilash"
          onClick={() => router.refresh()}
        >
          <RefreshCw size={18} />
        </button>
      </div>
      <div className="panel activity-log">
        <div className="activity-log-heading">
          <h2>Voqealar tarixi</h2>
          <span role="status">{filtered.length} ta hodisa</span>
        </div>
        {displayed.length ? (
          <ol className="activity-list">
            {displayed.map((row, index) => {
              const category = activityCategory(row.action);
              const Icon = icons[category];
              const date = dateParts(row.createdAt);
              const previous =
                index > 0
                  ? dateParts(displayed[index - 1].createdAt).day
                  : null;
              return (
                <li key={row.id}>
                  {date.day !== previous && (
                    <h3 className="activity-day">
                      {date.day}
                      <span>Toshkent vaqti</span>
                    </h3>
                  )}
                  <details className="activity-event">
                    <summary>
                      <span className="activity-event-icon">
                        <Icon size={19} aria-hidden="true" />
                      </span>
                      <span className="activity-event-text">
                        <strong>
                          {activityActions[row.action] || "Boshqa hodisa"}
                        </strong>
                        <span>
                          {
                            activityCategories.find((c) => c.id === category)
                              ?.label
                          }
                        </span>
                      </span>
                      <time dateTime={row.createdAt}>{date.time}</time>
                      <ChevronDown
                        size={17}
                        className="activity-chevron"
                        aria-hidden="true"
                      />
                      <span className="sr-only">Tafsilotlar</span>
                    </summary>
                    <dl>
                      <div>
                        <dt>Resurs ID</dt>
                        <dd>
                          <code>{row.resourceId || "—"}</code>
                        </dd>
                      </div>
                      <div>
                        <dt>Amal kodi</dt>
                        <dd>
                          <code>{row.action}</code>
                        </dd>
                      </div>
                      <div>
                        <dt>Hodisa ID</dt>
                        <dd>
                          <code>{row.id}</code>
                        </dd>
                      </div>
                    </dl>
                  </details>
                </li>
              );
            })}
          </ol>
        ) : (
          <div className="activity-empty">
            <Activity size={28} aria-hidden="true" />
            <h3>{rows.length ? "Hodisa topilmadi" : "Hali hodisalar yo‘q"}</h3>
            <p>
              {rows.length
                ? "Boshqa so‘z yoki filtr bilan qidiring."
                : "Loyihadagi amallar shu yerda ko‘rinadi."}
            </p>
            {rows.length > 0 && (
              <button className="button secondary" onClick={reset}>
                <X size={16} />
                Filtrlarni tozalash
              </button>
            )}
          </div>
        )}
        {visible < filtered.length && (
          <button
            className="button secondary activity-more"
            onClick={() => setVisible((v) => v + 20)}
          >
            Yana ko‘rsatish
          </button>
        )}
      </div>
      {limited && (
        <p className="activity-limit">
          Oxirgi 200 ta hodisa ko‘rsatilmoqda. Qidiruv va filtrlar shu yozuvlar
          orasidan izlaydi.
        </p>
      )}
    </section>
  );
}

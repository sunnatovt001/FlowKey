"use client";
import { useSearchParams, useRouter } from "next/navigation";
import { useTransition, type ReactNode } from "react";
import Link from "next/link";
import {
  FlaskConical,
  ShieldCheck,
  WalletCards,
  PanelsTopLeft,
  Webhook,
  CalendarClock,
  CheckCircle2,
  CircleHelp,
  ArrowUpRight,
} from "lucide-react";
import "@/styles/testing.css";
const descriptions: Record<string, string> = {
  payments: "Summa va natija",
  checkout: "Mijoz ko‘rinishi",
  webhooks: "Saytga xabar yuborish",
  finance: "Qaytarish va balans",
  subscriptions: "Davriy to‘lovlar",
};
const icons: Record<string, typeof FlaskConical> = {
  payments: WalletCards,
  checkout: PanelsTopLeft,
  webhooks: Webhook,
  finance: WalletCards,
  subscriptions: CalendarClock,
};
export function TestingCenter({
  panels,
  projectId,
}: {
  projectId: string;
  panels: {
    id: string;
    title: string;
    description: string;
    content: ReactNode;
  }[];
}) {
  const query = useSearchParams(),
    router = useRouter();
  const [pending, start] = useTransition();
  const active = panels.some((p) => p.id === query.get("area"))
    ? query.get("area")
    : panels[0]?.id;
  function select(id: string) {
    const params = new URLSearchParams(query);
    params.set("project", projectId);
    params.set("area", id);
    window.history.replaceState(null, "", "/testing?" + params);
  }
  return (
    <div className="testing-center">
      <header className="testing-heading">
        <div>
          <h1>Sinov markazi</h1>
          <p>To‘lov qanday ishlashini xavfsiz tekshiring.</p>
        </div>
        <span className="testing-safe-badge">
          <ShieldCheck size={20} />
          Haqiqiy pul ishlatilmaydi
        </span>
      </header>
      <div className="testing-workspace">
        <aside className="testing-rail">
          <h2>Nimani sinaysiz?</h2>
          <div
            className="testing-tabs"
            role="tablist"
            aria-label="Sinov turi"
            aria-orientation="vertical"
          >
            {panels.map((p, index) => {
              const Icon = icons[p.id] || FlaskConical;
              return (
                <button
                  type="button"
                  role="tab"
                  key={p.id}
                  id={`test-tab-${p.id}`}
                  aria-controls={`test-panel-${p.id}`}
                  aria-selected={active === p.id}
                  tabIndex={active === p.id ? 0 : -1}
                  onClick={() => select(p.id)}
                  onKeyDown={(e) => {
                    let next = index;
                    if (e.key === "ArrowDown" || e.key === "ArrowRight")
                      next = (index + 1) % panels.length;
                    else if (e.key === "ArrowUp" || e.key === "ArrowLeft")
                      next = (index + panels.length - 1) % panels.length;
                    else if (e.key === "Home") next = 0;
                    else if (e.key === "End") next = panels.length - 1;
                    else return;
                    e.preventDefault();
                    select(panels[next].id);
                    document
                      .getElementById("test-tab-" + panels[next].id)
                      ?.focus();
                  }}
                >
                  <Icon size={25} />
                  <span>
                    <strong>{p.title}</strong>
                    <small>{descriptions[p.id] || p.description}</small>
                  </span>
                  {active === p.id && (
                    <CheckCircle2 size={17} className="test-tab-check" />
                  )}
                </button>
              );
            })}
          </div>
        </aside>
        <div className="testing-panels">
          {panels.map((p) => (
            <section
              key={p.id}
              role="tabpanel"
              id={`test-panel-${p.id}`}
              aria-labelledby={`test-tab-${p.id}`}
              hidden={active !== p.id}
              tabIndex={0}
            >
              {p.id !== "payments" && (
                <div className="testing-panel-intro">
                  <h2>{p.title}</h2>
                  <p>{p.description}</p>
                  <button
                    className="test-panel-refresh"
                    disabled={pending}
                    onClick={() => start(() => router.refresh())}
                  >
                    {pending ? "Yangilanmoqda…" : "Yangilash"}
                  </button>
                </div>
              )}
              {p.content}
            </section>
          ))}
        </div>
      </div>
      <footer className="testing-help">
        <span>
          <CircleHelp size={20} />
          <strong>Yordam kerakmi?</strong>
        </span>
        <Link href={`/guide?project=${projectId}#create-payment`}>
          Sinov bo‘yicha qo‘llanma
          <ArrowUpRight size={17} />
        </Link>
      </footer>
    </div>
  );
}

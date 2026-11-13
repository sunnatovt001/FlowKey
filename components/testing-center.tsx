"use client";
import { useSearchParams, useRouter } from "next/navigation";
import { useTransition, type ReactNode } from "react";
import {
  RefreshCw,
  FlaskConical,
  ShieldCheck,
  ReceiptText,
  PanelsTopLeft,
  Webhook,
  WalletCards,
  CalendarClock,
} from "lucide-react";
import "@/styles/testing.css";
export function TestingCenter({
  panels,
}: {
  panels: {
    id: string;
    title: string;
    description: string;
    content: ReactNode;
  }[];
}) {
  const query = useSearchParams();
  const router = useRouter();
  const [pending, start] = useTransition();
  const active = panels.some((p) => p.id === query.get("area"))
    ? query.get("area")
    : panels[0]?.id;
  const select = (id: string) => {
    const params = new URLSearchParams(query);
    params.set("area", id);
    window.history.replaceState(null, "", "/testing?" + params);
  };
  return (
    <div className="testing-center">
      <div className="page-heading">
        <div>
          <h1>Sinov markazi</h1>
          <p>To‘lov va integratsiyani shu yerda tekshiring.</p>
        </div>
        <button
          type="button"
          className="button secondary"
          aria-label="Sinov ma’lumotlarini yangilash"
          disabled={pending}
          onClick={() => start(() => router.refresh())}
        >
          <RefreshCw size={17} />
          Yangilash
        </button>
      </div>
      <div className="testing-notice">
        <ShieldCheck size={19} />
        <span>Unit muhiti · Haqiqiy pul o‘tkazilmaydi.</span>
      </div>
      <div className="testing-tabs" role="tablist" aria-label="Sinov turi">
        {panels.map((p, index) => {
          const Icon =
            (
              {
                payments: ReceiptText,
                checkout: PanelsTopLeft,
                webhooks: Webhook,
                finance: WalletCards,
                subscriptions: CalendarClock,
              } as Record<string, typeof FlaskConical>
            )[p.id] || FlaskConical;
          return (
            <button
              key={p.id}
              type="button"
              role="tab"
              id={`test-tab-${p.id}`}
              aria-controls={`test-panel-${p.id}`}
              aria-selected={active === p.id}
              tabIndex={active === p.id ? 0 : -1}
              onClick={() => select(p.id)}
              onKeyDown={(e) => {
                let next = index;
                if (e.key === "ArrowRight") next = (index + 1) % panels.length;
                else if (e.key === "ArrowLeft")
                  next = (index + panels.length - 1) % panels.length;
                else if (e.key === "Home") next = 0;
                else if (e.key === "End") next = panels.length - 1;
                else return;
                e.preventDefault();
                select(panels[next].id);
                document.getElementById("test-tab-" + panels[next].id)?.focus();
              }}
            >
              <Icon size={17} aria-hidden="true" />
              {p.title}
            </button>
          );
        })}
      </div>
      {panels.map((p) => (
        <section
          key={p.id}
          role="tabpanel"
          id={`test-panel-${p.id}`}
          aria-labelledby={`test-tab-${p.id}`}
          hidden={active !== p.id}
          tabIndex={0}
        >
          <p className="testing-description">{p.description}</p>
          {p.content}
        </section>
      ))}
    </div>
  );
}

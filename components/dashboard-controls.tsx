"use client";
import { useEffect, useId, useRef, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { CalendarDays, Check, ChevronDown, RefreshCw } from "lucide-react";
import { useLanguage } from "./i18n/language-provider";

const ranges = [7, 30, 90];
const labels = {
  uz: { range: "Ko‘rsatkichlar davri", days: (n: number) => `Oxirgi ${n} kun`, refresh: "Yangilash", loading: "Yangilanmoqda…" },
  ru: { range: "Период показателей", days: (n: number) => `Последние ${n} дней`, refresh: "Обновить", loading: "Обновляем…" },
  en: { range: "Reporting period", days: (n: number) => `Last ${n} days`, refresh: "Refresh", loading: "Refreshing…" },
};

export function DashboardControls({ days }: { days: number }) {
  const router = useRouter(), path = usePathname(), query = useSearchParams();
  const { language } = useLanguage();
  const copy = labels[language];
  const [busy, start] = useTransition();
  const [open, setOpen] = useState(false);
  const listId = useId();
  const menu = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const options = useRef<(HTMLButtonElement | null)[]>([]);

  useEffect(() => {
    if (!open) return;
    function closeOutside(event: PointerEvent) {
      if (!menu.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("pointerdown", closeOutside);
    return () => document.removeEventListener("pointerdown", closeOutside);
  }, [open]);

  function show(focus: boolean) {
    setOpen(true);
    if (focus) requestAnimationFrame(() => options.current[Math.max(0, ranges.indexOf(days))]?.focus());
  }

  function choose(days: number) {
    setOpen(false);
    trigger.current?.focus();
    const params = new URLSearchParams(query);
    params.set("range", String(days));
    start(() => router.replace(`${path}?${params}`, { scroll: false }));
  }

  return (
    <div className="dashboard-controls" aria-busy={busy}>
      <div className="dashboard-period" data-open={open} ref={menu}
        onBlur={event => {
          if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
        }}
        onKeyDown={event => {
          if (event.key === "Escape" && open) {
            event.preventDefault();
            event.stopPropagation();
            trigger.current?.focus();
            setOpen(false);
          }
        }}>
        <button type="button" id="dashboard-range" ref={trigger} aria-haspopup="menu"
          aria-expanded={open} aria-controls={listId} aria-label={`${copy.range}: ${copy.days(days)}`}
          aria-disabled={busy}
          onClick={() => { if (!busy) { if (open) setOpen(false); else show(false); } }}
          onKeyDown={event => {
            if (!busy && (event.key === "ArrowDown" || event.key === "ArrowUp")) {
              event.preventDefault();
              show(true);
            }
          }}>
          <CalendarDays size={16} aria-hidden="true" />
          <span>{copy.days(days)}</span>
          <ChevronDown className="dashboard-period-chevron" size={15} aria-hidden="true" />
        </button>
        <div className="dashboard-period-menu" id={listId} role="menu" aria-label={copy.range} inert={!open}
          onKeyDown={event => {
            const index = options.current.findIndex(item => item === document.activeElement);
            const value = { ArrowDown: index + 1, ArrowUp: index - 1, Home: 0, End: ranges.length - 1 }[event.key];
            if (value === undefined) return;
            event.preventDefault();
            options.current[(value + ranges.length) % ranges.length]?.focus();
          }}>
          {ranges.map((value, index) => (
            <button type="button" key={value} role="menuitemradio" aria-checked={value === days}
              ref={item => { options.current[index] = item; }}
              onClick={() => choose(value)}>
              {copy.days(value)}
              {value === days && <Check size={16} aria-hidden="true" />}
            </button>
          ))}
        </div>
      </div>
      <button className="dashboard-refresh" type="button" aria-label={copy.refresh} title={copy.refresh}
        disabled={busy} onClick={() => start(() => router.refresh())}>
        <RefreshCw size={18} className={busy ? "dashboard-refreshing" : ""} aria-hidden="true" />
      </button>
      <span className="sr-only" role="status">{busy ? copy.loading : ""}</span>
    </div>
  );
}

"use client";
import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Search,
  RotateCcw,
  RefreshCw,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  ReceiptText,
  ArrowUpRight,
  ShieldCheck,
  LoaderCircle,
} from "lucide-react";
import {
  paymentFilters,
  paymentFilterKey,
  paymentRangeError,
  paymentPeriod,
  paymentHref,
  type PaymentFilters,
} from "@/shared/payments";
import { TransactionTable } from "./transaction-table";
import { money } from "./ui";
type Props = {
  project: { id: string; name: string };
  filters: PaymentFilters;
  totals: {
    all: number;
    successful: number;
    pending: number;
    failed: number;
    volume: string;
  };
  count: number;
  page: number;
  pages: number;
  today: string;
  rows: {
    id: string;
    amountMinor: number;
    currency: string;
    createdAt: string;
    status: string;
  }[];
};
export function PaymentsView({
  project,
  filters,
  totals,
  count,
  page,
  pages,
  today,
  rows,
}: Props) {
  const router = useRouter();
  const [draft, setDraft] = useState(filters),
    [pending, startTransition] = useTransition();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null),
    target = useRef<string | null>(null);
  const [custom, setCustom] = useState(
    Boolean(filters.from || filters.to) &&
      ![7, 30].some((days) => {
        const p = paymentPeriod(days, today);
        return p.from === filters.from && p.to === filters.to;
      }),
  );
  const incoming = paymentFilterKey(filters);
  useEffect(() => {
    if (timer.current || (target.current && target.current !== incoming))
      return;
    setDraft(filters);
    target.current = null;
  }, [incoming, filters]);
  useEffect(() => {
    const sync = () => {
      if (timer.current) clearTimeout(timer.current);
      timer.current = null;
      target.current = null;
      setDraft(
        paymentFilters(
          Object.fromEntries(new URLSearchParams(location.search)),
        ),
      );
    };
    window.addEventListener("popstate", sync);
    return () => {
      window.removeEventListener("popstate", sync);
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);
  function navigate(value: PaymentFilters, p = 1) {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    if (paymentRangeError(value)) return;
    const normalized = { ...value, q: value.q.trim() };
    if (paymentFilterKey(normalized) === incoming && p === page) {
      target.current = null;
      return;
    }
    target.current = paymentFilterKey(normalized);
    startTransition(() =>
      router.replace(paymentHref(project.id, normalized, p), { scroll: false }),
    );
  }
  function change(patch: Partial<PaymentFilters>, debounce = false) {
    const value = { ...draft, ...patch };
    setDraft(value);
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    if (debounce) timer.current = setTimeout(() => navigate(value), 300);
    else navigate(value);
  }
  function clear() {
    const clean = { q: "", status: "", from: "", to: "" };
    setDraft(clean);
    setCustom(false);
    navigate(clean);
  }
  const rangeError = paymentRangeError(draft),
    hasFilters = Boolean(draft.q || draft.status || draft.from || draft.to);
  const tabs = [
    { id: "", label: "Barchasi", count: totals.all },
    { id: "successful", label: "Muvaffaqiyatli", count: totals.successful },
    { id: "pending", label: "Kutilmoqda", count: totals.pending },
    { id: "failed", label: "O‘tmadi", count: totals.failed },
  ];
  const activePeriod =
    !draft.from && !draft.to
      ? "all"
      : [7, 30].find((days) => {
          const p = paymentPeriod(days, today);
          return p.from === draft.from && p.to === draft.to;
        }) || "custom";
  return (
    <div className="payments-workspace" aria-busy={pending}>
      <header className="payments-heading">
        <div>
          <h1>To‘lovlar</h1>
          <p>Har bir to‘lov va uning natijasi — bir joyda.</p>
        </div>
        <span className="payments-mode">
          <ShieldCheck size={16} />
          Sinov muhiti
        </span>
      </header>
      <section
        className="payments-summary"
        aria-label="Joriy qidiruv bo‘yicha jami"
      >
        <div className="payments-volume">
          <span>Muvaffaqiyatli to‘lovlar summasi</span>
          <strong>
            {money(BigInt(totals.volume))}
            <small> UZS</small>
          </strong>
        </div>
        <div className="payments-summary-count">
          <span>Jami to‘lovlar</span>
          <strong>
            {totals.all}
            <small> ta</small>
          </strong>
        </div>
        <div className="payments-summary-context">
          <span>
            {filters.q ? "Qidiruv natijalari" : "Tanlangan davr bo‘yicha"}
          </span>
          <small>Haqiqiy pul o‘tkazilmaydi.</small>
        </div>
      </section>
      <section
        className="payments-ledger"
        aria-labelledby="payments-history-title"
      >
        <div className="payments-ledger-heading">
          <div>
            <h2 id="payments-history-title">To‘lovlar tarixi</h2>
            <span>{project.name}</span>
          </div>
          <button
            className="payments-refresh"
            onClick={() => startTransition(() => router.refresh())}
            disabled={pending}
            aria-label="To‘lovlarni yangilash"
          >
            <RefreshCw size={17} className={pending ? "payments-spin" : ""} />
            <span>Yangilash</span>
          </button>
        </div>
        <form
          className="payments-controls"
          onSubmit={(e) => {
            e.preventDefault();
            navigate(draft);
          }}
          aria-label="To‘lovlarni saralash"
        >
          <div className="payments-filter-row">
            <label className="payments-search">
              <Search size={19} aria-hidden="true" />
              <span className="sr-only">To‘lov ID bo‘yicha qidirish</span>
              <input
                type="search"
                value={draft.q}
                maxLength={100}
                onChange={(e) => change({ q: e.target.value }, true)}
                placeholder="To‘lov ID bo‘yicha qidirish"
                autoComplete="off"
              />
            </label>
            <label className="payments-period">
              <CalendarDays size={17} aria-hidden="true" />
              <span className="sr-only">To‘lovlar davri</span>
              <select
                value={custom ? "custom" : activePeriod}
                onChange={(e) => {
                  if (e.target.value === "custom") {
                    setCustom(true);
                    return;
                  }
                  setCustom(false);
                  change(
                    e.target.value === "all"
                      ? { from: "", to: "" }
                      : paymentPeriod(Number(e.target.value), today),
                  );
                }}
              >
                <option value="all">Barcha vaqt</option>
                <option value="7">Oxirgi 7 kun</option>
                <option value="30">Oxirgi 30 kun</option>
                <option value="custom">Sanani tanlash</option>
              </select>
            </label>
            {hasFilters && (
              <button type="button" className="payments-clear" onClick={clear}>
                <RotateCcw size={15} />
                Tozalash
              </button>
            )}
          </div>
          {(custom || activePeriod === "custom") && (
            <div className="payments-date-row">
              <label>
                Boshlanish sanasi
                <input
                  type="date"
                  value={draft.from}
                  onChange={(e) => change({ from: e.target.value })}
                  aria-invalid={Boolean(rangeError)}
                  aria-describedby={
                    rangeError ? "payment-date-error" : undefined
                  }
                />
              </label>
              <label>
                Tugash sanasi
                <input
                  type="date"
                  value={draft.to}
                  onChange={(e) => change({ to: e.target.value })}
                  aria-invalid={Boolean(rangeError)}
                  aria-describedby={
                    rangeError ? "payment-date-error" : undefined
                  }
                />
              </label>
              <span>Toshkent vaqti</span>
            </div>
          )}
          {rangeError && (
            <p className="payments-error" id="payment-date-error" role="alert">
              {rangeError}
            </p>
          )}
          <div className="payments-status-row">
            <div
              className="payments-status-filters"
              role="group"
              aria-label="To‘lov holati"
            >
              {tabs.map((t) => (
                <button
                  type="button"
                  key={t.id}
                  className={draft.status === t.id ? "is-active" : ""}
                  aria-pressed={draft.status === t.id}
                  onClick={() => change({ status: t.id })}
                >
                  {t.id && <span className={"payments-state-dot " + t.id} />}
                  <span>{t.label}</span>
                  <small>{t.count}</small>
                </button>
              ))}
            </div>
            <span className="payments-update" role="status" aria-live="polite">
              {pending ? (
                <>
                  <LoaderCircle size={15} className="payments-spin" />
                  Yangilanmoqda…
                </>
              ) : (
                count + " ta to‘lov"
              )}
            </span>
          </div>
        </form>
        <div className="payment-results" id="payment-results">
          {rows.length ? (
            <TransactionTable rows={rows} project={project.name} />
          ) : (
            <div className="payments-empty">
              <ReceiptText size={30} />
              <h3>
                {hasFilters ? "Mos to‘lov topilmadi" : "Hali to‘lov yo‘q"}
              </h3>
              <p>
                {hasFilters
                  ? "Boshqa ID yoki sana bilan qidiring."
                  : "Birinchi sinov to‘lovingiz shu yerda ko‘rinadi."}
              </p>
              {hasFilters ? (
                <button
                  type="button"
                  className="button secondary"
                  onClick={clear}
                >
                  Filtrlarni tozalash
                </button>
              ) : (
                <Link
                  className="button secondary"
                  href={`/testing?project=${project.id}&area=payments`}
                >
                  Sinov markazini ochish
                  <ArrowUpRight size={16} />
                </Link>
              )}
            </div>
          )}
        </div>
        <footer className="payments-pagination">
          <span>
            {count
              ? `${(page - 1) * 20 + 1}–${Math.min(page * 20, count)} / ${count} ta to‘lov`
              : "0 ta to‘lov"}
          </span>
          <div>
            <span>
              {page} / {pages}
            </span>
            <button
              aria-label="Oldingi sahifa"
              disabled={pending || page <= 1}
              onClick={() => navigate(draft, page - 1)}
            >
              <ChevronLeft size={18} />
            </button>
            <button
              aria-label="Keyingi sahifa"
              disabled={pending || page >= pages}
              onClick={() => navigate(draft, page + 1)}
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </footer>
      </section>
    </div>
  );
}

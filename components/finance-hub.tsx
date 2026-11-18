"use client";
import { useRef, useState } from "react";
import {
  ArrowUpFromLine,
  Undo2,
  Download,
  Info,
  ChevronDown,
  ReceiptText,
  X,
  CheckCircle2,
  TriangleAlert,
} from "lucide-react";
import { OperationForm } from "./operation-form";
type Props = {
  testing?: boolean;
  projectId: string;
  owner: boolean;
  balances: { currency: string; account: string; amountMinor: string }[];
  payments: { id: string; amount: string }[];
  payouts: { id: string; amount: string; status: string; date: string }[];
  refunds: {
    id: string;
    paymentId: string;
    amount: string;
    fee: string;
    date: string;
  }[];
  journal: {
    id: string;
    operationId: string;
    account: string;
    amount: string;
    currency: string;
  }[];
};
const labels: Record<string, string> = {
  available: "Mavjud balans",
  reserved: "Band qilingan",
  fees: "Komissiya",
  paid: "Chiqarilgan",
  provider: "Hamkor hisobi",
  requested: "Tasdiq kutilmoqda",
  approved: "Tasdiqlangan",
  rejected: "Rad etilgan",
  completed: "Bajarilgan",
  failed: "Bajarilmadi",
};
function amount(value: string) {
  const n = BigInt(value);
  const sign = n < 0n ? "−" : "";
  const abs = n < 0n ? -n : n;
  return (
    sign +
    (abs / 100n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ") +
    (abs % 100n ? "," + String(abs % 100n).padStart(2, "0") : "")
  );
}
function date(value: string) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Tashkent",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date(value));
  const get = (type: string) => parts.find((p) => p.type === type)?.value || "";
  return [get("day"), get("month"), get("year")].join(".");
}
export function FinanceHub({
  projectId,
  testing = false,
  owner,
  balances,
  payments,
  payouts,
  refunds,
  journal,
}: Props) {
  const [form, setForm] = useState<"payout" | "refund" | null>(null);
  const [tab, setTab] = useState<"payouts" | "refunds">("payouts");
  const [status, setStatus] = useState("all");
  const formRef = useRef<HTMLElement>(null);
  const trigger = useRef<HTMLButtonElement | null>(null);
  const endpoint = `/api/projects/${projectId}/operations`;
  const balanced =
    balances.reduce((n, b) => n + BigInt(b.amountMinor), 0n) === 0n;
  function open(kind: "payout" | "refund", button: HTMLButtonElement) {
    trigger.current = button;
    setForm(kind);
    requestAnimationFrame(() => {
      formRef.current?.scrollIntoView({
        block: "nearest",
        behavior: matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "instant"
          : "smooth",
      });
      formRef.current?.focus();
    });
  }
  function close() {
    setForm(null);
    trigger.current?.focus();
  }
  const rows = payouts.filter((p) => status === "all" || p.status === status);
  return (
    <div className="finance-hub">
      <header className="finance-heading">
        {testing ? <h2>Mablag‘lar sinovi</h2> : <h1>Mablag‘lar</h1>}
        <a
          className="button secondary"
          href={`/api/projects/${projectId}/report`}
        >
          <Download size={18} aria-hidden="true" /> Hisobot (CSV)
        </a>
      </header>
      <div className="finance-notice" role="note">
        <Info size={18} aria-hidden="true" />
        Sinov muhiti · Haqiqiy pul o‘tkazilmaydi.
      </div>
      <section className="finance-balance" aria-label="UZS balansi">
        <dl>
          {["available", "reserved", "fees", "paid"].map((account) => (
            <div key={account}>
              <dt>{labels[account]}</dt>
              <dd>
                {amount(
                  balances.find(
                    (b) => b.currency === "UZS" && b.account === account,
                  )?.amountMinor || "0",
                )}
                <span>UZS</span>
              </dd>
            </div>
          ))}
        </dl>
        <div className="finance-balance-footer">
          <span
            className={balanced ? "finance-balanced" : "finance-unbalanced"}
          >
            {balanced ? (
              <CheckCircle2 size={17} />
            ) : (
              <TriangleAlert size={17} />
            )}{" "}
            {balanced ? "Hisob muvozanatda" : "Hisobda farq bor"}
          </span>
          <details>
            <summary>
              Hisoblash tafsilotlari <ChevronDown size={16} />
            </summary>
            <p>Sinov komissiyasi 3%. Tiyin aniqligida pastga yaxlitlanadi.</p>
          </details>
        </div>
      </section>
      {testing && (
        <section className="finance-actions" aria-label="Moliyaviy amallar">
          <h2>Moliyaviy amallar</h2>
          <div>
            <button
              className="button primary"
              aria-expanded={form === "payout"}
              aria-controls="finance-operation"
              onClick={(e) => open("payout", e.currentTarget)}
            >
              <ArrowUpFromLine size={18} />
              Pul chiqarish
            </button>
            {owner && (
              <button
                className="button secondary"
                aria-expanded={form === "refund"}
                aria-controls="finance-operation"
                onClick={(e) => open("refund", e.currentTarget)}
              >
                <Undo2 size={18} />
                To‘lovni qaytarish
              </button>
            )}
          </div>
        </section>
      )}
      {testing && form && (
        <section
          className="finance-operation"
          id="finance-operation"
          ref={formRef}
          tabIndex={-1}
          aria-labelledby="finance-form-title"
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              e.stopPropagation();
              close();
            }
          }}
        >
          <div className="finance-section-heading">
            <h2 id="finance-form-title">
              {form === "payout"
                ? "Pul chiqarish arizasi"
                : "To‘lovni qaytarish"}
            </h2>
            <button
              className="finance-icon-button"
              aria-label="Shaklni yopish"
              onClick={close}
            >
              <X size={20} />
            </button>
          </div>
          {form === "payout" ? (
            <>
              <p className="finance-hint">
                Kamida 20 000 UZS. Summa band qilinadi, egasi tasdiqlaydi.
              </p>
              <OperationForm
                key="payout"
                endpoint={endpoint}
                action="payout"
                label="Sinov arizasini yaratish"
                amountName="amount"
              >
                <label>
                  Summa, UZS
                  <input
                    name="amount"
                    inputMode="decimal"
                    required
                    placeholder="20000"
                  />
                </label>
              </OperationForm>
            </>
          ) : payments.length ? (
            <>
              <p className="finance-hint">
                To‘liq yoki qisman qaytarish. Tegishli komissiya ham
                qaytariladi.
              </p>
              <OperationForm
                key="refund"
                endpoint={endpoint}
                action="refund"
                label="Sinov qaytarishini bajarish"
                amountName="amount"
              >
                <label>
                  To‘lov
                  <select name="paymentId" required>
                    {payments.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.id.slice(0, 12)} · {amount(p.amount)} UZS
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Qaytarish summasi, UZS
                  <input
                    name="amount"
                    inputMode="decimal"
                    required
                    placeholder="10000"
                  />
                </label>
              </OperationForm>
            </>
          ) : (
            <p className="finance-hint">
              Qaytarish uchun muvaffaqiyatli to‘lov kerak.
            </p>
          )}
        </section>
      )}
      <section
        className="finance-history"
        aria-labelledby="finance-history-title"
      >
        <h2 id="finance-history-title">Operatsiyalar tarixi</h2>
        <div className="finance-history-toolbar">
          <div
            className="finance-tabs"
            role="group"
            aria-label="Operatsiya turi"
          >
            <button
              aria-pressed={tab === "payouts"}
              onClick={() => setTab("payouts")}
            >
              Pul chiqarish
            </button>
            <button
              aria-pressed={tab === "refunds"}
              onClick={() => setTab("refunds")}
            >
              Qaytarishlar
            </button>
          </div>
          {tab === "payouts" && (
            <label className="finance-filter">
              <span className="sr-only">Ariza holati</span>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="all">Barcha holatlar</option>
                {[
                  "requested",
                  "approved",
                  "rejected",
                  "completed",
                  "failed",
                ].map((s) => (
                  <option key={s} value={s}>
                    {labels[s]}
                  </option>
                ))}
              </select>
            </label>
          )}
        </div>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th scope="col">Sana</th>
                {tab === "refunds" && <th scope="col">To‘lov</th>}
                <th scope="col">Summa, UZS</th>
                <th scope="col">
                  {tab === "payouts" ? "Holat" : "Komissiya, UZS"}
                </th>
                {testing && tab === "payouts" && <th scope="col">Amal</th>}
              </tr>
            </thead>
            <tbody>
              {tab === "payouts"
                ? rows.map((p) => (
                    <tr key={p.id}>
                      <td>{date(p.date)}</td>
                      <td className="finance-money">{amount(p.amount)}</td>
                      <td>
                        <span
                          className={`finance-status finance-status-${p.status}`}
                        >
                          {labels[p.status] || p.status}
                        </span>
                      </td>
                      {testing && (
                        <td>
                          <div className="operation-actions">
                            {testing &&
                              owner &&
                              (p.status === "requested"
                                ? ["approve", "reject"]
                                : p.status === "approved"
                                  ? ["complete", "fail"]
                                  : []
                              ).map((action) => (
                                <OperationForm
                                  key={action}
                                  endpoint={endpoint}
                                  action={action}
                                  fixed={{ id: p.id }}
                                  label={
                                    {
                                      approve: "Tasdiqlash",
                                      reject: "Rad etish",
                                      complete: "Sinovda bajarish",
                                      fail: "Xatoni sinash",
                                    }[action]!
                                  }
                                />
                              ))}
                          </div>
                        </td>
                      )}
                    </tr>
                  ))
                : refunds.map((r) => (
                    <tr key={r.id}>
                      <td>{date(r.date)}</td>
                      <td>
                        <code title={r.paymentId}>{r.paymentId}</code>
                      </td>
                      <td className="finance-money">{amount(r.amount)}</td>
                      <td className="finance-money">{amount(r.fee)}</td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>
        {(tab === "payouts" ? !rows.length : !refunds.length) && (
          <div className="finance-empty">
            <ReceiptText size={38} aria-hidden="true" />
            <h3>
              {tab === "refunds"
                ? "Hali qaytarish yo‘q"
                : status === "all"
                  ? "Hali ariza yo‘q"
                  : "Bu holatda ariza yo‘q"}
            </h3>
            <p>
              {tab === "refunds"
                ? "Qaytarishlar shu yerda ko‘rinadi."
                : "Arizalaringiz shu yerda ko‘rinadi."}
            </p>
            {testing && tab === "payouts" && (
              <button
                className="finance-text-button"
                onClick={(e) => open("payout", e.currentTarget)}
              >
                Ariza yaratish
              </button>
            )}
          </div>
        )}
      </section>
      <details className="finance-journal">
        <summary>
          <strong>Moliyaviy jurnal</strong>
          <span>Oxirgi 100 yozuv</span>
          <ChevronDown size={18} />
        </summary>
        {journal.length ? (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Operatsiya</th>
                  <th>Hisob</th>
                  <th>Summa (tiyin)</th>
                  <th>Valyuta</th>
                </tr>
              </thead>
              <tbody>
                {journal.map((e) => (
                  <tr key={e.id}>
                    <td>
                      <code>{e.operationId}</code>
                    </td>
                    <td>{labels[e.account] || e.account}</td>
                    <td className="finance-money">
                      {e.amount.replace(/\B(?=(\d{3})+(?!\d))/g, " ")}
                    </td>
                    <td>{e.currency}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="finance-hint">Jurnal hali bo‘sh.</p>
        )}
      </details>
    </div>
  );
}

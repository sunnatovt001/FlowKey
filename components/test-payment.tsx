"use client";
import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Check,
  CheckCircle2,
  X,
  Clock3,
  Play,
  ShieldCheck,
  ArrowRight,
  FlaskConical,
  LoaderCircle,
  ChevronDown,
} from "lucide-react";
import { Code } from "./copy";
import { money } from "./ui";
import {
  testAmount,
  testPaymentReply,
  type TestOutcome,
  type TestPaymentReply,
} from "@/shared/testing-payment";
const choices = [
  {
    id: "successful" as const,
    title: "Muvaffaqiyatli",
    detail: "To‘lov amalga oshadi",
    Icon: Check,
  },
  {
    id: "failed" as const,
    title: "Rad etilgan",
    detail: "To‘lov amalga oshmaydi",
    Icon: X,
  },
  {
    id: "pending" as const,
    title: "Kutilmoqda",
    detail: "Natija hali tayyor emas",
    Icon: Clock3,
  },
];
export function TestPayment({ projectId }: { projectId: string }) {
  const router = useRouter();
  const pending = useRef(false);
  const intent = useRef<{
    key: string;
    amount: number;
    outcome: TestOutcome;
  } | null>(null);
  const [amount, setAmount] = useState("49 000"),
    [outcome, setOutcome] = useState<TestOutcome>("successful"),
    [busy, setBusy] = useState(false),
    [uncertain, setUncertain] = useState(false),
    [error, setError] = useState(""),
    [result, setResult] = useState<TestPaymentReply | null>(null);
  const locked = busy || uncertain;
  const outcomeInfo = result
    ? choices.find((c) => c.id === result.status)
    : null;
  return (
    <div className="test-payment-grid">
      <section
        className="test-setup test-surface"
        aria-labelledby="test-setup-title"
      >
        <h2 id="test-setup-title">1. Sinovni sozlang</h2>
        <form
          method="post"
          aria-busy={busy}
          onSubmit={async (e) => {
            e.preventDefault();
            if (pending.current) return;
            const minor = testAmount(amount);
            if (minor === null && !intent.current) {
              setError(
                "0,01 dan 10 000 000 so‘mgacha summa kiriting. Kasr qismi ko‘pi bilan 2 xonali bo‘lsin.",
              );
              return;
            }
            intent.current ??= {
              key: crypto.randomUUID(),
              amount: minor!,
              outcome,
            };
            const request = intent.current;
            pending.current = true;
            setBusy(true);
            setError("");
            setResult(null);
            try {
              const response = await fetch(
                `/api/projects/${encodeURIComponent(projectId)}/payments`,
                {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    "Idempotency-Key": request.key,
                  },
                  body: JSON.stringify({
                    amount_minor: request.amount,
                    currency: "UZS",
                    result: request.outcome,
                  }),
                },
              );
              const json = await response.json();
              if (!response.ok) {
                if (response.status >= 400 && response.status < 500) {
                  intent.current = null;
                  setUncertain(false);
                } else setUncertain(true);
                throw Error(
                  json?.error?.message || "So‘rovni bajarib bo‘lmadi.",
                );
              }
              if (!testPaymentReply(json, projectId, request.amount)) {
                setUncertain(true);
                throw Error(
                  "Natija tasdiqlanmadi. Shu so‘rovni qayta tekshiring.",
                );
              }
              setResult(json);
              setUncertain(false);
              intent.current = null;
              router.refresh();
            } catch (e) {
              if (intent.current) setUncertain(true);
              setError(e instanceof Error ? e.message : "Ulanib bo‘lmadi.");
            } finally {
              pending.current = false;
              setBusy(false);
            }
          }}
        >
          <label htmlFor="test-amount">Summa</label>
          <div className="test-amount">
            <input
              id="test-amount"
              name="amount"
              inputMode="decimal"
              autoComplete="off"
              value={amount}
              onChange={(e) => {
                setAmount(e.target.value);
                setResult(null);
                setError("");
              }}
              disabled={locked}
              aria-invalid={Boolean(error && !uncertain)}
              aria-describedby={error ? "test-payment-error" : undefined}
            />
            <span>UZS</span>
          </div>
          <div
            className="test-amount-presets"
            role="group"
            aria-label="Tayyor sinov summalari"
          >
            {["10 000", "49 000", "100 000"].map((value) => (
              <button
                type="button"
                key={value}
                disabled={locked}
                aria-pressed={testAmount(amount) === testAmount(value)}
                onClick={() => {
                  setAmount(value);
                  setResult(null);
                  setError("");
                }}
              >
                {value}
              </button>
            ))}
          </div>
          <fieldset className="test-outcomes" disabled={locked}>
            <legend>Qaysi holatni tekshiramiz?</legend>
            {choices.map(({ id, title, detail, Icon }) => (
              <label className={"test-outcome " + id} key={id}>
                <input
                  type="radio"
                  name="test-outcome"
                  value={id}
                  checked={outcome === id}
                  onChange={() => {
                    setOutcome(id);
                    setResult(null);
                    setError("");
                  }}
                />
                <span className="test-outcome-icon">
                  <Icon size={22} />
                </span>
                <span className="test-outcome-text">
                  <strong>{title}</strong>
                  <small>{detail}</small>
                </span>
                <span className="test-radio" aria-hidden="true" />
              </label>
            ))}
          </fieldset>
          {error && (
            <p
              id="test-payment-error"
              className="test-payment-error"
              role="alert"
            >
              {error}
            </p>
          )}
          {uncertain && (
            <p className="test-uncertain">
              Natija aniqlanmaguncha summa va holat o‘zgarmaydi. Qayta
              tekshirish yangi to‘lov yaratmaydi.
            </p>
          )}
          <button className="test-run" disabled={busy}>
            {busy ? (
              <LoaderCircle size={20} className="test-spin" />
            ) : (
              <Play size={20} />
            )}{" "}
            {busy
              ? "Tekshirilmoqda…"
              : uncertain
                ? "Natijani qayta tekshirish"
                : "Sinovni boshlash"}
          </button>
          <p className="test-safe-note">
            <ShieldCheck size={16} />
            Kartangizdan pul yechilmaydi.
          </p>
        </form>
      </section>
      <section
        className="test-result test-surface"
        aria-labelledby="test-result-title"
        aria-busy={busy}
      >
        <div className="test-result-heading">
          <h2 id="test-result-title">2. Natijani ko‘ring</h2>
          <span>{busy ? "Jarayonda" : result ? "Sinov" : "Tayyor"}</span>
        </div>
        <div className="test-result-body" role="status" aria-live="polite">
          {result ? (
            <>
              <div className={"test-result-summary " + result.status}>
                <span className="test-result-icon">
                  {result.status === "successful" ? (
                    <CheckCircle2 size={64} />
                  ) : result.status === "failed" ? (
                    <X size={52} />
                  ) : (
                    <Clock3 size={56} />
                  )}
                </span>
                <h3>
                  {result.status === "successful"
                    ? "Sinov muvaffaqiyatli"
                    : result.status === "failed"
                      ? "Sinov rad etildi"
                      : "Natija kutilmoqda"}
                </h3>
                <strong>
                  {money(result.amount_minor)} <small>UZS</small>
                </strong>
              </div>
              <dl className="test-result-facts">
                <div>
                  <dt>Holat</dt>
                  <dd className={result.status}>{outcomeInfo?.title}</dd>
                </div>
                <div>
                  <dt>Rejim</dt>
                  <dd>Sinov</dd>
                </div>
                <div>
                  <dt>Haqiqiy pul</dt>
                  <dd>O‘tkazilmagan</dd>
                </div>
              </dl>
              <Link
                className="test-history-link"
                href={`/transactions?project=${projectId}&q=${encodeURIComponent(result.id)}`}
              >
                To‘lovlar tarixini ko‘rish
                <ArrowRight size={19} />
              </Link>
              <details className="test-json">
                <summary>
                  <ChevronDown size={18} />
                  Texnik javob (JSON)
                </summary>
                <Code>{JSON.stringify(result, null, 2)}</Code>
              </details>
            </>
          ) : (
            <div className="test-result-empty">
              {busy ? (
                <LoaderCircle size={46} className="test-spin" />
              ) : (
                <FlaskConical size={44} />
              )}
              <h3>
                {busy
                  ? "Sinov bajarilmoqda"
                  : uncertain
                    ? "Natijani tekshiring"
                    : "Sinovga tayyor"}
              </h3>
              <p>
                {busy
                  ? "Javob kelishi bilan shu yerda ko‘rinadi."
                  : uncertain
                    ? "Shu so‘rovni qayta tekshirish tugmasini bosing."
                    : "Summa va holatni tanlang, so‘ng sinovni boshlang."}
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

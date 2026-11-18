"use client";
import { statusLabel } from "@/shared/locale";
import { useRef, useState, type MouseEvent } from "react";
import { useRouter } from "next/navigation";
export function CheckoutAction({
  id,
  start = false,
}: {
  id: string;
  start?: boolean;
}) {
  const router = useRouter();
  const pending = useRef(false);
  const [requestKey] = useState(() => crypto.randomUUID());
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [done, setDone] = useState(false);
  const [retry, setRetry] = useState<string | null>(null);
  const [terminal, setTerminal] = useState(false);
  async function handleSubmit(result: string) {
    if (pending.current || done || terminal) return;
    pending.current = true;
    setBusy(true);
    setMessage("");
    const outcome = retry || result;
    try {
      const response = await fetch(
        start ? `/api/payment-links/${id}` : `/api/checkout/${id}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Idempotency-Key": requestKey,
          },
          body: JSON.stringify(start ? {} : { result: outcome }),
          signal: AbortSignal.timeout(15000),
        },
      );
      // A missing/unreadable response never proves the operation failed.
      const data = await response.json();
      if (!response.ok) {
        if (response.status >= 500) throw new Error("unknown");
        setMessage(
          data?.error?.message ||
            "So‘rov rad etildi. Sahifani yangilab tekshiring.",
        );
        setTerminal([400, 403, 404, 410].includes(response.status));
        setRetry(outcome);
        return;
      }
      if (
        !data ||
        typeof data.id !== "string" ||
        !data.id ||
        (start
          ? !/^[a-f0-9]{64}$/.test(data.id)
          : !["successful", "failed", "pending"].includes(data.status))
      )
        throw new Error("unknown");
      if (start) {
        setDone(true);
        router.push(`/checkout/${data.id}`);
        return;
      }
      setDone(true);
      setRetry(null);
      setMessage(
        `Sinov to‘lovi: ${statusLabel(data.status)}. Tranzaksiya: ${data.id}. Pul o‘tkazilmadi.${data.status === "pending" ? " Natija kutilmoqda; qayta to‘lov boshlamang." : ""}`,
      );
    } catch {
      setRetry(outcome);
      setMessage(
        "Natija tasdiqlanmadi. Yangi to‘lov boshlamang. Quyidagi tugma bilan aynan shu so‘rov natijasini qayta tekshiring.",
      );
    } finally {
      pending.current = false;
      setBusy(false);
    }
  }
  function onResultClick(event: MouseEvent<HTMLButtonElement>) {
    void handleSubmit(event.currentTarget.value);
  }
  return (
    <div aria-busy={busy}>
      {!start && !done && !retry && (
        <p className="muted">
          Sinov natijasini tanlang. Karta ma’lumotlari kerak emas.
        </p>
      )}
      <div className="nav-actions checkout-actions">
        {retry && !terminal ? (
          <button
            className="button primary"
            disabled={busy || done}
            value={retry}
            onClick={onResultClick}
          >
            {busy ? "Tekshirilmoqda…" : "Natijani qayta tekshirish"}
          </button>
        ) : (
          !terminal &&
          (start
            ? ["Sinov to‘lov sahifasiga o‘tish"]
            : ["successful", "failed", "pending"]
          ).map((result) => (
            <button
              key={result}
              className="button primary"
              disabled={busy || done}
              value={result}
              onClick={onResultClick}
            >
              {busy ? "Bajarilmoqda…" : start ? result : statusLabel(result)}
            </button>
          ))
        )}
      </div>
      <p role="status" aria-live="polite" style={{ overflowWrap: "anywhere" }}>
        {message}
      </p>
    </div>
  );
}

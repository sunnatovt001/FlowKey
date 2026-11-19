"use client";
import { statusLabel } from "@/shared/locale";
import { useEffect, useRef, useState, type MouseEvent } from "react";
import Script from "next/script";
import { useRouter } from "next/navigation";
export function CheckoutAction({
  id,
  start = false,
  telegram,
  nonce,
}: {
  id: string;
  start?: boolean;
  telegram?: string;
  nonce?: string;
}) {
  const router = useRouter();
  const [telegramReady, setTelegramReady] = useState(false);
  const pending = useRef(false);
  const [requestKey] = useState(() => crypto.randomUUID());
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [done, setDone] = useState(false);
  const [retry, setRetry] = useState<string | null>(null);
  const [terminal, setTerminal] = useState(false);
  async function handleSubmit(result: string) {
    if (pending.current || done || terminal || (telegram && !telegramReady)) return;
    const checkout = `/api/checkout/${id}${telegram ? `?telegram=${encodeURIComponent(telegram)}` : ""}`;
    pending.current = true;
    setBusy(true);
    setMessage("");
    const outcome = retry || result;
    try {
      const response = await fetch(
        start ? `/api/payment-links/${id}` : checkout,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Idempotency-Key": requestKey,
          },
          body: JSON.stringify(start ? {} : {
            result: outcome,
            ...(telegram && { initData: window.Telegram?.WebApp?.initData }),
          }),
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
      router.refresh();
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
      {telegram && (
        <>
          <Script
            src="https://telegram.org/js/telegram-web-app.js"
            nonce={nonce}
            onReady={() => {
              const app = window.Telegram?.WebApp;
              app?.ready();
              setTelegramReady(!!app?.initData);
            }}
          />
          {!telegramReady && <p role="status">To‘lovni tasdiqlash uchun buyurtmani Telegram botidan oching.</p>}
        </>
      )}
      {!start && !done && !retry && (
        <p className="muted">
          Sinov natijasini tanlang. Karta ma’lumotlari kerak emas.
        </p>
      )}
      <div className="nav-actions checkout-actions">
        {retry && !terminal ? (
          <button
            className="button primary"
            disabled={busy || done || (!!telegram && !telegramReady)}
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
              disabled={busy || done || (!!telegram && !telegramReady)}
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

export function CheckoutWatch({ id }: { id: string }) {
  const router = useRouter();
  useEffect(() => {
    const controller = new AbortController();
    let checking = false;
    const refresh = async () => {
      if (checking || document.visibilityState !== "visible") return;
      checking = true;
      try {
        const response = await fetch(`/api/checkout/${id}`, { signal: controller.signal, cache: "no-store" });
        if (response.status === 404 || (response.ok && (await response.json()).changed)) {
          router.refresh();
        }
      } catch {
        // A temporary network failure is retried on the next check.
      } finally {
        checking = false;
      }
    };
    const timer = window.setInterval(refresh, 5000);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      controller.abort();
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [id, router]);
  return null;
}

export function RenewCheckout({ id }: { id: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function renew() {
    setBusy(true);
    setError("");
    try {
      const response = await fetch(`/api/checkout/${id}?refresh=1`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{}",
      });
      if (!response.ok) throw new Error();
      router.refresh();
    } catch {
      setError("To‘lov havolasini yangilab bo‘lmadi. Qayta urinib ko‘ring.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <button className="button primary" disabled={busy} onClick={renew}>
        {busy ? "Yangilanmoqda…" : "To‘lov havolasini yangilash"}
      </button>
      {error && <p role="alert">{error}</p>}
    </div>
  );
}

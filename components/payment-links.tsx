"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Code } from "./copy";
import { IntegrationPrompts } from "./integration-prompts";
import { paymentButton, uzsToMinor } from "@/server/checkout-validation";
export function PaymentLinks({
  projectId,
  links,
  method = "Havola",
}: {
  projectId: string;
  links: { id: string; title: string; url: string; disabled: boolean }[];
  method?: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function request(verb: string, data: unknown) {
    setBusy(true);
    setError("");
    try {
      const r = await fetch(`/api/projects/${projectId}/payment-links`, {
        method: verb,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await r.json();
      if (!r.ok) throw new Error(result.error?.message || "Saqlab bo‘lmadi.");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Qayta urinib ko‘ring.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="panel integration-result">
      <h2>Unit yarating</h2>

      <form
        className="payment-link-form"
        onSubmit={(e) => {
          e.preventDefault();
          const data = new FormData(e.currentTarget);
          try {
            void request("POST", {
              title: data.get("title"),
              amount_minor: uzsToMinor(String(data.get("amount"))),
              currency: "UZS",
            });
          } catch (e) {
            setError(e instanceof Error ? e.message : "Summani tekshiring.");
          }
        }}
      >
        <label>
          Unit nomi
          <input
            name="title"
            required
            maxLength={120}
            placeholder="Masalan, kursga kirish"
            disabled={busy}
          />
        </label>
        <label>
          Summa (so‘m)
          <input
            name="amount"
            required
            inputMode="decimal"
            placeholder="125000"
            disabled={busy}
          />
          <span className="muted">
            0,01 dan 10 000 000 so‘mgacha. Kasr uchun nuqta ishlating.
          </span>
        </label>
        <button className="button primary" disabled={busy}>
          {busy ? "Yaratilmoqda…" : "Unit yaratish"}
        </button>
      </form>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      {!links.length && <p>Hozircha Unit yo‘q.</p>}
      {links.map((link) => {
        const value =
          method === "Script"
            ? `<script src="${new URL(link.url).origin}/unit.js" data-unit="${link.id}" defer></script>`
            : method === "Tugma"
              ? paymentButton(link.url)
              : link.url;
        return (
          <article key={link.id} className="unit-result">
            <h3>
              {link.title}
              {link.disabled ? " · O‘chirilgan" : ""}
            </h3>
            {!link.disabled && (
              <>
                <p>
                  {method === "Havola"
                    ? "Havolani nusxalab, mijozingizga yuboring."
                    : "Kodni nusxalab, saytingiz HTML sahifasiga joylang."}
                </p>
                <Code>{value}</Code>
                <a
                  className="button secondary"
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Sahifani ko‘rish
                </a>
                <IntegrationPrompts
                  projectId={projectId}
                  method={method}
                  value={value}
                />
                <button
                  className="button secondary danger-link"
                  disabled={busy}
                  onClick={() => request("DELETE", { id: link.id })}
                >
                  Unitni o‘chirish
                </button>
              </>
            )}
          </article>
        );
      })}
    </section>
  );
}

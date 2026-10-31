"use client";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { PaymentLinks } from "./payment-links";
export function IntegrationChooser({
  projectId,
  links,
  children,
}: {
  projectId: string;
  links: { id: string; title: string; url: string; disabled: boolean }[];
  children: React.ReactNode;
}) {
  const query = useSearchParams();
  const [method, setMethod] = useState(query.get("method") || (query.has("tab") ? "API kaliti" : ""));
  const options = [
    ["API kaliti", "Dasturingiz serveridan to‘lov yaratish."],
    ["Token", "API so‘rovlarini Bearer token bilan tasdiqlash."],
    ["Havola", "Tayyor to‘lov sahifasini mijozga yuborish."],
    ["Script", "Saytingizga tayyor to‘lov oynasini qo‘shish."],
    ["Tugma", "Saytingizga «To‘lash» tugmasini qo‘shish."],
  ];
  return (
    <section data-tour="integration">
      <h2>Qanday ulashni xohlaysiz?</h2>
      <p>O‘zingizga qulay usulni tanlang. Keyingi qadamni birga bajaramiz.</p>
      <div
        className="integration-options"
        role="group"
        aria-label="Ulash usuli"
      >
        {options.map(([name, description]) => (
          <button
            key={name}
            className={`button secondary integration-option ${method === name ? "selected" : ""}`}
            aria-pressed={method === name}
            onClick={() => { setMethod(name); const url=new URL(window.location.href); url.searchParams.set("method",name); window.history.replaceState(null,"",url); }}
          >
            <strong>{name}</strong>
            <span>{description}</span>
          </button>
        ))}
      </div>
      {["API kaliti", "Token"].includes(method) ? (
        <>
          <p className="notice">
            {method === "Token"
              ? "Token — API kalitining Bearer orqali ishlatilishi. Alohida kalit yarating va uni faqat serverda saqlang."
              : "Kalit yarating yoki loyiha yaratishda berilgan kalitdan foydalaning."}
          </p>
          {children}
        </>
      ) : method ? (
        <PaymentLinks
          key={method}
          projectId={projectId}
          links={links}
          method={method}
        />
      ) : (
        <p className="muted">
          Boshlash uchun yuqoridagi usullardan birini tanlang.
        </p>
      )}
    </section>
  );
}

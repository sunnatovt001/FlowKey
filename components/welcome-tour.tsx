"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
export function WelcomeTour({
  userKey,
  projectId,
}: {
  userKey: string;
  projectId: string;
}) {
  const [step, setStep] = useState<number | null>(null);
  const pathname = usePathname();
  const storageKey = `flowkey-tour-v1:${userKey}`;
  const steps = [
    {
      title: "FlowKey’ga xush kelibsiz",
      text: "Avval loyihangizni yarating. Uning nomi va sayt manzilini kiriting. API kaliti avtomatik beriladi.",
      href: "/settings#create-project",
      action: "Loyiha yaratish",
      target: "#create-project",
    },
    {
      title: "API kalitingizni saqlang",
      text: "Loyiha yaratilgach kalit bir marta ko‘rsatiladi. Yo‘qolsa, Ulash bo‘limida yangi kalit yaratishingiz mumkin. Kalit faqat serverda saqlanadi.",
      href: `/developers?project=${projectId}`,
      action: "Ulash bo‘limiga o‘tish",
      target: '[data-tour="integration"]',
    },
    {
      title: "Qulay ulash usulini tanlang",
      text: "API kaliti, token, tayyor havola, script yoki tugmani tanlang. GPT va Claude promptlari saytingizga ulashda yordam beradi.",
      href: `/developers?project=${projectId}`,
      action: "Ulash usullarini ko‘rish",
      target: '[data-tour="integration"]',
    },
    {
      title: "Birinchi Unit’ni sinang",
      text: "Unit nomi va summasini kiriting. Tayyor sahifani oching va to‘lov natijasini tanlang. Haqiqiy pul ishlatilmaydi.",
      href: `/developers?project=${projectId}`,
      action: "Unit yaratish",
      target: '[data-tour="integration"]',
    },
    {
      title: "Natijalarni kuzating",
      text: "Tranzaksiyalar bo‘limida summa, holat va to‘lov tarixini ko‘rasiz. Qo‘llanmani Yordam tugmasidan istalgan payt qayta oching.",
      href: `/transactions?project=${projectId}`,
      action: "Tranzaksiyalarni ko‘rish",
      target: 'nav[aria-label="Kabinet menyusi"]',
    },
  ];
  useEffect(() => {
    // Hydrate optional browser-only progress after the server render.
    /* eslint-disable react-hooks/set-state-in-effect */
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved !== "done" && saved !== "skipped")
        setStep(
          saved === null ? 0 : Math.min(4, Math.max(0, Number(saved) || 0)),
        );
    } catch {
      setStep(0);
    }
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [storageKey]);
  useEffect(() => {
    if (step === null) return;
    const target = document.querySelector(steps[step].target);
    target?.classList.add("tour-highlight");
    return () => target?.classList.remove("tour-highlight");
  }, [step, pathname]); // eslint-disable-line react-hooks/exhaustive-deps
  function move(next: number | null, done = false) {
    setStep(next);
    try {
      localStorage.setItem(
        storageKey,
        next === null ? (done ? "done" : "skipped") : String(next),
      );
    } catch {}
  }
  return (
    <>
      <button
        type="button"
        className="button secondary tour-help"
        onClick={() => move(0)}
      >
        Yordam · Qanday boshlayman?
      </button>
      {step !== null && (
        <aside className="tour-panel" aria-label="Boshlash qo‘llanmasi">
          <p className="muted">
            {step + 1} / {steps.length} qadam
          </p>
          <h2>{steps[step].title}</h2>
          <p>{steps[step].text}</p>
          <Link className="text-link" href={steps[step].href}>
            {steps[step].action}
          </Link>
          <div className="tour-actions">
            <button
              className="button secondary"
              disabled={step === 0}
              onClick={() => move(step - 1)}
            >
              Orqaga
            </button>
            <button
              className="button primary"
              onClick={() => (step === 4 ? move(null, true) : move(step + 1))}
            >
              {step === 4 ? "Tugatish" : "Keyingi"}
            </button>
          </div>
          <button className="text-link" onClick={() => move(null)}>
            Hozircha o‘tkazib yuborish
          </button>
        </aside>
      )}
    </>
  );
}

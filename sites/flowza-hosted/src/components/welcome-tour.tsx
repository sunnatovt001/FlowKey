"use client";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "@/components/site-link";
import { usePathname, useRouter } from "next/navigation";
export function WelcomeTour({
  userKey,
  projectId,
}: {
  userKey: string;
  projectId: string;
}) {
  const [step, setStep] = useState<number | null>(null);
  const [spotlight, setSpotlight] = useState<{
    top: number;
    left: number;
    width: number;
    height: number;
  } | null>(null);
  const panel = useRef<HTMLElement>(null);
  const router = useRouter();
  const pathname = usePathname();
  const storageKey = `flowkey-tour-v1:${userKey}`;
  const steps = [
    {
      title: "FlowKey’ga xush kelibsiz",
      text: "Loyiha nomini kiriting — API kaliti avtomatik yaratiladi.",
      href: "/settings#create-project",
      action: "Loyiha yaratish",
      target: '[data-tour="create-project"]',
    },
    {
      title: "API kalitingizni saqlang",
      text: "Kalit bir marta ko‘rsatiladi. Uni xavfsiz saqlang.",
      href: `/developers?project=${projectId}`,
      action: "Ulash bo‘limiga o‘tish",
      target: ".integration-options",
    },
    {
      title: "Qulay ulash usulini tanlang",
      text: "Ulash usulini tanlang. Tayyor GPT va Claude promptlaridan foydalanishingiz mumkin.",
      href: `/developers?project=${projectId}`,
      action: "Ulash usullarini ko‘rish",
      target: ".integration-options",
    },
    {
      title: "Birinchi Unit’ni sinang",
      text: "Nom va summani kiriting, so‘ng sinov to‘lovini bajaring.",
      href: `/developers?project=${projectId}`,
      action: "Unit yaratish",
      target: ".integration-options",
    },
    {
      title: "Natijalarni kuzating",
      text: "To‘lov holati va tarixini shu bo‘limda kuzating.",
      href: `/transactions?project=${projectId}`,
      action: "Tranzaksiyalarni ko‘rish",
      target: 'nav[aria-label="Kabinet menyusi"]',
    },
  ];
  useEffect(() => {
    // Show the guide only on this account's first visit in this browser.
    /* eslint-disable react-hooks/set-state-in-effect */
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved === null) {
        localStorage.setItem(storageKey, "seen");
        setStep(0);
      }
    } catch {
      setStep(0);
    }
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [storageKey]);
  useEffect(() => {
    if (step === null) return;
    let frame = 0;
    const route = steps[step].href.split("?")[0].split("#")[0];
    const target =
      document.querySelector(steps[step].target) ||
      document.querySelector(`nav a[href^="${route}"]`);
    const measure = () => {
      const rect = target?.getBoundingClientRect();
      setSpotlight(
        rect && rect.width && rect.height
          ? {
              top: Math.max(8, rect.top - 8),
              left: Math.max(8, rect.left - 8),
              width: Math.max(
                0,
                Math.min(innerWidth - 8, rect.right + 8) -
                  Math.max(8, rect.left - 8),
              ),
              height: Math.max(
                0,
                Math.min(innerHeight - 8, rect.bottom + 8) -
                  Math.max(8, rect.top - 8),
              ),
            }
          : null,
      );
    };
    const schedule = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(measure);
    };
    measure();
    target?.scrollIntoView({ block: "start", behavior: "instant" });
    schedule();
    const observer = new ResizeObserver(schedule);
    observer.observe(document.body);
    if (target) observer.observe(target);
    window.addEventListener("resize", schedule);
    window.addEventListener("scroll", schedule, true);
    panel.current?.focus({ preventScroll: true });
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("resize", schedule);
      window.removeEventListener("scroll", schedule, true);
    };
  }, [step, pathname]); // eslint-disable-line react-hooks/exhaustive-deps
  function move(next: number | null, done = false) {
    setStep(next);
    try {
      localStorage.setItem(
        storageKey,
        next === null ? (done ? "done" : "skipped") : "seen",
      );
    } catch {}
  }
  function navigate(next: number) {
    move(next);
    window.location.assign(steps[next].href);
  }
  useEffect(() => {
    if (step === null) return;
    const dismiss = (event: KeyboardEvent) => {
      if (event.key === "Escape") move(null);
    };
    window.addEventListener("keydown", dismiss);
    return () => window.removeEventListener("keydown", dismiss);
  }, [step]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <>
      {step !== null &&
        createPortal(
          <div className="tour-layer">
            <div
              className={spotlight ? "tour-spotlight" : "tour-backdrop"}
              style={spotlight || undefined}
              aria-hidden="true"
            />
            <aside
              ref={panel}
              tabIndex={-1}
              className="tour-panel"
              role="dialog"
              aria-labelledby="tour-title"
              aria-describedby="tour-description"
              style={
                spotlight && spotlight.left > window.innerWidth / 2
                  ? { left: 16, right: "auto" }
                  : undefined
              }
            >
              <button
                type="button"
                className="tour-close"
                aria-label="Qo‘llanmani yopish"
                onClick={() => move(null)}
              >
                ×
              </button>
              <p className="muted">
                {step + 1} / {steps.length} qadam
              </p>
              <h2 id="tour-title">{steps[step].title}</h2>
              <p id="tour-description">{steps[step].text}</p>
              <Link className="text-link" href={steps[step].href}>
                {steps[step].action}
              </Link>
              <div className="tour-actions">
                <button
                  className="button secondary"
                  disabled={step === 0}
                  onClick={() => navigate(step - 1)}
                >
                  Orqaga
                </button>
                <button
                  className="button primary"
                  onClick={() =>
                    step === 4 ? move(null, true) : navigate(step + 1)
                  }
                >
                  {step === 4 ? "Tugatish" : "Keyingi"}
                </button>
              </div>
              <button className="text-link" onClick={() => move(null)}>
                Hozircha o‘tkazib yuborish
              </button>
            </aside>
          </div>,
          document.body,
        )}
    </>
  );
}

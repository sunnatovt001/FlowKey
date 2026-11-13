"use client";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
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
  const claimedFor = useRef<string | null>(null);
  const router = useRouter();
  const pathname = usePathname();
  const storageKey = `flowkey-tour-v1:${userKey}`;
  const steps = [
    {
      title: "FlowKey’ga xush kelibsiz",
      text: "Dashboard’da to‘lovlar, loyiha faolligi va ulanish holatini ko‘rasiz.",
      href: `/dashboard?project=${projectId}`,
      action: "Dashboard’ni ko‘rish",
      target: 'nav a[href^="/dashboard"]',
    },
    {
      title: "API kalitingizni saqlang",
      text: "Kalit bir marta ko‘rsatiladi. Uni xavfsiz saqlang.",
      href: `/developers?project=${projectId}`,
      action: "Ulash bo‘limiga o‘tish",
      target: ".integration-methods",
    },
    {
      title: "Qulay ulash usulini tanlang",
      text: "Ulash usulini tanlang. Tayyor GPT va Claude promptlaridan foydalanishingiz mumkin.",
      href: `/developers?project=${projectId}`,
      action: "Ulash usullarini ko‘rish",
      target: ".integration-methods",
    },
    {
      title: "Sinov markazida tekshiring",
      text: "To‘lov, webhook va boshqa sinovlarni shu sahifada bajaring.",
      href: `/testing?project=${projectId}`,
      action: "Sinov markazini ochish",
      target: ".testing-center",
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
    if (claimedFor.current === storageKey) return;
    claimedFor.current = storageKey;
    // The database claim is atomic: only one tab/device gets the first tour.
    fetch("/api/settings/welcome-tour", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ alreadySeen: false }),
    })
      .then(async (response) => {
        if (!response.ok) return;
        const result = await response.json();
        if (claimedFor.current === storageKey && result.show === true)
          setStep(0);
      })
      .catch(() => {
        /* Keep the workspace usable if persistence is unavailable. */
      });
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
  function move(next: number | null) {
    setStep(next);
  }
  function navigate(next: number) {
    move(next);
    router.push(steps[next].href);
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
                  onClick={() => (step === 4 ? move(null) : navigate(step + 1))}
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

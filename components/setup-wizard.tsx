"use client";
import { useRef, useState } from "react";
import { Logo } from "./ui";
import { SetupProgress } from "./setup-progress";
import { FirstProjectForm } from "./first-project-form";
import { ArrowRight, LoaderCircle } from "lucide-react";
import { businessLabel } from "@/shared/locale";
export function SetupWizard({
  initial,
  initialStep,
  avatar,
  existing = false,
}: {
  initial?: { name: string; type: string };
  initialStep: 1 | 2;
  avatar: string;
  existing?: boolean;
}) {
  const [step, setStep] = useState<1 | 2>(initialStep),
    [name, setName] = useState(initial?.name || ""),
    [type, setType] = useState(initial?.type || "Startup"),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const pending = useRef(false),
    heading = useRef<HTMLHeadingElement>(null);
  function move(next: 1 | 2) {
    setStep(next);
    requestAnimationFrame(() =>
      heading.current?.focus({ preventScroll: true }),
    );
  }
  return (
    <div className="project-setup">
      <header className="project-setup-header">
        <Logo />
        <span
          className="project-setup-avatar"
          aria-label="Foydalanuvchi profili"
        >
          {avatar}
        </span>
      </header>
      <main className="project-setup-main">
        <SetupProgress step={step} />
        <h1 ref={heading} tabIndex={-1}>
          {step === 1
            ? "Mahsulotingiz haqida ayting"
            : existing
              ? "Yangi loyiha yarating"
              : "Birinchi loyihangizni yarating"}
        </h1>
        <p className="project-setup-intro">
          {step === 1
            ? "Keyingi qadamda birinchi loyihangizni yaratasiz."
            : "Loyihangizni nomlang va ulashni boshlang."}
        </p>
        <div hidden={step !== 1}>
          <form
            className="project-setup-card"
            aria-busy={busy}
            onSubmit={async (e) => {
              e.preventDefault();
              if (pending.current) return;
              pending.current = true;
              setBusy(true);
              setError("");
              try {
                const r = await fetch("/api/onboarding", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    businessName: name,
                    businessType: type,
                  }),
                });
                const data = await r.json();
                if (!r.ok)
                  throw Error(data.error?.message || "Saqlab bo‘lmadi.");
                move(2);
              } catch (e) {
                setError(
                  e instanceof Error ? e.message : "Qayta urinib ko‘ring.",
                );
              } finally {
                pending.current = false;
                setBusy(false);
              }
            }}
          >
            <label htmlFor="setup-product">Mahsulot nomi</label>
            <input
              id="setup-product"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              minLength={2}
              maxLength={100}
              disabled={busy}
              placeholder="Mahsulotingiz nomi"
            />
            <label htmlFor="setup-type">Mahsulot turi</label>
            <select
              id="setup-type"
              value={type}
              onChange={(e) => setType(e.target.value)}
              disabled={busy}
            >
              {["Startup", "Online platform", "Company", "Individual"].map(
                (t) => (
                  <option key={t} value={t}>
                    {businessLabel(t)}
                  </option>
                ),
              )}
            </select>
            {error && (
              <p className="error" role="alert">
                {error}
              </p>
            )}
            <button className="button primary full" disabled={busy}>
              {busy ? (
                <>
                  <LoaderCircle className="spin" size={18} />
                  Saqlanmoqda…
                </>
              ) : (
                <>
                  Davom etish
                  <ArrowRight size={20} />
                </>
              )}
            </button>
          </form>
        </div>
        <div hidden={step !== 2}>
          <FirstProjectForm backHref="/settings" onBack={() => move(1)} />
        </div>
      </main>
      <footer className="project-setup-footer">FlowKey</footer>
    </div>
  );
}

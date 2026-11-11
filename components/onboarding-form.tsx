"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { businessLabel } from "@/shared/locale";
export function OnboardingForm({
  draftKey,
  initial,
}: {
  draftKey: string;
  initial?: { name: string; type: string };
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  return (
    <div className="onboarding-card">
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setError("");
          try {
            const values = Object.fromEntries(new FormData(e.currentTarget));
            const response = await fetch("/api/onboarding", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(values),
            });
            const result = await response.json();
            if (!response.ok)
              throw new Error(
                result.error?.message || "Ma’lumotlarni saqlab bo‘lmadi.",
              );
            try {
              sessionStorage.removeItem(draftKey);
            } catch {}
            router.push(result.project ? "/dashboard" : "/projects/new");
            router.refresh();
          } catch (e) {
            setError(e instanceof Error ? e.message : "Qayta urinib ko‘ring.");
          } finally {
            setBusy(false);
          }
        }}
      >
        <h1>Mahsulotingiz haqida ayting.</h1>
        <p className="muted">
          Keyingi qadamda birinchi loyihangizni yaratasiz.
        </p>
        <label>
          Mahsulot nomi
          <input
            name="businessName"
            defaultValue={initial?.name}
            required
            minLength={2}
            maxLength={100}
            placeholder="Mahsulotingiz nomi"
          />
        </label>
        <label>
          Mahsulot turi
          <select name="businessType" defaultValue={initial?.type || "Startup"}>
            {["Startup", "Online platform", "Company", "Individual"].map(
              (v) => (
                <option key={v} value={v}>
                  {businessLabel(v)}
                </option>
              ),
            )}
          </select>
        </label>
        {error && (
          <p role="alert" className="error">
            {error}
          </p>
        )}
        <div className="form-actions">
          <button className="button primary" disabled={busy}>
            {busy ? "Saqlanmoqda…" : "Davom etish"}
          </button>
        </div>
      </form>
    </div>
  );
}

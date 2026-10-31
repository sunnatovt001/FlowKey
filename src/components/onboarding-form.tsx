"use client";
import { useState } from "react";

import { businessLabel } from "@/shared/locale";
export function OnboardingForm({ draftKey }: { draftKey: string }) {

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
            const result = await response.json() as {error?:{message:string}};
            if (!response.ok)
              throw new Error(
                result.error?.message || "Ma’lumotlarni saqlab bo‘lmadi.",
              );
            try {
              sessionStorage.removeItem(draftKey);
            } catch {}
            window.location.assign("/settings?welcome=1#create-project");
            
          } catch (e) {
            setError(e instanceof Error ? e.message : "Qayta urinib ko‘ring.");
          } finally {
            setBusy(false);
          }
        }}
      >
        <h1>Mahsulotingiz haqida ayting.</h1>
        <p className="muted">
          Kabinetni oching. Loyihani keyin kabinet ichida yaratasiz.
        </p>
        <label>
          Mahsulot nomi
          <input
            name="businessName"
            required
            minLength={2}
            maxLength={100}
            placeholder="Mahsulotingiz nomi"
          />
        </label>
        <label>
          Mahsulot turi
          <select name="businessType">
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
            {busy ? "Saqlanmoqda…" : "Kabinetga kirish"}
          </button>
        </div>
      </form>
    </div>
  );
}

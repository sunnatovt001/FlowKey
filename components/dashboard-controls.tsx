"use client";
import { useTransition } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { RefreshCw } from "lucide-react";
export function DashboardControls({ days }: { days: number }) {
  const router = useRouter(),
    path = usePathname(),
    query = useSearchParams();
  const [busy, start] = useTransition();
  return (
    <div className="dashboard-controls" aria-busy={busy}>
      <label className="sr-only" htmlFor="dashboard-range">
        Ko‘rsatkichlar davri
      </label>
      <select
        id="dashboard-range"
        value={String(days)}
        disabled={busy}
        onChange={(e) => {
          const params = new URLSearchParams(query);
          params.set("range", e.target.value);
          start(() => router.replace(`${path}?${params}`, { scroll: false }));
        }}
      >
        {[7, 30, 90].map((value) => (
          <option key={value} value={value}>
            Oxirgi {value} kun
          </option>
        ))}
      </select>
      <button
        type="button"
        aria-label="Dashboard’ni yangilash"
        title="Yangilash"
        disabled={busy}
        onClick={() => start(() => router.refresh())}
      >
        <RefreshCw size={19} className={busy ? "dashboard-refreshing" : ""} />
      </button>
      <span className="sr-only" role="status">
        {busy ? "Yangilanmoqda…" : ""}
      </span>
    </div>
  );
}

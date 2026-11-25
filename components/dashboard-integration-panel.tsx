"use client";
import { useId, useState, useSyncExternalStore, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { useLanguage } from "./i18n/language-provider";

const storageKey = "flowkey-dashboard-integration-collapsed";
const subscribe = (notify: () => void) => {
  window.addEventListener("storage", notify);
  return () => window.removeEventListener("storage", notify);
};
const readStorage = () => {
  try { return localStorage.getItem(storageKey) === "true"; } catch { return false; }
};
const initial = () => false;
const labels = {
  uz: ["API va ulanish", "Yashirish", "Ko‘rsatish"],
  ru: ["API и подключение", "Свернуть", "Развернуть"],
  en: ["API and integration", "Collapse", "Expand"],
} as const;

export function DashboardIntegrationPanel({ children }: { children: ReactNode }) {
  const { language } = useLanguage();
  const [title, hide, show] = labels[language];
  const id = useId();
  const saved = useSyncExternalStore(subscribe, readStorage, initial);
  const [override, setOverride] = useState<boolean | null>(null);
  const collapsed = override ?? saved;
  return (
    <section className="dashboard-card dashboard-integration" data-collapsed={collapsed}>
      <header className="dashboard-card-heading">
        <h2>{title}</h2>
        <button className="dashboard-integration-toggle" type="button" aria-controls={id}
          aria-expanded={!collapsed} onClick={() => {
            setOverride(!collapsed);
            try { localStorage.setItem(storageKey, String(!collapsed)); } catch { /* Page state still works. */ }
          }}>
          {collapsed ? show : hide}<ChevronDown size={16} aria-hidden="true" />
        </button>
      </header>
      <div className="dashboard-integration-body" id={id} hidden={collapsed}>{children}</div>
    </section>
  );
}

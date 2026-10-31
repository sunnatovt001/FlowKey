"use client";
import { WelcomeTour } from "./welcome-tour";
import { UserAvatar } from "./avatar";
import Link from "./site-link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  ArrowLeftRight,
  Code2,
  BookOpen,
  Settings,
  ChevronDown,
  LogOut,
  ArrowUpRight,
} from "lucide-react";
import { WorkspaceSidebar } from "./layout/workspace-sidebar";
export function AppShell({
  projects,
  email,
  children,
}: {
  projects: { id: string; name: string }[];
  email: string;
  children: React.ReactNode;
}) {
  const path = usePathname();
  const router = useRouter();
  const query = useSearchParams();
  const selected = query.get("project") || projects[0]?.id || "";
  const [error, setError] = useState("");
  return (
    <div className="app-shell">
      <WorkspaceSidebar path={path} selected={selected}/>
      <div className="app-main">
        <header className="app-header">
          <div className="project-picker">
            <span className="project-icon">
              {projects.find((p) => p.id === selected)?.name[0] || "F"}
            </span>
            <label className="sr-only" htmlFor="project">
              Loyiha
            </label>
            <select
              aria-label="Tanlangan loyiha"
              id="project"
              value={selected}
              onChange={(e) => {
                const params = new URLSearchParams(query);
                params.set("project", e.target.value);
                params.delete("page");
                router.push(`${path}?${params}`);
              }}
            >
              {!projects.some((project) => project.id === selected) &&
                selected && (
                  <option value={selected}>Arxivlangan loyiha · tarix</option>
                )}
              {!projects.length && (
                <option value="">Avval loyiha yarating</option>
              )}
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            <span className="sandbox-label">Unit</span>
          </div>
          <details className="profile-menu">
            <summary>
              <UserAvatar email={email} />
              <span className="profile-email">{email}</span>
              <ChevronDown size={14} />
            </summary>
            <div>
              <Link href={`/settings?project=${selected}`}>
                Hisob sozlamalari
              </Link>
              <button
                onClick={async () => {
                  try {
                    const r = await fetch("/api/auth/logout", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: "{}",
                    });
                    if (!r.ok) throw new Error();
                    const data = await r.json() as { redirect: string };
                    window.location.assign(data.redirect);
                  } catch {
                    setError("Hisobdan chiqib bo‘lmadi. Qayta urinib ko‘ring.");
                  }
                }}
              >
                <LogOut size={15} /> Chiqish
              </button>
              {error && <p role="alert">{error}</p>}
            </div>
          </details>
        </header>
        <main className="workspace-content">{children}</main>
        <WelcomeTour userKey={email} projectId={selected} />
        <div className="workspace-footer">
          FlowKey Unit muhiti{" "}
          <span>Haqiqiy to‘lovlar tez kunda · Hamkor tasdig‘i kutilmoqda</span>
        </div>
      </div>
    </div>
  );
}

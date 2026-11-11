"use client";
import { WelcomeTour } from "./welcome-tour";
import { UserAvatar } from "./avatar";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  LayoutDashboard,
  ArrowLeftRight,
  Code2,
  BookOpen,
  Settings,
  LogOut,
  ArrowUpRight,
  Wallet,
  Users,
  Repeat,
  History,
  ShieldCheck,
} from "lucide-react";
import { Logo } from "./ui";
import { roleAllows } from "@/shared/project-role";
const navigation = [
  ["/dashboard", "Dashboard", LayoutDashboard],
  ["/transactions", "Tranzaksiyalar", ArrowLeftRight],
  ["/developers", "Ulash", Code2],
  ["/finance", "Moliya", Wallet],
  ["/subscriptions", "Obunalar", Repeat],
  ["/team", "Jamoa", Users],
  ["/activity", "Faoliyat", History],
  ["/guide", "Qo‘llanma", BookOpen],
  ["/settings", "Hisob sozlamalari", Settings],
] as const;
export function AppShell({
  projects,
  email,
  children,
  isAdmin = false,
}: {
  projects: { id: string; name: string; role?: string }[];
  email: string;
  children: React.ReactNode;
  isAdmin?: boolean;
}) {
  const path = usePathname();
  const router = useRouter();
  const query = useSearchParams();
  const selected = query.get("project") || projects[0]?.id || "";
  const [error, setError] = useState("");
  const profileMenu = useRef<HTMLDetailsElement>(null);
  useEffect(() => {
    const closeOutside = (event: Event) => {
      const menu = profileMenu.current;
      if (menu?.open && event.target instanceof Node && !menu.contains(event.target))
        menu.open = false;
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      const menu = profileMenu.current;
      if (event.key === "Escape" && menu?.open) {
        menu.open = false;
        menu.querySelector("summary")?.focus();
      }
    };
    document.addEventListener("pointerdown", closeOutside, true);
    document.addEventListener("focusin", closeOutside, true);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOutside, true);
      document.removeEventListener("focusin", closeOutside, true);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, []);
  useEffect(() => {
    if (profileMenu.current) profileMenu.current.open = false;
  }, [path, selected]);
  const role = projects.find((p) => p.id === selected)?.role || "owner";
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <Logo />
        <nav aria-label="Kabinet menyusi">
          {navigation
            .filter(([href]) =>
              href === "/finance"
                ? roleAllows(role, "finance")
                : ["/developers", "/subscriptions"].includes(href)
                  ? roleAllows(role, "technical")
                  : ["/team", "/activity"].includes(href)
                    ? role === "owner"
                    : true,
            )
            .map(([href, label, Icon]) => (
              <Link
                className={path === href ? "active" : ""}
                href={href + (selected ? `?project=${selected}` : "")}
                key={href}
              >
                <Icon size={18} />
                {label}
              </Link>
            ))}
          {isAdmin && (
            <Link href="/admin" className={path.startsWith("/admin") ? "active" : ""}>
              <ShieldCheck size={18} />
              Admin panel
            </Link>
          )}
        </nav>
        <div className="sidebar-bottom">
          <Link href={`/guide?project=${selected}#quick-start`}>
            Yordam kerakmi? <ArrowUpRight size={14} />
          </Link>
        </div>
      </aside>
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
                if (e.target.value === "__new_project__") {
                  router.push(`/settings${selected ? `?project=${encodeURIComponent(selected)}` : ""}#create-project`);
                  return;
                }
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
              <option value="__new_project__">+ Yangi loyiha</option>
            </select>
            <span className="sandbox-label">Unit</span>
          </div>
          <details ref={profileMenu} className="profile-menu">
            <summary aria-label="Profil menyusi">
              <UserAvatar email={email} />
            </summary>
            <div>
              <Link href="/invitations" onClick={() => { if (profileMenu.current) profileMenu.current.open = false; }}>Loyiha takliflari</Link>
              <Link href={`/settings?project=${selected}`} onClick={() => { if (profileMenu.current) profileMenu.current.open = false; }}>
                Hisob sozlamalari
              </Link>
              <button
                onClick={async () => {
                  try {
                    const r = await fetch("/api/auth/sign-out", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: "{}",
                    });
                    if (!r.ok) throw new Error();
                    router.push("/login");
                    router.refresh();
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
          <span>Haqiqiy pul operatsiyalari ulanmagan</span>
        </div>
      </div>
    </div>
  );
}

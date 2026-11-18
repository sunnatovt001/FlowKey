"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  PanelsTopLeft,
  UsersRound,
  Layers,
  MessageSquare,
  ListChecks,
  Send,
  RefreshCw,
  Search,
} from "lucide-react";
const items = [
  ["/admin", "Dashboard", PanelsTopLeft],
  ["/admin/users", "Foydalanuvchilar", UsersRound],
  ["/admin/projects", "Loyihalar", Layers],
  ["/admin/tickets", "Murojaatlar", MessageSquare],
  ["/admin/audit", "Hodisalar", ListChecks],
  ["/admin/telegram", "Telegram", Send],
] as const;
export function AdminNav({ openTickets = 0 }: { openTickets?: number }) {
  const path = usePathname();
  return (
    <nav className="admin-nav" aria-label="Admin menyusi">
      {items.map(([href, label, Icon]) => (
        <Link
          href={href}
          key={href}
          aria-current={
            (href === "/admin" ? path === href : path.startsWith(href))
              ? "page"
              : undefined
          }
        >
          <Icon size={20} aria-hidden="true" />
          <span>{label}</span>
          {href === "/admin/tickets" && openTickets > 0 && (
            <span
              className="admin-nav-count"
              aria-label={`${openTickets} ta yangi murojaat`}
            >
              {openTickets}
            </span>
          )}
        </Link>
      ))}
    </nav>
  );
}
export function AdminBreadcrumbs() {
  const path = usePathname();
  const item = [...items]
    .reverse()
    .find(([href]) => path === href || path.startsWith(href + "/"));
  return (
    <div className="admin-breadcrumb">
      <Link href="/admin">Admin</Link>
      <span aria-hidden="true">/</span>
      <span>{item?.[1] || "Dashboard"}</span>
    </div>
  );
}
export function AdminRefresh() {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      className="button secondary admin-refresh"
      aria-label="Ma’lumotlarni yangilash"
      disabled={pending}
      onClick={() => start(() => router.refresh())}
    >
      <RefreshCw size={18} className={pending ? "spin" : ""} />
    </button>
  );
}
export function AdminTicketSearch({ q, state }: { q: string; state: string }) {
  const router = useRouter();
  const [text, setText] = useState(q);
  return (
    <form
      key={q}
      className="admin-dashboard-search"
      onSubmit={(event) => {
        event.preventDefault();
        const params = new URLSearchParams();
        params.set("state", state);
        if (text.trim()) params.set("q", text.trim().slice(0, 100));
        router.push("/admin?" + params);
      }}
    >
      <label>
        <Search size={17} aria-hidden="true" />
        <span className="sr-only">Murojaat ID yoki email</span>
        <input
          name="q"
          type="search"
          value={text}
          onChange={(event) => setText(event.target.value)}
          maxLength={100}
          placeholder="Murojaat ID yoki email"
        />
      </label>
      <button className="button secondary" type="submit">
        Qidirish
      </button>
    </form>
  );
}

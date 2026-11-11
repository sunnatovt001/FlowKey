"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Folder,
  LifeBuoy,
  History,
  Send,
} from "lucide-react";
const items = [
  ["/admin", "Umumiy ko‘rinish", LayoutDashboard],
  ["/admin/users", "Foydalanuvchilar", Users],
  ["/admin/projects", "Loyihalar", Folder],
  ["/admin/tickets", "Murojaatlar", LifeBuoy],
  ["/admin/audit", "Amallar jurnali", History],
  ["/admin/telegram", "Telegram", Send],
] as const;
export function AdminNav() {
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
          <Icon size={17} />
          {label}
        </Link>
      ))}
    </nav>
  );
}

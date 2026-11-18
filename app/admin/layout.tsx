import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { hasAdminSession } from "@/server/admin-session";
import { AdminLogout } from "@/components/admin-login";
import { pageUser } from "@/server/auth";
import { isPlatformAdmin } from "@/server/admin-access";
import { db } from "@/server/db";
import { Logo } from "@/components/ui";
import { AdminNav, AdminBreadcrumbs } from "@/components/admin-nav";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import "@/styles/admin.css";
import "@/styles/admin-dashboard.css";
export const metadata = { title: "Admin panel" };
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await pageUser();
  if (!isPlatformAdmin(user.id)) notFound();
  if (!(await hasAdminSession(user.id))) redirect("/admin-login");
  const openTickets = await db.supportTicket.count({
    where: { resolutionStatus: "open" },
  });
  return (
    <div className="admin-shell admin-workspace">
      <aside className="admin-sidebar">
        <div className="admin-brand">
          <Logo />
          <span>Admin panel</span>
        </div>
        <AdminNav openTickets={openTickets} />
        <div className="admin-sidebar-bottom">
          <Link href="/dashboard">
            <ArrowLeft size={18} />
            Kabinetga qaytish
          </Link>
          <AdminLogout />
        </div>
      </aside>
      <div className="admin-main">
        <header className="admin-topbar">
          <AdminBreadcrumbs />
          <div className="admin-session-label">
            <ShieldCheck size={18} />
            <span>Admin sessiya</span>
            <span className="admin-avatar" aria-label="Administrator">
              {user.name?.[0]?.toUpperCase() ||
                user.email[0]?.toUpperCase() ||
                "A"}
            </span>
          </div>
        </header>
        <main className="admin-content">{children}</main>
      </div>
    </div>
  );
}

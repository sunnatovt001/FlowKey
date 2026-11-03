import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { hasAdminSession } from "@/server/admin-session";
import { AdminLogout } from "@/components/admin-login";
import { pageUser } from "@/server/auth";
import { isPlatformAdmin } from "@/server/admin-access";
import { Logo } from "@/components/ui";
import { AdminNav } from "@/components/admin-nav";
import "@/styles/admin.css";
export const metadata = { title: "Admin panel" };
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await pageUser();
  if (!isPlatformAdmin(user.id)) notFound();
  if (!(await hasAdminSession(user.id))) redirect("/admin-login");
  return (
    <div className="admin-shell">
      <header className="admin-header">
        <Logo />
        <span>Admin panel</span>
        <AdminLogout />
        <Link className="button secondary" href="/dashboard">
          Kabinetga qaytish
        </Link>
      </header>
      <AdminNav />
      <main className="admin-content">{children}</main>
    </div>
  );
}

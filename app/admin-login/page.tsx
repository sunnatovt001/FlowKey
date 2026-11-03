import { notFound } from "next/navigation";
import { pageUser } from "@/server/auth";
import { isPlatformAdmin } from "@/server/admin-access";
import { AdminLogin } from "@/components/admin-login";
import { Logo } from "@/components/ui";
import "@/styles/admin.css";
export const metadata = {
  title: "Admin kirish",
  robots: { index: false, follow: false },
};
export default async function AdminLoginPage() {
  const user = await pageUser();
  if (!isPlatformAdmin(user.id)) notFound();
  return (
    <main className="admin-login-page">
      <section className="panel admin-login-card">
        <Logo />
        <h1>Admin panelga kirish</h1>
        <AdminLogin />
      </section>
    </main>
  );
}

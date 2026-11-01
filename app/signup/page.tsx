import { Logo } from "@/components/ui";
import { AuthForm } from "@/components/auth-form";
export const metadata = { title: "Hisob yarating" };
export default function Signup() {
  return (
    <main className="auth-page">
      <div className="auth-brand">
        <Logo />
        <div>
          <h2>
            Ajoyib mahsulot yarating.
            <br />
            Unit muhitidan boshlang.
          </h2>
        </div>
        <p>Faqat sinov. Haqiqiy pul ishlatilmaydi.</p>
      </div>
      <div className="auth-content">
        <div>
          <h1>Hisob yaratish</h1>

          <AuthForm
            signup
            localMail={
              process.env.NODE_ENV === "development" &&
              process.env.MAIL_TRANSPORT === "file"
            }
          />
        </div>
      </div>
    </main>
  );
}

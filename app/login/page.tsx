import { Logo } from "@/components/ui";
import { AuthForm } from "@/components/auth-form";
export const metadata = { title: "Kirish" };
export default function Login() {
  return (
    <main className="auth-page">
      <div className="auth-brand">
        <Logo />
        <div>
          <h2>
            Yangi mahsulotingiz
            <br />
            sodda jarayondan boshlanadi.
          </h2>
          <p>
            To‘lov integratsiyangiz uchun yagona kabinet.
            <br />
            O‘zbekiston dasturchilari uchun yaratilgan.
          </p>
          <div className="auth-terminal">
            <span>FlowKey Unit muhiti</span>
            <pre>{'{ "livemode": false,\n  "possibilities": "endless" }'}</pre>
          </div>
        </div>
        <p>Faqat sinov. Haqiqiy pul ishlatilmaydi.</p>
      </div>
      <div className="auth-content">
        <div>
          <h1>Qaytganingizdan xursandmiz.</h1>
          <p className="muted">Dasturchi kabinetingizga kiring.</p>
          <AuthForm
            signup={false}
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

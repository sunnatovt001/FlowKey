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
          <p>
            Loyiha yarating, kalit oling va birinchi to‘lovingizni sinang.
          </p>
          <ul className="auth-benefits">
            <li>Bir-biridan ajratilgan sinov loyihalari</li>
            <li>Oldindan belgilangan to‘lov natijalari</li>
            <li>Birinchi kundan tushunarli API</li>
          </ul>
        </div>
        <p>Faqat sinov. Haqiqiy pul ishlatilmaydi.</p>
      </div>
      <div className="auth-content">
        <div>
          <h1>Ishni boshlang.</h1>
          <p className="muted">To‘lov Unit muhitingizga bir necha qadam qoldi.</p>
          <AuthForm signup />
        </div>
      </div>
    </main>
  );
}

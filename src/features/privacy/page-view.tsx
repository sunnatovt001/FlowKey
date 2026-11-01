import { Logo } from "@/components/ui";
import Link from "@/components/site-link";

export const metadata = { title: "Maxfiylik" };

export default function Privacy() {
  return (
    <main className="privacy-page">
      <Logo />
      <h1>Maxfiylik</h1>
      <p className="muted">Yangilangan: 2026-yil 1-noyabr</p>
      <section>
        <h2>Hisob va kirish</h2>
        <p>
          FlowKey — to‘lov integratsiyalarini sinash muhiti. Kirish ChatGPT orqali amalga oshiriladi. ChatGPT hisobingiz identifikatori, elektron pochta va mavjud profil ismi hisobingizni tanish uchun ishlatiladi. ChatGPT parolingiz FlowKey’ga berilmaydi.
        </p>
      </section>
      <section>
        <h2>Saqlanadigan ma’lumotlar</h2>
        <p>
          Hisob ma’lumotlari, yuklangan profil rasmi, loyihalar, sinov
          to‘lovlari va sozlamalar serverda saqlanadi. Sessiya cookie’lari
          kirgan holatingizni saqlash uchun ishlatiladi. Kirish sessiyasi Sites xizmatida boshqariladi.
        </p>
        <p>
          Kirish suhbatlaringiz yoki GitHub repozitoriyalaringizni o‘qish ruxsatini bermaydi.
        </p>
      </section>
      <section>
        <h2>Telegram va AI yordamchi</h2>
        <p>
          Telegram yordamchisini ulasangiz, suhbat va murojaatlar hisobingizga
          bog‘lanadi. AI yordamchi sozlangan va ishlatilganida hisob
          diagnostikasi hamda tegishli suhbat konteksti AI xizmatiga yuboriladi.
          Maxfiy API kalitlari va parollar bu kontekstdan chiqarib tashlanadi.
        </p>
      </section>
      <section>
        <h2>Ruxsatlarni boshqarish</h2>
        <p>
          FlowKey hisobidan profil menyusi orqali chiqishingiz mumkin. Kirish faqat ChatGPT orqali mavjud.
        </p>
        <p>
          Ma’lumotlaringiz, hisobni o‘chirish yoki maxfiylik bo‘yicha murojaat:{" "}
          <a href="mailto:sunnatovtolibjon7@gmail.com">
            sunnatovtolibjon7@gmail.com
          </a>
          .
        </p>
      </section>
      <Link className="text-link" href="/">
        Bosh sahifaga qaytish
      </Link>
    </main>
  );
}

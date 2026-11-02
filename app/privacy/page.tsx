import { Logo } from "@/components/ui";
import Link from "next/link";

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
          FlowKey — to‘lov integratsiyalarini sinash muhiti. Google yoki GitHub
          orqali kirganda ism, elektron pochta, provayderdagi hisob
          identifikatori va kirishni tasdiqlash ma’lumotlari hisob yaratish
          hamda sizni tanish uchun ishlatiladi. Google yoki GitHub parolingiz
          FlowKey’ga berilmaydi.
        </p>
      </section>
      <section>
        <h2>Saqlanadigan ma’lumotlar</h2>
        <p>
          Hisob ma’lumotlari, yuklangan profil rasmi, loyihalar, sinov
          to‘lovlari va sozlamalar serverda saqlanadi. Sessiya cookie’lari
          kirgan holatingizni saqlash uchun ishlatiladi. Google va GitHub’dan
          olingan OAuth tokenlari bazada shifrlanadi.
        </p>
        <p>
          Kirish faqat profil va email ruxsatlarini ishlatadi. Gmail xatlari,
          Google Drive fayllari yoki GitHub repozitoriyalariga kirish ruxsati
          so‘ralmaydi.
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
        <h2>Saytdagi yordamchi</h2>
        <p>
          Qo‘llanma rejimi tayyor javoblarni brauzerda ko‘rsatadi. Chat tarixi
          shu oynaning xotirasida saqlanadi va sahifa qayta yuklanganda o‘chadi.
          AI xizmatiga ulangan rejimda savolingiz, oxirgi suhbat qismi va faqat
          o‘z hisobingizning tegishli ma’lumotlari javob tayyorlash uchun
          yuboriladi. Maxfiy kalitlar yashiriladi. Parol yoki maxfiy kalitni
          chatga yozmang.
        </p>
      </section>
      <section>
        <h2>Ruxsatlarni boshqarish</h2>
        <p>
          Google yoki GitHub hisobingiz sozlamalarida FlowKey ruxsatini bekor
          qilishingiz mumkin. FlowKey sessiyalarini hisob sozlamalaridan
          boshqaring yoki hisobdan chiqing.
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

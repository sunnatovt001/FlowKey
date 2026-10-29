import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Braces,
  Webhook,
  ShieldCheck,
  Check,
} from "lucide-react";
import { Logo, PublicNav } from "@/components/ui";
import { ProductPreview } from "@/components/preview";
export default function Home() {
  return (
    <>
      <PublicNav />
      <main className="landing">
        <section className="hero">
          <div className="hero-copy">
            <h1>
              To‘lovlar endi sodda
              <br />
              dasturchilar uchun.
            </h1>
            <p>
              To‘lovlarni ulang, tranzaksiyalarni sinang va biznesingizni yagona dasturchi kabinetidan boshqaring.
            </p>
            <div className="hero-actions">
              <Link className="button primary" href="/signup">
                Ishni boshlash <ArrowUpRight size={18} />
              </Link>
              <Link className="text-link" href="/docs">
                Qo‘llanmani o‘qish <ArrowRight size={16} />
              </Link>
            </div>
            <p className="hero-note">
              O‘zbekiston uchun yaratilgan. Sinov uchun ochiq.
            </p>
          </div>
          <ProductPreview />
        </section>
        <section id="features" className="benefits section">
          <div className="section-heading">
            <h2>
              To‘lov tashvishi kamroq.
              <br />
              Mahsulotga ko‘proq vaqt.
            </h2>
            <p>
              Birinchi API so‘rovidan tekshirilgan integratsiyagacha olib boradigan yagona kabinet.
            </p>
          </div>
          <div className="benefit-rows">
            <article>
              <Braces />
              <div>
                <h3>Ishingizni yengillashtiradigan API.</h3>
                <p>
                  Sodda JSON so‘rovlari, tushunarli to‘lov holatlari va takroriy so‘rov himoyasi. Muvaffaqiyat, xato va kutish holatlarini sinang.
                </p>
                <Link href="/docs#create-payment">
                  To‘lov API’sini ko‘rish <ArrowRight size={14} />
                </Link>
              </div>
            </article>
            <article>
              <Webhook />
              <div>
                <h3>Nima bo‘lganini va sababini biling.</h3>
                <p>
                  Har bir sinov to‘lovini kabinetdan kuzating. Webhook urinishlari, javob kodlari va imzolangan hodisalarni tekshiring.
                </p>
                <Link href="/docs#webhooks">
                  Webhooklar haqida <ArrowRight size={14} />
                </Link>
              </div>
            </article>
            <article>
              <ShieldCheck />
              <div>
                <h3>Ishonchli sinov maydoni.</h3>
                <p>
                  Sinov kalitlari, ajratilgan loyihalar va namunaviy tranzaksiyalar. Karta ham, haqiqiy pul ham kerak emas.
                </p>
                <Link href="/signup">
                  Kabinet yaratish <ArrowRight size={14} />
                </Link>
              </div>
            </article>
          </div>
        </section>
        <section id="how-it-works" className="section how">
          <div>
            <h2>
              G‘oyadan birinchi
              <br />
              sinov to‘lovigacha.
            </h2>
            <p>Aniq yo‘l. Har bir qadam sizning qo‘lingizda.</p>
            <Link href="/signup" className="button primary">
              Integratsiyani boshlash <ArrowRight size={16} />
            </Link>
          </div>
          <ol>
            {[
              ["Hisob yarating", "Dasturchi kabinetingiz shu yerdan boshlanadi."],
              [
                "Loyihangizni yarating",
                "Nima yaratayotganingizni ayting. Bu sinov sozlamasi, KYC emas.",
              ],
              [
                "API’ni ulang",
                "Sinov kaliti yarating va birinchi so‘rovingizni yuboring.",
              ],
              ["To‘lovlarni sinang", "Turli natijalarni yarating va tekshiring."],
              [
                "Haqiqiy to‘lovlarga kirish so‘rovi",
                "Tez kunda, litsenziyalangan hamkor tasdig‘iga bog‘liq.",
              ],
            ].map(([title, text]) => (
              <li key={title}>
                <span className="step-dot">
                  <Check size={14} />
                </span>
                <div>
                  <h3>{title}</h3>
                  <p>{text}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>
        <section className="section developer-band">
          <div>
            <h2>
              Sizning terminalingiz.
              <br />
              Sizning ish usulingiz.
            </h2>
            <p>
              So‘rovni nusxalang. Aniq javob oling. Integratsiyani boshlash uchun zarur vositalar Unit muhitida tayyor.
            </p>
            <Link href="/docs#quick-start">
              Tezkor boshlashni o‘qish <ArrowRight size={16} />
            </Link>
          </div>
          <pre>
            <code>
              <span className="code-comment"># Birinchi sinov to‘lovingiz</span>
              {`\ncurl -X POST "$BASE_URL/api/v1/payments" \\\n  -H "Authorization: Bearer $FLOWZA_KEY" \\\n  -H "Idempotency-Key: test-payment-001" \\\n  -H "Content-Type: application/json" \\\n  -d '{"amount_minor": 12500000,\n       "currency": "UZS",\n       "result": "successful"}'`}
            </code>
          </pre>
        </section>
        <section className="section dashboard-feature">
          <div className="section-heading">
            <h2>
              Har bir sinov.
              <br />
              Ko‘z oldingizda.
            </h2>
            <p>
              Kabinet to‘lov hajmi, natijalar, API kalitlari va integratsiya holatini bir joyga jamlaydi.
            </p>
          </div>
          <div className="dashboard-sample" data-ui>
            <div>
              <span>Kabinetning umumiy ko‘rinishi</span>
              <span className="sandbox-label">Unit muhiti namunasi</span>
            </div>
            <div className="sample-stats">
              <div>
                <p>To‘lov hajmi</p>
                <strong>
                  0 <small>UZS</small>
                </strong>
              </div>
              <div>
                <p>Muvaffaqiyatli to‘lovlar</p>
                <strong>0</strong>
              </div>
              <div>
                <p>Jami tranzaksiyalar</p>
                <strong>0</strong>
              </div>
            </div>
            <p className="sample-empty">
              Birinchi sinov to‘lovingizdan boshlang.
              <Link href="/signup">
                Loyiha yaratish <ArrowRight size={14} />
              </Link>
            </p>
          </div>
        </section>
        <section id="pricing" className="section pricing">
          <div>
            <h2>
              Sinovdan boshlang.
              <br />
              O‘z sur’atingizda rivojlaning.
            </h2>
            <p>Integratsiyangizni haqiqiy xarajatlarsiz sinang.</p>
          </div>
          <div className="price-panel">
            <div>
              <h3>Bepul Unit muhiti</h3>
              <p>Sinov to‘lovlari. Amaliy dasturchi vositalari.</p>
            </div>
            <ul>
              <li>
                <Check size={16} /> Unit API kalitlari
              </li>
              <li>
                <Check size={16} /> Tranzaksiyalar tarixi va kabinet
              </li>
              <li>
                <Check size={16} /> Imzolangan webhooklarni sinash
              </li>
            </ul>
            <Link className="button primary" href="/signup">
              Boshlash <ArrowUpRight size={16} />
            </Link>
            <div className="planned">
              <strong>Rejalashtirilgan narx: har bir tranzaksiya uchun 3%</strong>
              <p>
                Rejalashtirilgan narx — tasdiqlanishi kerak. Haqiqiy to‘lovlar litsenziyalangan hamkor tasdig‘idan keyin qo‘shiladi.
              </p>
            </div>
          </div>
        </section>
        <section className="section faq">
          <h2>
            Sizni qiziqtirgan
            <br />
            savollarga javoblar.
          </h2>
          <div>
            {[
              [
                "Hozir haqiqiy to‘lov qabul qila olamanmi?",
                "Yo‘q. FlowKey hozir faqat Unit muhitini taqdim etadi. Haqiqiy pul ishlatilmaydi. Haqiqiy to‘lovlar litsenziyalangan hamkor integratsiyasi va tasdig‘ini talab qiladi.",
              ],
              [
                "FlowKey kimlar uchun?",
                "O‘zbekistondagi dasturchilar, SaaS asoschilari, startap jamoalari va raqamli bizneslar uchun.",
              ],
              [
                "Bank yoki karta ma’lumotlari kerakmi?",
                "Yo‘q. Sinov uchun summa va natija kifoya. Haqiqiy karta raqami, CVV yoki bank ma’lumotlarini yubormang.",
              ],
              [
                "Qaysi valyutalarni sinash mumkin?",
                "Dastlabki Unit muhiti UZS’ni qo‘llaydi. Summa butun kichik birliklarda yuboriladi: 100 birlik = 1 so‘m.",
              ],
              [
                "Bu sotuvchini tasdiqlash hisoblanadimi?",
                "Yo‘q. Biznes va loyiha yaratish faqat sinov sozlamasidir. Bu huquqiy, KYC yoki haqiqiy to‘lovga ruxsat bermaydi.",
              ],
            ].map(([q, a]) => (
              <details key={q}>
                <summary>{q}</summary>
                <p>{a}</p>
              </details>
            ))}
          </div>
        </section>
        <section className="closing">
          <h2>
            Mahsulotingizni yarating.
            <br />
            To‘lovlar bizning zimmamizda.
          </h2>
          <p>Sinovdan boshlang. Ishonch bilan yarating.</p>
          <Link href="/signup" className="button primary">
            Ishni boshlash <ArrowUpRight size={16} />
          </Link>
        </section>
      </main>
      <footer>
        <Logo />
        <p>O‘zbekiston dasturchilari uchun to‘lov infratuzilmasi.</p>
        <div>
          <Link href="/docs">Qo‘llanma</Link>
          <Link href="/login">Kirish</Link>
          <span>Faqat sinov · Haqiqiy pul ishlatilmaydi</span>
        </div>
      </footer>
    </>
  );
}

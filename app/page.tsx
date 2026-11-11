import Link from "next/link";
import { ArrowRight, ArrowUpRight, Check } from "lucide-react";
import { Logo, PublicNav } from "@/components/ui";
import { LandingHero } from "@/components/landing-hero";
export default function Home() {
  return (
    <>
      <PublicNav />
      <main className="landing flow-landing">
        <LandingHero />
        <section id="features" className="section pricing">
          <div>
            <h2>
              Integratsiya uchun
              <br />
              bitta platforma.
            </h2>
            <p>Loyihalar, ulanishlar va tranzaksiyalarni boshqaring.</p>
          </div>
          <div className="price-panel">
            <div>
              <h3>FlowKey kabineti</h3>
            </div>
            <ul>
              {[
                "Loyihalar va jamoa ruxsatlari",
                "API kalitlari va ulash usullari",
                "Tranzaksiyalar tarixi",
                "Imzolangan webhooklar",
                "AI yordamchi va yordam murojaatlari",
              ].map((text) => (
                <li key={text}>
                  <Check size={16} />
                  {text}
                </li>
              ))}
            </ul>
            <Link className="button primary" href="/signup">
              Hisob yaratish <ArrowUpRight size={16} />
            </Link>
          </div>
        </section>
        <section className="section faq">
          <h2>
            Savollarga
            <br />
            javoblar.
          </h2>
          <div>
            {[
              [
                "FlowKey orqali qanday ulayman?",
                "Loyiha yarating va Ulash bo‘limidan API kaliti, token, havola, script yoki tugmani tanlang.",
              ],
              [
                "Hozir haqiqiy pul qabul qilinadimi?",
                "Hozir haqiqiy pul operatsiyalari ulanmagan. Mavjud to‘lov amallari sinov muhitida bajariladi.",
              ],
              [
                "Hisobdagi ma’lumotlar qayerdan olinadi?",
                "Kabinetdagi loyiha, tranzaksiya va webhook ko‘rsatkichlari shu hisobning bazadagi yozuvlaridan olinadi.",
              ],
              [
                "Yordamni qayerdan olaman?",
                "Kabinetdagi AI yordamchiga yozing yoki Hisob sozlamalaridan yordam murojaati yarating.",
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
            Loyihangizni
            <br />
            FlowKey’ga ulang.
          </h2>
          <Link href="/signup" className="button primary">
            Ishni boshlash <ArrowRight size={16} />
          </Link>
        </section>
      </main>
      <footer>
        <Logo />
        <p>Loyihalar va API integratsiyalari uchun kabinet.</p>
        <div>
          <Link href="/docs">Qo‘llanma</Link>
          <Link href="/privacy">Maxfiylik</Link>
          <Link href="/login">Kirish</Link>
        </div>
      </footer>
    </>
  );
}

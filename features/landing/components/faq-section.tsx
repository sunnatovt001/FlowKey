import { AnimatedFaqItem } from "@/components/animated-faq-item";
import { T } from "@/components/i18n/language-provider";
export function FaqSection(){return (<section className="section faq">
          <div className="faq-intro"><h2><T>Sizni qiziqtirgan</T><br /><T>savollarga javoblar.</T></h2><img className="faq-illustration" src="/faq-illustration.svg" alt="" width="500" height="350" loading="lazy" decoding="async"/></div>
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
              <AnimatedFaqItem key={q} question={<T>{q}</T>}>
                <p><T>{a}</T></p>
              </AnimatedFaqItem>
            ))}
          </div>
        </section>);}

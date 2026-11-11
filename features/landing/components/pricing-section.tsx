import { T } from "@/components/i18n/language-provider";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, Check } from "lucide-react";
export function PricingSection(){return (<section id="pricing" className="section pricing">
          <div>
            <h2><T>Sinovdan boshlang.</T><br /><T>O‘z sur’atingizda rivojlaning.</T></h2>
            <p><T>Integratsiyangizni haqiqiy xarajatlarsiz sinang.</T></p>
            <img className="sandbox-illustration" src="/sandbox-illustration.svg" alt="" width="560" height="390" loading="lazy" decoding="async"/>
          </div>
          <div className="price-panel">
            <div>
              <h3><T>Bepul Unit muhiti</T></h3>
              <p><T>Sinov to‘lovlari. Amaliy dasturchi vositalari.</T></p>
            </div>
            <ul>
              <li>
                <Check size={16} /><T>Unit API kalitlari</T></li>
              <li>
                <Check size={16} /><T>Tranzaksiyalar tarixi va kabinet</T></li>
              <li>
                <Check size={16} /><T>Imzolangan webhooklarni sinash</T></li>
            </ul>
            <Link className="button primary" href="/signup"><T>Boshlash</T><ArrowUpRight size={16} />
            </Link>
            <div className="planned">
              <strong><T>Rejalashtirilgan narx: har bir tranzaksiya uchun 3%</T></strong>
              <p><T>Rejalashtirilgan narx — tasdiqlanishi kerak. Haqiqiy to‘lovlar litsenziyalangan hamkor tasdig‘idan keyin qo‘shiladi.</T></p>
            </div>
          </div>
        </section>);}

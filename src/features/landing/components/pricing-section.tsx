import Link from "@/components/site-link";
import { ArrowRight, ArrowUpRight, Check } from "lucide-react";
export function PricingSection(){return (<section id="pricing" className="section pricing">
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
              <strong>
                Rejalashtirilgan narx: har bir tranzaksiya uchun 3%
              </strong>
              <p>
                Rejalashtirilgan narx — tasdiqlanishi kerak. Haqiqiy to‘lovlar
                litsenziyalangan hamkor tasdig‘idan keyin qo‘shiladi.
              </p>
            </div>
          </div>
        </section>);}

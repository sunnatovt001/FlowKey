import { T } from "@/components/i18n/language-provider";
import Link from "@/components/site-link";
import {
  ArrowRight,
  ArrowUpRight,
  Link2,
  Activity,
  ShieldCheck,
} from "lucide-react";

export function HeroSection() {
  return (
    <section className="flow-hero">
      <div className="flow-hero-copy">
        <h1><T>To‘lovlar.</T><br />
          <em><T>Endi sodda.</T></em>
        </h1>
        <div className="hero-actions">
          <Link href="/signup" className="button primary"><T>Ishni boshlash</T><ArrowRight size={18} />
          </Link>
          <Link href="/docs" className="text-link"><T>Qo‘llanma</T><ArrowUpRight size={16} />
          </Link>
        </div>
        <div className="hero-traits">
          <span>
            <Link2 /><T>Sodda ulash</T></span>
          <span>
            <Activity /><T>To‘lovlar tarixi</T></span>
          <span>
            <ShieldCheck /><T>Xavfsiz sinov</T></span>
        </div>
        <p className="hero-disclaimer"><T>Unit muhiti · Haqiqiy pul ishlatilmaydi</T></p>
      </div>
      <div className="hero-stage">
        <div className="stage-orb orange" aria-hidden="true" />
        <div className="stage-orb purple" aria-hidden="true" />
        <div className="stage-orbit" aria-hidden="true" />
      </div>
    </section>
  );
}

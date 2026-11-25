import { HeroAmbient } from "./hero-ambient";
import { HeroTagline } from "./hero-tagline";
import { PaymentSculpture } from "./payment-sculpture";
import { T } from "@/components/i18n/language-provider";
import Link from "next/link";
import {
  ArrowUpRight,
  Link2,
  Activity,
  ShieldCheck,
} from "lucide-react";

export function HeroSection() {
  return (
    <section className="flow-hero">
      <HeroAmbient />
      <div className="flow-hero-copy">
        <h1><T>To‘lovlar.</T><br />
          <em><HeroTagline /></em>
        </h1>
        <div className="hero-actions">
          <Link href="/signup" className="button primary"><T>Ishni boshlash</T><ArrowUpRight size={16} aria-hidden="true" />
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
      </div>
      <div className="hero-stage hero-stage-sculpture">
        <PaymentSculpture />
        <div className="stage-orb orange" aria-hidden="true" />
        <div className="stage-orb purple" aria-hidden="true" />
        <div className="stage-orbit" aria-hidden="true" />
      </div>
    </section>
  );
}

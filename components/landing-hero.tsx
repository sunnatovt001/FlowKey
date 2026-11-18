import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Link2,
  Activity,
  ShieldCheck,
} from "lucide-react";
import { ProductPreview } from "./preview";

export function LandingHero() {
  return (
    <section className="flow-hero">
      <div className="flow-hero-copy">
        <h1>
          Loyihangiz.
          <br />
          <em>Bitta kabinetda.</em>
        </h1>
        <div className="hero-actions">
          <Link href="/signup" className="button primary">
            Ishni boshlash <ArrowRight size={18} />
          </Link>
          <Link href="/docs" className="text-link">
            Qo‘llanma <ArrowUpRight size={16} />
          </Link>
        </div>
        <div className="hero-traits">
          <span>
            <Link2 />
            Sodda ulash
          </span>
          <span>
            <Activity />
            To‘lovlar tarixi
          </span>
          <span>
            <ShieldCheck />
            Hisob himoyasi
          </span>
        </div>
        <p className="hero-disclaimer">
          Unit muhiti · Haqiqiy pul ishlatilmaydi
        </p>
      </div>
      <div className="hero-stage">
        <div className="stage-orb orange" aria-hidden="true" />
        <div className="stage-orb purple" aria-hidden="true" />
        <div className="stage-orbit" aria-hidden="true" />
        <ProductPreview />
      </div>
    </section>
  );
}

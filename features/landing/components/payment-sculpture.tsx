import { ShieldCheck, Zap, ArrowUpRight, Wifi } from "lucide-react";
/** Decorative brand illustration; it does not show account or payment data. */
export function PaymentSculpture() {
  return <div className="payment-sculpture" aria-hidden="true">
    <div className="sculpture-glow" />
    <div className="sculpture-card">
      <div className="sculpture-card-top"><span className="sculpture-brand"><img className="brand-symbol" src="/brand-symbol-128.webp" alt="" width="48" height="48" decoding="async"/></span><Wifi size={27}/></div>
      <div className="sculpture-chip"><i/><i/><i/></div>
      <div className="sculpture-digits"><span>••••</span><span>••••</span><span>••••</span><span>••••</span></div>
      <div className="sculpture-card-bottom"><span className="sculpture-line"/><span className="sculpture-circles"><i/><i/></span></div>
    </div>
    <div className="sculpture-tile sculpture-shield"><ShieldCheck strokeWidth={1.7}/><span className="tile-dot"/></div>
    <div className="sculpture-tile sculpture-zap"><Zap fill="currentColor" strokeWidth={1.4}/></div>
    <div className="sculpture-tile sculpture-chart"><div className="sculpture-bars"><i/><i/><i/><i/></div><ArrowUpRight/></div>
    <div className="sculpture-spark spark-one">✦</div><div className="sculpture-spark spark-two">✦</div>
    <div className="sculpture-mini-orb"/>
  </div>;
}

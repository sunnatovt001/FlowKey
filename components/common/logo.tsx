import Link from "next/link";
/** The browser selects the wordmark or compact symbol before downloading. */
export function Logo() {
  return <Link href="/" className="logo" aria-label="FlowKey home"><picture className="brand-responsive"><source media="(min-width: 761px)" srcSet="/brand-desktop-420.webp 420w, /brand-desktop-840.webp 840w" sizes="210px"/><img src="/brand-symbol-128.webp" srcSet="/brand-symbol-128.webp 128w, /brand-symbol-256.webp 256w" sizes="48px" alt="FlowKey" width="54" height="54" decoding="async"/></picture></Link>;
}

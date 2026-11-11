"use client";
import { useEffect, useRef } from "react";
import { MobileDrawer } from "@/components/layout/mobile-drawer";
import { LanguageSwitcher } from "@/components/i18n/language-switcher";
import { T } from "@/components/i18n/language-provider";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Logo } from "./logo";
export function PublicNav() {
  const header = useRef<HTMLElement>(null);
  useEffect(() => {
    let frame = 0;
    function update() {
      header.current?.classList.toggle("is-scrolled", scrollY > 28);
      frame = 0;
    }
    function schedule() { if (!frame) frame = requestAnimationFrame(update); }
    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("pageshow", schedule);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("pageshow", schedule);
    };
  }, []);
  return (
    <div className="public-nav-space"><header ref={header} className="public-nav">
      <Logo />
      <nav aria-label="Asosiy menyu">
        <Link href="/#pricing"><T>Narxlar</T></Link>
        <Link href="/docs"><T>Qo‘llanma</T></Link>
      </nav>
      <div className="nav-actions">
        <LanguageSwitcher />
        <Link href="/login"><T>Kirish</T></Link>
        <Link className="button primary" href="/signup"><T>Boshlash</T><ArrowUpRight size={16} />
        </Link>
      </div>
      <div className="public-mobile-actions">
        <Link href="/signup" className="button primary"><T>Boshlash</T><ArrowUpRight size={16}/></Link>
        <MobileDrawer id="public-mobile-menu">
          <nav className="drawer-links" aria-label="Navigation"><Link href="/#pricing"><T>Narxlar</T></Link><Link href="/docs"><T>Qo‘llanma</T></Link><Link href="/privacy"><T>Maxfiylik</T></Link></nav>
          <div className="drawer-auth"><Link className="button secondary" href="/login"><T>Kirish</T></Link><Link className="button primary" href="/signup"><T>Boshlash</T></Link></div>
          <div className="drawer-language"><LanguageSwitcher/></div>
        </MobileDrawer>
      </div>
    </header></div>
  );
}

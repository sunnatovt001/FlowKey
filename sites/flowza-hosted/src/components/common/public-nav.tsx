import { LanguageSwitcher } from "@/components/i18n/language-switcher";
import { T } from "@/components/i18n/language-provider";
import Link from "../site-link";
import { ArrowUpRight } from "lucide-react";
import { Logo } from "./logo";
export function PublicNav() {
  return (
    <header className="public-nav">
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
    </header>
  );
}

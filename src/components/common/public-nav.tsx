import Link from "../site-link";
import { ArrowUpRight } from "lucide-react";
import { Logo } from "./logo";
export function PublicNav() {
  return (
    <header className="public-nav">
      <Logo />
      <nav aria-label="Asosiy menyu">
        <Link href="/#pricing">Narxlar</Link>
        <Link href="/docs">Qo‘llanma</Link>
      </nav>
      <div className="nav-actions">
        <Link href="/login">Kirish</Link>
        <Link className="button primary" href="/signup">
          Boshlash <ArrowUpRight size={16} />
        </Link>
      </div>
    </header>
  );
}

import { statusLabel } from "@/shared/locale";
import Link from "next/link";
import { ArrowUpRight, Waves } from "lucide-react";
export function Logo() {
  return (
    <Link href="/" className="logo" aria-label="FlowKey bosh sahifasi">
      <span className="brand-mark" aria-hidden="true">
        <i />
        <i />
        <i />
      </span>
      <span className="brand-word">
        Flow<span>Key</span>
      </span>
    </Link>
  );
}
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
export function Status({ status }: { status: string }) {
  return (
    <span className={`status ${status}`}>
      <span aria-hidden="true" />
      {statusLabel(status)}
    </span>
  );
}
export function Empty({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="empty">
      <div className="empty-icon">
        <Waves size={26} />
      </div>
      <h3>{title}</h3>
      <p>{children}</p>
    </div>
  );
}
export const money = (minor: number | bigint) => {
  const value = BigInt(minor);
  const fraction = String(value % BigInt(100)).padStart(2, "0");
  return (
    String(value / BigInt(100)).replace(/\B(?=(\d{3})+(?!\d))/g, " ") +
    (fraction === "00" ? "" : `.${fraction}`)
  );
};

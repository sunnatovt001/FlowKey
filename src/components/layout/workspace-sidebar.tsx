"use client";
import Link from "../site-link";
import { Logo } from "../common/logo";
import { LayoutDashboard, ArrowLeftRight, Code2, BookOpen, Settings, ArrowUpRight } from "lucide-react";
const navigation = [
  ["/dashboard", "Umumiy ko‘rinish", LayoutDashboard],
  ["/transactions", "Tranzaksiyalar", ArrowLeftRight],
  ["/developers", "Ulash", Code2],
  ["/guide", "Qo‘llanma", BookOpen],
  ["/settings", "Hisob sozlamalari", Settings],
] as const;
export function WorkspaceSidebar({path,selected}:{path:string;selected:string}){return (      <aside className="sidebar">
        <Logo />
        <p className="sidebar-caption">Kabinet</p>
        <nav aria-label="Kabinet menyusi">
          {navigation.map(([href, label, Icon]) => (
            <Link
              className={path === href ? "active" : ""}
              href={href + (selected ? `?project=${selected}` : "")}
              key={href}
            >
              <Icon size={18} />
              {label}
            </Link>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="sandbox-info">
            <span className="sandbox-label">Unit muhiti</span>
            <p>
              Yaratish uchun xavfsiz muhit.
              <br />
              Haqiqiy pul ishlatilmaydi.
            </p>
          </div>
          <Link href={`/guide?project=${selected}#quick-start`}>
            Yordam kerakmi? <ArrowUpRight size={14} />
          </Link>
        </div>
      </aside>);}

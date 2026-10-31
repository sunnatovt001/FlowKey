import Link from "@/components/site-link";
import { Logo } from "@/components/common/logo";
export function SiteFooter(){return (<footer>
        <Logo />
        <p>O‘zbekiston dasturchilari uchun to‘lov infratuzilmasi.</p>
        <div>
          <Link href="/docs">Qo‘llanma</Link>
          <Link href="/login">Kirish</Link>
          <span>Faqat sinov · Haqiqiy pul ishlatilmaydi</span>
        </div>
      </footer>);}

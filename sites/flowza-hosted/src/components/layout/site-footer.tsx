import { T } from "@/components/i18n/language-provider";
import Link from "@/components/site-link";
import { Logo } from "@/components/common/logo";
export function SiteFooter(){return (<footer>
        <Logo />
        <p><T>O‘zbekiston dasturchilari uchun to‘lov infratuzilmasi.</T></p>
        <div>
          <Link href="/docs"><T>Qo‘llanma</T></Link>
          <Link href="/privacy"><T>Maxfiylik</T></Link>
          <Link href="/login"><T>Kirish</T></Link>
          <span><T>Faqat sinov · Haqiqiy pul ishlatilmaydi</T></span>
        </div>
      </footer>);}

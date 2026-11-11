import { T } from "@/components/i18n/language-provider";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
export function ClosingSection(){return (<section className="closing">
          <h2><T>Mahsulotingizni yarating.</T><br /><T>To‘lovlar bizning zimmamizda.</T></h2>
          <p><T>Sinovdan boshlang. Ishonch bilan yarating.</T></p>
          <Link href="/signup" className="button primary"><T>Ishni boshlash</T><ArrowUpRight size={16} />
          </Link>
        </section>);}

import Link from "@/components/site-link";
import { ArrowRight, ArrowUpRight, Check } from "lucide-react";
export function ClosingSection(){return (<section className="closing">
          <h2>
            Mahsulotingizni yarating.
            <br />
            To‘lovlar bizning zimmamizda.
          </h2>
          <p>Sinovdan boshlang. Ishonch bilan yarating.</p>
          <Link href="/signup" className="button primary">
            Ishni boshlash <ArrowUpRight size={16} />
          </Link>
        </section>);}

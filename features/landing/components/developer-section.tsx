import { T } from "@/components/i18n/language-provider";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, Check } from "lucide-react";
export function DeveloperSection(){return (<section className="section developer-band">
          <div>
            <h2><T>Sizning terminalingiz.</T><br /><T>Sizning ish usulingiz.</T></h2>

            <Link href="/docs#quick-start"><T>Tezkor boshlashni o‘qish</T><ArrowRight size={16} />
            </Link>
          </div>
          <pre>
            <code>
              <span className="code-comment"># Birinchi sinov to‘lovingiz</span>
              {`\ncurl -X POST "$BASE_URL/api/v1/payments" \\\n  -H "Authorization: Bearer $FLOWZA_KEY" \\\n  -H "Idempotency-Key: test-payment-001" \\\n  -H "Content-Type: application/json" \\\n  -d '{"amount_minor": 12500000,\n       "currency": "UZS",\n       "result": "successful"}'`}
            </code>
          </pre>
        </section>);}

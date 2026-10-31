import Link from "@/components/site-link";
import { ArrowRight, ArrowUpRight, Check } from "lucide-react";
export function DeveloperSection(){ return (<section className="section developer-band">
          <div>
            <h2>
              Sizning terminalingiz.
              <br />
              Sizning ish usulingiz.
            </h2>
            <p>
              So‘rovni nusxalang. Aniq javob oling. Integratsiyani boshlash uchun zarur vositalar Unit muhitida tayyor.
            </p>
            <Link href="/docs#quick-start">
              Tezkor boshlashni o‘qish <ArrowRight size={16} />
            </Link>
          </div>
          <pre>
            <code>
              <span className="code-comment"># Birinchi sinov to‘lovingiz</span>
              {`\ncurl -X POST "$BASE_URL/api/v1/payments" \\\n  -H "Authorization: Bearer $FLOWZA_KEY" \\\n  -H "Idempotency-Key: test-payment-001" \\\n  -H "Content-Type: application/json" \\\n  -d '{"amount_minor": 12500000,\n       "currency": "UZS",\n       "result": "successful"}'`}
            </code>
          </pre>
        </section>); }

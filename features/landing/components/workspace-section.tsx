import { T } from "@/components/i18n/language-provider";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
export function WorkspaceSection(){return (<section className="section dashboard-feature">
          <div className="section-heading">
            <h2><T>Har bir sinov.</T><br /><T>Ko‘z oldingizda.</T></h2>
          </div>
          <div className="dashboard-sample" data-ui>
            <div>
              <span><T>Kabinetning umumiy ko‘rinishi</T></span>
              <span className="sandbox-label"><T>Unit muhiti namunasi</T></span>
            </div>
            <table className="overview-table">
              <caption className="sr-only"><T>Kabinetning umumiy ko‘rinishi</T></caption>
              <tbody>
                <tr><th scope="row"><T>To‘lov hajmi</T></th><td><strong>0</strong> <small>UZS</small></td></tr>
                <tr><th scope="row"><T>Muvaffaqiyatli to‘lovlar</T></th><td><strong>0</strong></td></tr>
                <tr><th scope="row"><T>Jami tranzaksiyalar</T></th><td><strong>0</strong></td></tr>
              </tbody>
            </table>
            <p className="sample-empty"><T>Birinchi sinov to‘lovingizdan boshlang.</T><Link href="/signup"><T>Loyiha yaratish</T><ArrowRight size={14} />
              </Link>
            </p>
          </div>
        </section>);}

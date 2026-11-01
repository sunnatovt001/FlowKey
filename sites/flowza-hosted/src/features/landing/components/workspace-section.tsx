import { T } from "@/components/i18n/language-provider";
import Link from "@/components/site-link";
import { ArrowRight, ArrowUpRight, Check } from "lucide-react";
export function WorkspaceSection(){return (<section className="section dashboard-feature">
          <div className="section-heading">
            <h2><T>Har bir sinov.</T><br /><T>Ko‘z oldingizda.</T></h2>
          </div>
          <div className="dashboard-sample" data-ui>
            <div>
              <span><T>Kabinetning umumiy ko‘rinishi</T></span>
              <span className="sandbox-label"><T>Unit muhiti namunasi</T></span>
            </div>
            <div className="sample-stats">
              <div>
                <p><T>To‘lov hajmi</T></p>
                <strong>
                  0 <small>UZS</small>
                </strong>
              </div>
              <div>
                <p><T>Muvaffaqiyatli to‘lovlar</T></p>
                <strong>0</strong>
              </div>
              <div>
                <p><T>Jami tranzaksiyalar</T></p>
                <strong>0</strong>
              </div>
            </div>
            <p className="sample-empty"><T>Birinchi sinov to‘lovingizdan boshlang.</T><Link href="/signup"><T>Loyiha yaratish</T><ArrowRight size={14} />
              </Link>
            </p>
          </div>
        </section>);}

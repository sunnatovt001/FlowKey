import Link from "@/components/site-link";
import { ArrowRight, ArrowUpRight, Check } from "lucide-react";
export function WorkspaceSection(){return (<section className="section dashboard-feature">
          <div className="section-heading">
            <h2>
              Har bir sinov.
              <br />
              Ko‘z oldingizda.
            </h2>
          </div>
          <div className="dashboard-sample" data-ui>
            <div>
              <span>Kabinetning umumiy ko‘rinishi</span>
              <span className="sandbox-label">Unit muhiti namunasi</span>
            </div>
            <div className="sample-stats">
              <div>
                <p>To‘lov hajmi</p>
                <strong>
                  0 <small>UZS</small>
                </strong>
              </div>
              <div>
                <p>Muvaffaqiyatli to‘lovlar</p>
                <strong>0</strong>
              </div>
              <div>
                <p>Jami tranzaksiyalar</p>
                <strong>0</strong>
              </div>
            </div>
            <p className="sample-empty">
              Birinchi sinov to‘lovingizdan boshlang.
              <Link href="/signup">
                Loyiha yaratish <ArrowRight size={14} />
              </Link>
            </p>
          </div>
        </section>);}

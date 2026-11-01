"use client";
import { T } from "@/components/i18n/language-provider";
import { statusLabel } from "@/shared/locale";
import { useState } from "react";
import {
  ArrowDownLeft,
  ChevronDown,
  Check,
  Terminal,
  ArrowRight,
} from "lucide-react";
import { Status } from "./ui";
export function ProductPreview() {
  const [status, setStatus] = useState("successful");
  return (
    <div className="product-preview" data-ui>
      <div className="preview-top">
        <span className="project-icon">F</span>
        <strong><T>Keyingi mahsulotingiz</T></strong>
        <ChevronDown size={14} />
        <span className="sandbox-label">Unit</span>
      </div>
      <div className="preview-body">
        <div>
          <p className="muted"><T>So‘rovdan natijagacha bitta to‘lov.</T></p>
          <h3><T>Tushunarli bo‘lishi uchun yaratilgan.</T></h3>
          <div className="preview-code">
            <div>
              <Terminal size={15} /> POST /api/v1/payments
            </div>
            <pre>
              <code>{`{\n  "amount_minor": 12500000,\n  "currency": "UZS",\n  "result": "${status}"\n}`}</code>
            </pre>
          </div>
          <div
            className="preview-options"
            aria-label="Namunaviy to‘lov natijasi"
          >
            {["successful", "failed", "pending"].map((s) => (
              <button
                key={s}
                aria-pressed={status === s}
                onClick={() => setStatus(s)}
              >
                {s === "successful" ? <Check size={13} /> : null}
                {statusLabel(s)}
              </button>
            ))}
          </div>
        </div>
        <div className="receipt">
          <div className="receipt-icon">
            <ArrowDownLeft size={24} />
          </div>
          <p><T>Sinov tariqasidagi to‘lov</T></p>
          <h3>
            125 000 <span>UZS</span>
          </h3>
          <Status status={status} />
          <dl>
            <div>
              <dt><T>Muhit</T></dt>
              <dd><T>Faqat sinov</T></dd>
            </div>
            <div>
              <dt><T>To‘lov usuli</T></dt>
              <dd><T>Sinov</T></dd>
            </div>
            <div>
              <dt><T>O‘tkazilgan haqiqiy pul</T></dt>
              <dd><T>Yo‘q</T></dd>
            </div>
          </dl>
          <p className="receipt-note"><T>Bu interaktiv namuna. O‘z sinov to‘lovlaringizni saqlash uchun hisob yarating.</T></p>
        </div>
      </div>
      <div className="preview-bottom">
        <span>
          <span className="small-dot" /><T>Aniq so‘rovlar. Tushunarli javoblar.</T></span>
        <a href="/docs#create-payment"><T>API’ni ko‘rish</T><ArrowRight size={14} />
        </a>
      </div>
    </div>
  );
}

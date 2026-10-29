"use client";
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
        <strong>Keyingi mahsulotingiz</strong>
        <ChevronDown size={14} />
        <span className="sandbox-label">Unit</span>
      </div>
      <div className="preview-body">
        <div>
          <p className="muted">So‘rovdan natijagacha bitta to‘lov.</p>
          <h3>Tushunarli bo‘lishi uchun yaratilgan.</h3>
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
          <p>Sinov tariqasidagi to‘lov</p>
          <h3>
            125 000 <span>UZS</span>
          </h3>
          <Status status={status} />
          <dl>
            <div>
              <dt>Muhit</dt>
              <dd>Faqat sinov</dd>
            </div>
            <div>
              <dt>To‘lov usuli</dt>
              <dd>Sinov</dd>
            </div>
            <div>
              <dt>O‘tkazilgan haqiqiy pul</dt>
              <dd>Yo‘q</dd>
            </div>
          </dl>
          <p className="receipt-note">
            Bu interaktiv namuna. O‘z sinov to‘lovlaringizni saqlash uchun hisob yarating.
          </p>
        </div>
      </div>
      <div className="preview-bottom">
        <span>
          <span className="small-dot" /> Aniq so‘rovlar. Tushunarli javoblar.
        </span>
        <a href="/docs#create-payment">
          API’ni ko‘rish <ArrowRight size={14} />
        </a>
      </div>
    </div>
  );
}

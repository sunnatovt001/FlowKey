"use client";
import { useState, useSyncExternalStore } from "react";
import { Copy, Check, MessageSquare } from "lucide-react";
import { Code } from "./copy";
export function IntegrationAssist({ projectId }: { projectId: string }) {
  const origin = useSyncExternalStore(
    () => () => {},
    () => window.location.origin,
    () => "",
  );
  const [copied, setCopied] = useState("");
  const [fallback, setFallback] = useState("");
  const prompt = (ai: string) =>
    `${ai}, mavjud loyihamga FlowKey Unit integratsiyasini qo‘sh. Loyiha ID: ${projectId}. Kalitni faqat FLOWKEY_API_KEY server muhit o‘zgaruvchisidan ol; uni brauzerga, logga yoki suhbatga chiqarmagin. Serverdan POST ${origin}/api/v1/checkout/sessions yubor: Authorization: Bearer <FLOWKEY_API_KEY>, Content-Type: application/json va har buyurtma uchun noyob Idempotency-Key. JSON: {"title":"Buyurtma","amount_minor":3900000,"currency":"UZS"}. amount_minor tiyinlarda: 100 tiyin = 1 so‘m. Javobdagi url orqali to‘lov sahifasiga yo‘naltir. Natijani server API yoki imzolangan webhook orqali tekshir; brauzer xabariga tayanma. Xato va kutish holatlarini ko‘rsat, integratsiyani sinab tekshir. Haqiqiy pul o‘tkazilmaydi. Hujjat: ${origin}/guide va ${origin}/api/openapi.`;
  return (
    <section className="integration-assist">
      <h2>AI yordamida tez ulash</h2>
      <p>Loyihangizga mos ko‘rsatmani nusxalang.</p>
      <div className="integration-assist-actions">
        {["ChatGPT", "Claude"].map((ai) => (
          <button
            type="button"
            key={ai}
            className="button secondary"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(prompt(ai));
                setCopied(ai);
                setFallback("");
              } catch {
                setFallback(ai);
              }
            }}
          >
            <MessageSquare size={18} />
            {ai} uchun prompt
            {copied === ai ? <Check size={17} /> : <Copy size={17} />}
          </button>
        ))}
      </div>
      <p role="status" className="integration-copy-status">
        {copied ? `${copied} prompti nusxalandi.` : ""}
      </p>
      {fallback && (
        <div>
          <p>Matnni quyidan nusxalang.</p>
          <Code>{prompt(fallback)}</Code>
        </div>
      )}
    </section>
  );
}

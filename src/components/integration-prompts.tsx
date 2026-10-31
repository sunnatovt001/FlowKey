"use client";
import { useSyncExternalStore } from "react";
import { Code } from "./copy";
export function IntegrationPrompts({
  projectId,
  method,
  value,
}: {
  projectId: string;
  method: string;
  value?: string;
}) {
  const origin = useSyncExternalStore(
    () => () => {},
    () => window.location.origin,
    () => "",
  );
  const instructions = ["API kaliti", "Token"].includes(method)
    ? `Kalitni FLOWKEY_API_KEY server muhit o‘zgaruvchisidan ol. POST ${origin}/api/v1/checkout/sessions so‘rovini serverdan yubor. Authorization: Bearer <FLOWKEY_API_KEY>, Content-Type: application/json va har yangi buyurtma uchun noyob Idempotency-Key sarlavhalarini qo‘sh. JSON: {"title":"Buyurtma","amount_minor":12500000,"currency":"UZS"}. Javobdagi url orqali foydalanuvchini to‘lovga yo‘naltir. Maxfiy kalitni brauzerga yoki suhbatga joylama.`
    : `Quyidagi ${method}ni mavjud saytimga ulab ber:\n${value || "Avval Unit yarating va shu yerdagi natijani qo‘shing."}\nMaxfiy API kaliti talab qilinmaydi. Havolani o‘zgartirma. Telefon va kompyuterda ishlasin.`;
  return (
    <div className="integration-prompts">
      <h3>AI yordamida ulash</h3>
      <p>
        Promptni nusxalab, loyihangiz ochilgan AI suhbatiga yuboring. Maxfiy
        kalit promptga qo‘shilmaydi.
      </p>
      {["GPT", "Claude"].map((ai) => (
        <details key={ai}>
          <summary>{ai} uchun tayyor prompt</summary>
          <Code>{`${ai}, FlowKey Unit integratsiyasini mavjud loyihamga qo‘sh. Loyiha ID: ${projectId}. Usul: ${method}.\n${instructions}\nXatolar va kutish holatini o‘zbekcha ko‘rsat. Integratsiyani sinab tekshir. Bu Unit muhiti, haqiqiy pul ishlatilmaydi. API hujjati: ${origin}/docs va ${origin}/api/openapi.`}</Code>
        </details>
      ))}
    </div>
  );
}

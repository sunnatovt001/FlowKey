import { statusLabel } from "@/shared/locale";
import { db } from "@/server/db";
import { getSession } from "@/server/checkout";
import { notFound } from "next/navigation";
import { Logo, money } from "@/components/ui";
import { CheckoutAction } from "@/components/checkout-action";
export const dynamic = "force-dynamic";
export const metadata = { title: "Sinov to‘lov sahifasi", robots: { index: false, follow: false }, referrer: "no-referrer" };
export default async function Checkout({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession(id);
  if (!session || session.project.archivedAt || session.link?.disabledAt) notFound();
  const payment = session.result ? await db.transaction.findUnique({ where: { projectId_idempotencyKey: { projectId: session.projectId, idempotencyKey: `checkout_${id}` } } }) : null;
  return <main style={{ maxWidth: 640, margin: "48px auto", padding: 24 }}><Logo /><p className="sandbox-label">Unit muhiti · Haqiqiy pul ishlatilmaydi</p><h1>{session.title}</h1><p>{session.project.name}</p><h2>{money(session.amountMinor)} UZS</h2>
    {payment ? <p role="status">To‘lov {statusLabel(payment.status)}. Pul o‘tkazilmadi.</p> : session.expiresAt <= new Date() && !session.result ? <p role="alert">Bu to‘lov sessiyasining muddati tugagan. Yangi sessiya uchun asl to‘lov havolasiga qayting.</p> : <CheckoutAction id={id} />}
    <p className="muted">Brauzerdagi xabar to‘lov tasdig‘i emas. Sotuvchi natijani server API’si yoki imzolangan webhook orqali tekshirishi kerak.</p></main>;
}

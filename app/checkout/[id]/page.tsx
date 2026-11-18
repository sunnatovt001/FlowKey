import { headers } from "next/headers";
import Image from "next/image";
import { notFound } from "next/navigation";
import QRCode from "qrcode";
import { statusLabel } from "@/shared/locale";
import { db } from "@/server/db";
import { getCheckoutSession } from "@/server/checkout";
import { telegramCheckoutLink, validCheckoutProof } from "@/server/telegram-checkout";
import { Logo, money } from "@/components/ui";
import { CheckoutAction, CheckoutWatch, RenewCheckout } from "@/components/checkout-action";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Sinov to‘lov sahifasi",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

export default async function Checkout({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ telegram?: string | string[] }>;
}) {
  const [{ id }, { telegram }] = await Promise.all([params, searchParams]);
  const session = await getCheckoutSession(id);
  if (!session) notFound();

  const expired = session.expiresAt <= new Date();
  const inTelegram = typeof telegram === "string" && validCheckoutProof(id, session.expiresAt, telegram);
  if (telegram !== undefined && !inTelegram) notFound();

  const nonce = inTelegram ? (await headers()).get("x-nonce") ?? undefined : undefined;
  const payment = session.result
    ? await db.transaction.findUnique({
        where: {
          projectId_idempotencyKey: {
            projectId: session.projectId,
            idempotencyKey: `checkout_${id}`,
          },
        },
      })
    : null;
  const telegramLink = !inTelegram && !session.result && !expired
    ? telegramCheckoutLink(id, session.expiresAt)
    : null;
  const qr = telegramLink ? await QRCode.toDataURL(telegramLink, { width: 224 }) : null;

  return (
    <main className="brand-payment-page">
      <Logo />
      <p className="sandbox-label">Unit muhiti · Haqiqiy pul ishlatilmaydi</p>
      <h1>{session.title}</h1>
      <p>{session.project.name}</p>
      <h2>{money(session.amountMinor)} {session.currency}</h2>
      {payment ? (
        <p role="status">
          {payment.status === "pending" ? "To‘lov tekshirilmoqda." : `To‘lov ${statusLabel(payment.status)}.`} Tranzaksiya: {payment.id}. Pul o‘tkazilmadi.
        </p>
      ) : session.result ? (
        <p role="status">To‘lov tekshirilmoqda.</p>
      ) : expired ? (
        <>
          <p role="alert">Bu to‘lov havolasining muddati tugagan.</p>
          {!inTelegram && <RenewCheckout id={id} />}
        </>
      ) : telegramLink && qr ? (
        <>
          <div className="checkout-telegram">
            <a className="button primary" href={telegramLink} target="_blank" rel="noopener noreferrer">
              Telegram orqali to‘lash (sinov)
            </a>
            <Image src={qr} alt="Telegram’da sinov buyurtmasini ochish uchun QR-kod" width={224} height={224} unoptimized />
          </div>
          <details>
            <summary>Telegram ishlatmasdan brauzerda sinash</summary>
            <CheckoutAction id={id} />
          </details>
        </>
      ) : (
        <CheckoutAction id={id} telegram={inTelegram ? telegram : undefined} nonce={nonce} />
      )}
      {!session.result && !expired && <CheckoutWatch id={id} />}
      <p className="muted">
        Sotuvchi to‘lov natijasini server API’si yoki imzolangan webhook orqali tekshirishi kerak.
      </p>
    </main>
  );
}

import { db } from "@/server/db";
import { notFound } from "next/navigation";
import { Logo, money } from "@/components/ui";
import { CheckoutAction } from "@/components/checkout-action";
export const dynamic = "force-dynamic";
export const metadata = {
  title: "Sinov to‘lovi havolasi",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};
export default async function PaymentLink({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const link = await db.paymentLink.findUnique({
    where: { id },
    include: { project: true },
  });
  if (!link || link.disabledAt || link.project.archivedAt) notFound();
  return (
    <main className="brand-payment-page">
      <Logo />
      <p className="sandbox-label">Unit muhiti · Haqiqiy pul ishlatilmaydi</p>
      <h1>{link.title}</h1>
      <p>{link.project.name}</p>
      <h2>{money(link.amountMinor)} UZS</h2>
      <CheckoutAction id={id} start />
    </main>
  );
}

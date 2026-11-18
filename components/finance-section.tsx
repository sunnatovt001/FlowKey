import { financialOverview } from "@/server/finance";
import { roleAllows } from "@/shared/project-role";
import { notFound } from "next/navigation";
import { db } from "@/server/db";
import { FinanceHub } from "@/components/finance-hub";
import "@/styles/finance.css";

export async function FinanceSection({
  projectId,
  role,
  testing = false,
}: {
  projectId: string;
  role: string;
  testing?: boolean;
}) {
  if (!roleAllows(role, "finance")) notFound();
  const [data, payments] = await Promise.all([
    financialOverview(projectId),
    role === "owner"
      ? db.transaction.findMany({
          where: { projectId: projectId, status: "successful" },
          orderBy: { createdAt: "desc" },
          take: 50,
          select: { id: true, amountMinor: true },
        })
      : Promise.resolve([]),
  ]);
  return (
    <FinanceHub
      testing={testing}
      projectId={projectId}
      owner={role === "owner"}
      balances={data.balances}
      payments={payments.map((p) => ({
        id: p.id,
        amount: String(p.amountMinor),
      }))}
      payouts={data.payouts.map((p) => ({
        id: p.id,
        amount: String(p.amountMinor),
        status: p.status,
        date: p.createdAt.toISOString(),
      }))}
      refunds={data.refunds.map((r) => ({
        id: r.id,
        paymentId: r.paymentId,
        amount: String(r.amountMinor),
        fee: String(r.feeMinor),
        date: r.createdAt.toISOString(),
      }))}
      journal={data.journal.map((e) => ({
        id: e.id,
        operationId: e.operationId,
        account: e.account,
        amount: String(e.amountMinor),
        currency: e.currency,
      }))}
    />
  );
}

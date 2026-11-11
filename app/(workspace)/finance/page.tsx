import { workspace, type Search } from "@/server/workspace";
import { financialOverview } from "@/server/finance";
import { roleAllows } from "@/shared/project-role";
import { notFound } from "next/navigation";
import { db } from "@/server/db";
import { FinanceHub } from "@/components/finance-hub";
import "@/styles/finance.css";
export const metadata = { title: "Moliya" };
export default async function Finance({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  const { project, role } = await workspace(await searchParams);
  if (!roleAllows(role, "finance")) notFound();
  const [data, payments] = await Promise.all([
    financialOverview(project.id),
    role === "owner"
      ? db.transaction.findMany({
          where: { projectId: project.id, status: "successful" },
          orderBy: { createdAt: "desc" },
          take: 50,
          select: { id: true, amountMinor: true },
        })
      : Promise.resolve([]),
  ]);
  return (
    <FinanceHub
      projectId={project.id}
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

import { Prisma } from "@prisma/client";
import { workspace, type Search } from "@/server/workspace";
import { db } from "@/server/db";
import {
  paymentFilters,
  paymentRangeError,
  paymentToday,
} from "@/shared/payments";
import { PaymentsView } from "@/components/payments-view";
import "@/styles/payments.css";
export const metadata = { title: "To‘lovlar" };
export default async function Transactions({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  const search = await searchParams;
  const { project } = await workspace(search, true);
  const filters = paymentFilters(search),
    rangeError = paymentRangeError(filters);
  const { q, status, from, to } = filters;
  const base: Prisma.TransactionWhereInput = {
    projectId: project.id,
    ...(q ? { id: { contains: q } } : {}),
    ...(from || to
      ? {
          createdAt: {
            ...(from ? { gte: new Date(`${from}T00:00:00+05:00`) } : {}),
            ...(to ? { lte: new Date(`${to}T23:59:59.999+05:00`) } : {}),
          },
        }
      : {}),
  };
  const groups = rangeError
    ? []
    : await db.transaction.groupBy({
        by: ["status", "currency"],
        where: base,
        _count: { _all: true },
        _sum: { amountMinor: true },
      });
  const totals = { all: 0, successful: 0, pending: 0, failed: 0, volume: "0" };
  for (const group of groups) {
    totals.all += group._count._all;
    if (
      group.status === "successful" ||
      group.status === "pending" ||
      group.status === "failed"
    )
      totals[group.status] += group._count._all;
    if (group.status === "successful" && group.currency === "UZS")
      totals.volume = String(group._sum.amountMinor || 0n);
  }
  const count = status
    ? totals[status as "successful" | "pending" | "failed"]
    : totals.all;
  const pages = Math.max(1, Math.ceil(count / 20));
  const raw = Number(search.page),
    page = Number.isFinite(raw)
      ? Math.min(pages, Math.max(1, Math.floor(raw) || 1))
      : 1;
  const rows = rangeError
    ? []
    : await db.transaction.findMany({
        where: { ...base, ...(status ? { status } : {}) },
        select: {
          id: true,
          amountMinor: true,
          currency: true,
          createdAt: true,
          status: true,
        },
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        skip: (page - 1) * 20,
        take: 20,
      });
  return (
    <PaymentsView
      key={project.id}
      project={{ id: project.id, name: project.name }}
      filters={filters}
      totals={totals}
      count={count}
      page={page}
      pages={pages}
      today={paymentToday()}
      rows={rows.map((t) => ({
        ...t,
        amountMinor: Number(t.amountMinor),
        createdAt: t.createdAt.toISOString(),
      }))}
    />
  );
}

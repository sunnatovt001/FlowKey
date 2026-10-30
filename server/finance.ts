import { Prisma } from "@prisma/client";
import { db } from "./db";
import { ApiError } from "./security";
import { feeFor, refundSplit, nextBilling } from "./finance-rules";
import { createPayment } from "./payments";
type Tx = Prisma.TransactionClient;

// Every balance-changing operation takes the same transaction-scoped project lock.
export async function lockFinance(tx: Tx, projectId: string) {
  await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtextextended(${projectId}, 0))::text`;
  const project = await tx.project.findUnique({ where: { id: projectId } });
  if (!project || project.archivedAt)
    throw new ApiError(409, "Faol loyiha kerak.");
}
export async function post(
  tx: Tx,
  projectId: string,
  operationId: string,
  currency: string,
  entries: Record<string, bigint>,
) {
  if (Object.values(entries).reduce((a, b) => a + b, 0n) !== 0n)
    throw new Error("Unbalanced journal");
  if (await tx.ledgerEntry.findFirst({ where: { operationId } })) return;
  await tx.ledgerEntry.createMany({
    data: Object.entries(entries).map(([account, amountMinor]) => ({
      projectId,
      operationId,
      currency,
      account,
      amountMinor,
    })),
  });
}
export async function postPayment(
  tx: Tx,
  t: {
    id: string;
    projectId: string;
    status: string;
    currency: string;
    amountMinor: bigint;
  },
) {
  if (t.status !== "successful") return;
  const fee = feeFor(t.amountMinor);
  await post(tx, t.projectId, `payment:${t.id}`, t.currency, {
    provider: -t.amountMinor,
    fees: fee,
    available: t.amountMinor - fee,
  });
}
async function amount(
  tx: Tx,
  projectId: string,
  currency: string,
  account: string,
) {
  return (
    (
      await tx.ledgerEntry.aggregate({
        where: { projectId, currency, account },
        _sum: { amountMinor: true },
      })
    )._sum.amountMinor || 0n
  );
}
export async function financialOverview(projectId: string) {
  return db.$transaction(
    async (tx) => {
      await lockFinance(tx, projectId);
      const [balances, refunds, payouts, journal, subscriptions] =
        await Promise.all([
          tx.ledgerEntry.groupBy({
            by: ["currency", "account"],
            where: { projectId },
            _sum: { amountMinor: true },
          }),
          tx.refund.findMany({
            where: { projectId },
            orderBy: { createdAt: "desc" },
            take: 50,
          }),
          tx.payout.findMany({
            where: { projectId },
            orderBy: { createdAt: "desc" },
            take: 50,
          }),
          tx.ledgerEntry.findMany({
            where: { projectId },
            orderBy: [{ createdAt: "desc" }, { id: "desc" }],
            take: 100,
          }),
          tx.subscription.findMany({
            where: { projectId },
            orderBy: { createdAt: "desc" },
            take: 50,
          }),
        ]);
      return {
        balances: balances.map((b) => ({
          currency: b.currency,
          account: b.account,
          amountMinor: String(b._sum.amountMinor || 0n),
        })),
        refunds,
        payouts,
        journal,
        subscriptions,
        livemode: false,
      };
    },
    { timeout: 20000 },
  );
}
export async function refundPayment(
  projectId: string,
  actorId: string,
  paymentId: string,
  value: bigint,
  requestKey: string,
) {
  return db.$transaction(
    async (tx) => {
      await lockFinance(tx, projectId);
      const old = await tx.refund.findUnique({
        where: { projectId_requestKey: { projectId, requestKey } },
      });
      if (old) {
        if (old.paymentId !== paymentId || old.amountMinor !== value)
          throw new ApiError(
            409,
            "So‘rov kaliti boshqa qaytarish uchun ishlatilgan.",
          );
        return old;
      }
      const payment = await tx.transaction.findFirst({
        where: { id: paymentId, projectId, status: "successful" },
      });
      if (!payment) throw new ApiError(404, "Muvaffaqiyatli to‘lov topilmadi.");
      const previous =
        (
          await tx.refund.aggregate({
            where: { paymentId },
            _sum: { amountMinor: true },
          })
        )._sum.amountMinor || 0n;
      const split = refundSplit(payment.amountMinor, previous, value);
      if (
        (await amount(tx, projectId, payment.currency, "available")) <
        split.merchant
      )
        throw new ApiError(409, "Qaytarish uchun bo‘sh balans yetarli emas.");
      const row = await tx.refund.create({
        data: {
          projectId,
          actorId,
          paymentId,
          requestKey,
          amountMinor: value,
          feeMinor: split.fee,
        },
      });
      await post(tx, projectId, `refund:${row.id}`, payment.currency, {
        provider: value,
        fees: -split.fee,
        available: -split.merchant,
      });
      await tx.auditLog.create({
        data: {
          projectId,
          actorId,
          action: "sandbox.refund.created",
          resourceId: row.id,
        },
      });
      return row;
    },
    { timeout: 20000 },
  );
}
export async function requestPayout(
  projectId: string,
  actorId: string,
  value: bigint,
  requestKey: string,
) {
  return db.$transaction(
    async (tx) => {
      await lockFinance(tx, projectId);
      const old = await tx.payout.findUnique({
        where: { projectId_requestKey: { projectId, requestKey } },
      });
      if (old) {
        if (old.amountMinor !== value)
          throw new ApiError(
            409,
            "So‘rov kaliti boshqa summa uchun ishlatilgan.",
          );
        return old;
      }
      if (value < 2000000n)
        throw new ApiError(400, "Eng kam summa 20 000 UZS.");
      if ((await amount(tx, projectId, "UZS", "available")) < value)
        throw new ApiError(409, "Mavjud balans yetarli emas.");
      const row = await tx.payout.create({
        data: { projectId, actorId, requestKey, amountMinor: value },
      });
      await post(tx, projectId, `reserve:${row.id}`, "UZS", {
        available: -value,
        reserved: value,
      });
      await tx.auditLog.create({
        data: {
          projectId,
          actorId,
          action: "sandbox.payout.requested",
          resourceId: row.id,
        },
      });
      return row;
    },
    { timeout: 20000 },
  );
}
export async function transitionPayout(
  projectId: string,
  actorId: string,
  id: string,
  action: "approve" | "reject" | "complete" | "fail",
) {
  return db.$transaction(async (tx) => {
    await lockFinance(tx, projectId);
    const row = await tx.payout.findFirst({ where: { id, projectId } });
    if (!row) throw new ApiError(404, "Ariza topilmadi.");
    const target = {
      approve: "approved",
      reject: "rejected",
      complete: "completed",
      fail: "failed",
    }[action];
    if (row.status === target) return row;
    if (!(
      (row.status === "requested" && ["approve", "reject"].includes(action)) ||
      (row.status === "approved" && ["complete", "fail"].includes(action))
    ))
      throw new ApiError(409, "Ariza holati bu amalga mos emas.");
    if (action === "complete")
      await post(tx, projectId, `payout:${id}`, row.currency, {
        reserved: -row.amountMinor,
        paid: row.amountMinor,
      });
    if (action === "reject" || action === "fail")
      await post(tx, projectId, `release:${id}`, row.currency, {
        reserved: -row.amountMinor,
        available: row.amountMinor,
      });
    const updated = await tx.payout.update({
      where: { id },
      data: {
        status: target,
        ...(action === "approve" ? { approvedBy: actorId } : {}),
      },
    });
    await tx.auditLog.create({
      data: {
        projectId,
        actorId,
        action: `sandbox.payout.${target}`,
        resourceId: id,
      },
    });
    return updated;
  });
}
export async function createSubscription(
  projectId: string,
  actorId: string,
  data: { title: string; amountMinor: bigint; interval: string },
  requestKey: string,
) {
  return db.$transaction(async (tx) => {
    await lockFinance(tx, projectId);
    const existing = await tx.subscription.findUnique({
      where: { projectId_requestKey: { projectId, requestKey } },
    });
    if (existing) {
      if (
        existing.title !== data.title ||
        existing.amountMinor !== data.amountMinor ||
        existing.interval !== data.interval
      )
        throw new ApiError(
          409,
          "So‘rov kaliti boshqa obuna uchun ishlatilgan.",
        );
      return existing;
    }
    const row = await tx.subscription.create({
      data: {
        ...data,
        projectId,
        requestKey,
        consentAt: new Date(),
        nextBillingAt: new Date(),
      },
    });
    await tx.auditLog.create({
      data: {
        projectId,
        actorId,
        action: "sandbox.subscription.created",
        resourceId: row.id,
      },
    });
    return row;
  });
}
export async function billSubscription(
  projectId: string,
  actorId: string,
  id: string,
  period: number,
) {
  return db.$transaction(
    async (tx) => {
      await lockFinance(tx, projectId);
      const row = await tx.subscription.findFirst({ where: { id, projectId } });
      if (!row) throw new ApiError(404, "Obuna topilmadi.");
      if (
        row.status !== "active" ||
        row.period !== period ||
        row.nextBillingAt > new Date()
      )
        throw new ApiError(
          409,
          "Obuna davri hali tayyor emas yoki allaqachon bajarilgan.",
        );
      // The period is the idempotency boundary, including a crash before advancing its schedule.
      const payment = await createPayment(
        projectId,
        {
          amount_minor: Number(row.amountMinor),
          currency: row.currency,
          result: "successful",
        },
        `subscription_${id}_${period}`,
        tx,
      );
      await tx.subscription.update({
        where: { id },
        data: {
          period: { increment: 1 },
          nextBillingAt: nextBilling(row.nextBillingAt, row.interval),
        },
      });
      await tx.auditLog.create({
        data: {
          projectId,
          actorId,
          action: "sandbox.subscription.billed",
          resourceId: id,
        },
      });
      return payment;
    },
    { timeout: 20000 },
  );
}
export async function cancelSubscription(
  projectId: string,
  actorId: string,
  id: string,
) {
  return db.$transaction(async (tx) => {
    await lockFinance(tx, projectId);
    const row = await tx.subscription.findFirst({ where: { id, projectId } });
    if (!row) throw new ApiError(404, "Obuna topilmadi.");
    await tx.subscription.update({
      where: { id },
      data: { status: "cancelled" },
    });
    await tx.auditLog.create({
      data: {
        projectId,
        actorId,
        action: "sandbox.subscription.cancelled",
        resourceId: id,
      },
    });
    return { ok: true };
  });
}

import { Prisma } from "@prisma/client";
import { db } from "./db";
import { ApiError, hash } from "./security";
import { payment } from "./validators";
import { randomUUID } from "node:crypto";
import { sandboxProvider } from "./providers/sandbox";
import { lockFinance, postPayment } from "./finance";
export function serializePayment(t: {
  id: string;
  amountMinor: number | bigint;
  currency: string;
  status: string;
  createdAt: Date;
  projectId: string;
}) {
  return {
    id: t.id,
    amount_minor: Number(t.amountMinor),
    currency: t.currency,
    status: t.status,
    project_id: t.projectId,
    livemode: false,
    created_at: t.createdAt.toISOString(),
  };
}
export async function createPayment(
  projectId: string,
  input: unknown,
  idempotencyKey: string | null,
  transaction?: Prisma.TransactionClient,
  checkoutSessionId?: string,
) {
  if (input && typeof input === "object" && "simulated_result" in input) {
    const value = input as Record<string, unknown>;
    if (value.result !== undefined && value.result !== value.simulated_result)
      throw new ApiError(400, "Sinov natijalari bir-biriga zid.");
    input = { ...value, result: value.simulated_result };
  }
  const data = payment.parse(input);
  if (!idempotencyKey || !/^[\w-]{8,128}$/.test(idempotencyKey))
    throw new ApiError(
      400,
      "Idempotency-Key 8–128 ta harf, raqam, pastki chiziq yoki chiziqchadan iborat bo‘lsin.",
    );
  if (!checkoutSessionId && /^checkout_[a-f0-9]{64}$/.test(idempotencyKey)) {
    throw new ApiError(400, "Bu idempotency kaliti checkout uchun ajratilgan.");
  }
  const requestHash = hash(JSON.stringify(data));
  const existing = await (transaction || db).transaction.findUnique({
    where: { projectId_idempotencyKey: { projectId, idempotencyKey } },
  });
  if (existing) {
    if (existing.requestHash !== requestHash)
      throw new ApiError(
        409,
        "Idempotency kaliti oldin boshqa so‘rov uchun ishlatilgan.",
        "idempotency_conflict",
      );
    return { ...serializePayment(existing), replayed: true };
  }
  try {
    const execute = async (tx: Prisma.TransactionClient) => {
      if (!transaction) await lockFinance(tx, projectId);
      const project = await tx.project.findUnique({ where: { id: projectId } });
      if (!project || project.archivedAt)
        throw new ApiError(409, "Loyiha arxivlangan yoki mavjud emas.");
      const id = randomUUID();
      const result = await sandboxProvider.createPayment({
        id,
        amountMinor: BigInt(data.amount_minor),
        currency: data.currency,
        outcome: data.result,
      });
      const t = await tx.transaction.create({
        data: {
          id,
          projectId,
          amountMinor: data.amount_minor,
          currency: data.currency,
          status: result.status,
          providerReference: result.reference,
          idempotencyKey,
          requestHash,
        },
      });
      await postPayment(tx, t);
      const endpoints = await tx.webhookEndpoint.findMany({
        where: {
          projectId,
          disabledAt: null,
          events: { has: `payment.${data.result}` },
        },
      });
      const eventId = `evt_${t.id}`;
      const payload = JSON.stringify({
        id: eventId,
        type: `payment.${data.result}`,
        data: { ...serializePayment(t), ...(checkoutSessionId && { checkout_session_id: checkoutSessionId }) },
      });
      await tx.paymentEvent.create({
        data: {
          id: eventId,
          transactionId: t.id,
          type: `payment.${data.result}`,
          payload,
        },
      });
      if (endpoints.length)
        await tx.webhookDelivery.createMany({
          data: endpoints.map((e) => ({
            endpointId: e.id,
            transactionId: t.id,
            event: `payment.${data.result}`,
            eventId,
            payload,
          })),
        });
      await tx.auditLog.create({
        data: { projectId, action: "payment.created", resourceId: t.id },
      });
      return t;
    };
    const t = transaction
      ? await execute(transaction)
      : await db.$transaction(execute, { maxWait: 20000, timeout: 20000 });
    return { ...serializePayment(t), replayed: false };
  } catch (e) {
    if (transaction) throw e;
    if (
      e instanceof Prisma.PrismaClientKnownRequestError &&
      e.code === "P2002"
    ) {
      const t = await db.transaction.findUniqueOrThrow({
        where: { projectId_idempotencyKey: { projectId, idempotencyKey } },
      });
      if (t.requestHash !== requestHash)
        throw new ApiError(
          409,
          "Idempotency kaliti ziddiyati.",
          "idempotency_conflict",
        );
      return { ...serializePayment(t), replayed: true };
    }
    throw e;
  }
}

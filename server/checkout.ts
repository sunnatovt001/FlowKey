import { randomBytes } from "node:crypto";
import { Prisma } from "@prisma/client";
import { db } from "./db";
import { ApiError, hash } from "./security";
import { checkoutInput } from "./checkout-validation";
import { createPayment } from "./payments";
import { lockFinance } from "./finance";
export const checkoutLifetime = 30 * 60_000;
const id = () => randomBytes(32).toString("hex");
export function checkoutUrl(path: string) {
  const origin = process.env.APP_URL;
  if (!origin) throw new ApiError(503, "APP_URL sozlanmagan.");
  return new URL(path, origin).href;
}
export async function newSession(
  projectId: string,
  input: unknown,
  key: string | null,
  linkId?: string,
) {
  const data = checkoutInput.parse(input);
  if (!key || !/^[\w-]{8,128}$/.test(key))
    throw new ApiError(400, "8–128 belgili Idempotency-Key kerak.");
  const requestKey = `checkout:${key}`;
  const requestHash = hash(JSON.stringify({ ...data, linkId }));
  const project = await db.project.findUnique({ where: { id: projectId } });
  if (!project || project.archivedAt)
    throw new ApiError(404, "Loyiha mavjud emas.");
  // Empty update lets the unique constraint serialize concurrent creates without replacing a session.
  const session = await db.checkoutSession
    .upsert({
      where: { projectId_requestKey: { projectId, requestKey } },
      update: {},
      create: {
        id: id(),
        projectId,
        linkId,
        title: data.title,
        amountMinor: data.amount_minor,
        currency: data.currency,
        requestKey,
        requestHash,
        expiresAt: new Date(Date.now() + checkoutLifetime),
      },
    })
    .catch(async (error) => {
      // Prisma can emulate an empty-update upsert. Concurrent inserts may lose
      // the unique-key race; return the winning session rather than a conflict.
      if (
        !(error instanceof Prisma.PrismaClientKnownRequestError) ||
        error.code !== "P2002"
      )
        throw error;
      const existing = await db.checkoutSession.findUnique({
        where: { projectId_requestKey: { projectId, requestKey } },
      });
      if (!existing) throw error;
      return existing;
    });
  if (session.requestHash !== requestHash)
    throw new ApiError(
      409,
      "Idempotency kaliti boshqa to‘lov sessiyasi uchun ishlatilgan.",
      "idempotency_conflict",
    );
  return {
    id: session.id,
    url: checkoutUrl(`/checkout/${session.id}`),
    expires_at: session.expiresAt.toISOString(),
    livemode: false,
  };
}
export async function getCheckoutSession(id: string) {
  if (!/^[a-f0-9]{64}$/.test(id)) return null;
  const session = await db.checkoutSession.findUnique({
    where: { id }, include: { project: true, link: true },
  });
  return session && !session.project.archivedAt && !session.link?.disabledAt ? session : null;
}

export async function refreshCheckout(id: string) {
  const session = await getCheckoutSession(id);
  if (!session) throw new ApiError(404, "To‘lov sessiyasi mavjud emas.");
  const now = new Date();
  await db.checkoutSession.updateMany({
    where: { id, result: null, expiresAt: { lte: now } },
    data: { expiresAt: new Date(now.getTime() + checkoutLifetime) },
  });
}

export async function completeSession(
  sessionId: string,
  result: "successful" | "failed" | "pending",
  expectedExpiry?: Date,
) {
  const session = await getCheckoutSession(sessionId);
  if (!session) throw new ApiError(404, "To‘lov sessiyasi mavjud emas.");
  return db.$transaction(async tx => {
    await lockFinance(tx, session.projectId);
    const locked = await tx.checkoutSession.findUniqueOrThrow({
      where: { id: sessionId }, include: { project: true, link: true },
    });
    if (locked.project.archivedAt || locked.link?.disabledAt) {
      throw new ApiError(404, "To‘lov sessiyasi mavjud emas.");
    }
    if (expectedExpiry && locked.expiresAt.getTime() !== expectedExpiry.getTime()) {
      throw new ApiError(410, "Telegram havolasining muddati tugagan.");
    }
    if (!locked.result) {
      const changed = await tx.checkoutSession.updateMany({
        where: { id: sessionId, result: null, expiresAt: { gt: new Date(), equals: locked.expiresAt } },
        data: { result },
      });
      if (!changed.count) throw new ApiError(410, "To‘lov sessiyasi muddati tugagan.");
    }
    return createPayment(
      locked.projectId,
      { amount_minor: Number(locked.amountMinor), currency: locked.currency, result: locked.result ?? result },
      `checkout_${sessionId}`,
      tx,
      sessionId,
    );
  }, { maxWait: 20000, timeout: 20000 });
}

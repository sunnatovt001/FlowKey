import { randomBytes } from "node:crypto";
import { Prisma } from "@prisma/client";
import { db } from "./db";
import { ApiError, hash } from "./security";
import { checkoutInput } from "./checkout-validation";
import { createPayment } from "./payments";
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
        expiresAt: new Date(Date.now() + 30 * 60_000),
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
export async function completeSession(
  sessionId: string,
  result: "successful" | "failed" | "pending",
) {
  const session = await db.checkoutSession.findUnique({
    where: { id: sessionId },
    include: { project: true, link: true },
  });
  if (!session || session.project.archivedAt || session.link?.disabledAt)
    throw new ApiError(404, "To‘lov sessiyasi mavjud emas.");
  if (!session.result && session.expiresAt <= new Date())
    throw new ApiError(
      410,
      "To‘lov sessiyasi muddati tugagan. To‘lov havolasini qayta oching.",
    );
  await db.checkoutSession.updateMany({
    where: { id: sessionId, result: null, expiresAt: { gt: new Date() } },
    data: { result },
  });
  const locked = await db.checkoutSession.findUniqueOrThrow({
    where: { id: sessionId },
  });
  if (!locked.result)
    throw new ApiError(410, "To‘lov sessiyasi muddati tugagan.");
  return createPayment(
    session.projectId,
    {
      amount_minor: Number(session.amountMinor),
      currency: session.currency,
      result: locked.result,
    },
    `checkout_${sessionId}`,
  );
}

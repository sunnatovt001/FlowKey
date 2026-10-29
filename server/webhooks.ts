import { lookup } from "node:dns/promises";
import { request } from "node:https";
import { db } from "./db";
import { ApiError, decrypt, isPublicAddress, webhookUrl } from "./security";
import { serializePayment } from "./payments";
import { signWebhook } from "./webhook-signature";
export async function resolveEndpoint(value: string) {
  const url = webhookUrl(value);
  let timer: ReturnType<typeof setTimeout> | undefined;
  const addresses = await Promise.race([
    lookup(url.hostname, { all: true }),
    new Promise<never>((_, reject) => {
      timer = setTimeout(
        () => reject(new ApiError(400, "Endpoint DNS tekshiruvi vaqti tugadi.")),
        3000,
      );
    }),
  ]).finally(() => clearTimeout(timer));
  if (!addresses.length || addresses.some((a) => !isPublicAddress(a.address)))
    throw new ApiError(400, "Endpoint xavfli manzilga bog‘langan.");
  return { url, address: addresses[0].address };
}
type Transport = (
  destination: string,
  payload: string,
  signature: string,
) => Promise<number>;
export const sendWebhook: Transport = async (
  destination,
  payload,
  signature,
) => {
  const { url, address } = await resolveEndpoint(destination);
  return new Promise<number>((resolve, reject) => {
    const outgoing = request(
      url,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(payload),
          "Flowza-Signature": signature,
          "User-Agent": "FLOWZA-Sandbox/1.0",
        },
        lookup: (_hostname, _options, callback) => callback(null, address, 4),
      },
      (response) => {
        const status = response.statusCode || 0;
        response.destroy();
        resolve(status);
      },
    );
    const timer = setTimeout(
      () => outgoing.destroy(new Error("Yetkazish vaqti tugadi")),
      5000,
    );
    outgoing.on("close", () => clearTimeout(timer));
    outgoing.on("error", reject);
    outgoing.end(payload);
  });
};
export async function deliver(
  id: string,
  projectId: string,
  transport: Transport = sendWebhook,
) {
  const delivery = await db.webhookDelivery.findFirst({
    where: { id, endpoint: { projectId, disabledAt: null } },
    include: { endpoint: true, transaction: true },
  });
  if (!delivery) throw new ApiError(404, "Yetkazish yozuvi topilmadi.");
  if (delivery.status === "delivered" || delivery.attempts >= 5)
    throw new ApiError(409, "Yetkazish tugagan yoki urinishlar limiti tugagan.");
  const attempt = await db.$transaction(async (tx) => {
    const claimed = await tx.webhookDelivery.updateMany({
      where: {
        id,
        attempts: delivery.attempts,
        status: { in: ["queued", "failed"] },
      },
      data: {
        status: "sending",
        attempts: { increment: 1 },
        lastAttemptAt: new Date(),
        leaseUntil: new Date(Date.now() + 30000),
      },
    });
    if (!claimed.count)
      throw new ApiError(409, "Hodisa allaqachon yuborilmoqda.");
    return tx.webhookDeliveryAttempt.create({
      data: { deliveryId: id, attemptNumber: delivery.attempts + 1 },
    });
  });
  let responseCode: number | null = null,
    error: string | null = null;
  try {
    const payload =
      delivery.payload ||
      JSON.stringify({
        id: delivery.id,
        type: delivery.event,
        data: serializePayment(delivery.transaction),
      });
    const signature = signWebhook(
      payload,
      decrypt(delivery.endpoint.secretEncrypted),
    );
    responseCode = await transport(delivery.endpoint.url, payload, signature);
    if (responseCode < 200 || responseCode >= 300)
      error = `Endpoint returned HTTP ${responseCode}. Redirects are never followed.`;
  } catch {
    error = "Yetkazib bo‘lmadi: endpointga ulanib bo‘lmaydi, manzil xavfli yoki vaqt tugagan.";
  }
  await db.webhookDeliveryAttempt.update({
    where: { id: attempt.id },
    data: { responseCode, error, completedAt: new Date() },
  });
  const delays = [60000, 300000, 1800000, 7200000];
  return db.webhookDelivery.update({
    where: { id },
    data: {
      status: error ? "failed" : "delivered",
      responseCode,
      error,
      leaseUntil: null,
      nextAttemptAt: new Date(
        Date.now() + (delays[delivery.attempts] || 7200000),
      ),
    },
  });
}

export async function dispatchDue() {
  const expired = await db.webhookDelivery.findMany({
    where: { status: "sending", leaseUntil: { lt: new Date() } },
    take: 100,
  });
  for (const delivery of expired) {
    await db.$transaction(async (tx) => {
      const recovered = await tx.webhookDelivery.updateMany({
        where: {
          id: delivery.id,
          status: "sending",
          leaseUntil: { lt: new Date() },
        },
        data: {
          status: "failed",
          leaseUntil: null,
          error: "Ishchi to‘xtadi; xabar qabul qiluvchiga yetgan bo‘lishi mumkin.",
        },
      });
      if (recovered.count)
        await tx.webhookDeliveryAttempt.updateMany({
          where: { deliveryId: delivery.id, completedAt: null },
          data: {
            completedAt: new Date(),
            error: "Ishchi to‘xtadi; qabul qiluvchi natijasi noma’lum.",
          },
        });
    });
  }
  const due = await db.webhookDelivery.findMany({
    where: {
      status: { in: ["queued", "failed"] },
      attempts: { lt: 5 },
      nextAttemptAt: { lte: new Date() },
      endpoint: { disabledAt: null, project: { archivedAt: null } },
    },
    include: { endpoint: true },
    orderBy: { nextAttemptAt: "asc" },
    take: 20,
  });
  for (const item of due) {
    try {
      await deliver(item.id, item.endpoint.projectId);
    } catch (error) {
      if (!(error instanceof ApiError && error.status === 409)) throw error;
    }
  }
  await db.rateLimit.deleteMany({ where: { resetsAt: { lt: new Date() } } });
  await db.session.deleteMany({ where: { expiresAt: { lt: new Date() } } });
  await db.authRateLimit.deleteMany({
    where: { lastRequest: { lt: BigInt(Date.now() - 86400000) } },
  });
  return due.length;
}

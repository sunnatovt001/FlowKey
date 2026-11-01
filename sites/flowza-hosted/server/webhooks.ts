import { resolve4,resolve6 } from "node:dns/promises";
import { createHmac } from "node:crypto";
import { db } from "./db";
import { ApiError, decrypt, isPublicAddress, webhookUrl } from "./security";
import { serializePayment } from "./payments";
export async function resolveEndpoint(value: string) {
  const url = webhookUrl(value);
  let timer: ReturnType<typeof setTimeout> | undefined;
  const addresses = await Promise.race([
    Promise.all([resolve4(url.hostname),resolve6(url.hostname).catch(()=>[])]).then(([v4,v6])=>[...v4,...v6].map(address=>({address}))),
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
export async function deliver(id: string, projectId: string) {
  const delivery = await db.webhookDelivery.findFirst({
    where: { id, endpoint: { projectId, disabledAt: null } },
    include: { endpoint: true, transaction: true },
  });
  if (!delivery) throw new ApiError(404, "Yetkazish yozuvi topilmadi.");
  if (delivery.status === "delivered" || delivery.attempts >= 3)
    throw new ApiError(409, "Yetkazish tugagan yoki urinishlar limiti tugagan.");
  const claimed = await db.webhookDelivery.updateMany({
    where: {
      id,
      attempts: delivery.attempts,
      status: { in: ["queued", "failed"] },
    },
    data: {
      status: "sending",
      attempts: { increment: 1 },
      lastAttemptAt: new Date(),
    },
  });
  if (!claimed.count)
    throw new ApiError(409, "Hodisa allaqachon yuborilmoqda.");
  let responseCode: number | null = null,
    error: string | null = null;
  try {
    const { url } = await resolveEndpoint(delivery.endpoint.url);
    const timestamp = Math.floor(Date.now() / 1000);
    const payload = JSON.stringify({
      id: delivery.id,
      type: delivery.event,
      data: serializePayment(delivery.transaction),
    });
    const signature = createHmac(
      "sha256",
      decrypt(delivery.endpoint.secretEncrypted),
    )
      .update(`${timestamp}.${payload}`)
      .digest("hex");
    // This Worker has no origin or VPC network binding. Cloudflare fetch uses public-only egress.
    // DNS is prevalidated again above; fetch never follows redirects.
    const response=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json','Flowza-Signature':`t=${timestamp},v1=${signature}`,'User-Agent':'FLOWZA-Sandbox/1.0'},body:payload,redirect:'manual',signal:AbortSignal.timeout(5000)});
    responseCode=response.status;
    await response.body?.cancel();
    if (responseCode < 200 || responseCode >= 300)
      error = `Endpoint returned HTTP ${responseCode}. Redirects are never followed.`;
  } catch {
    error = "Yetkazib bo‘lmadi: endpointga ulanib bo‘lmaydi, manzil xavfli yoki vaqt tugagan.";
  }
  return db.webhookDelivery.update({
    where: { id },
    data: { status: error ? "failed" : "delivered", responseCode, error },
  });
}


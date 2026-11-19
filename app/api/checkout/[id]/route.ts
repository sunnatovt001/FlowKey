import { z } from "zod";
import { body, handle, limit, sameOrigin } from "@/server/http";
import { completeSession, getCheckoutSession, refreshCheckout } from "@/server/checkout";
import { checkoutOutcome } from "@/server/checkout-validation";
import { validCheckoutProof } from "@/server/telegram-checkout";
import { ApiError } from "@/server/security";
import { verifyMiniAppData } from "@/server/telegram/miniapp-proof";

const telegramOutcome = checkoutOutcome.extend({ initData: z.string().max(8192) });

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const { id } = await params;
    const session = await getCheckoutSession(id);
    if (!session) throw new ApiError(404, "To‘lov sessiyasi mavjud emas.");
    return { changed: !!session.result || session.expiresAt <= new Date() };
  });
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    sameOrigin(req);
    const { id } = await params;
    await limit(`checkout-complete:${id}`, 10);
    const input = await body(req);
    if (new URL(req.url).searchParams.has("refresh")) {
      await refreshCheckout(id);
      return { refreshed: true };
    }
    const token = new URL(req.url).searchParams.get("telegram");
    const session = token === null ? null : await getCheckoutSession(id);
    if (token !== null && (!session || !validCheckoutProof(id, session.expiresAt, token))) {
      throw new ApiError(410, "Telegram havolasining muddati tugagan.");
    }
    if (!session) return completeSession(id, checkoutOutcome.parse(input).result);
    const { initData, result } = telegramOutcome.parse(input);
    try {
      verifyMiniAppData(initData, process.env.TELEGRAM_LOGIN_BOT_TOKEN || "");
    } catch {
      throw new ApiError(401, "Telegram sessiyasi tasdiqlanmadi. Buyurtmani botdan qayta oching.");
    }
    return completeSession(id, result, session.expiresAt);
  });
}

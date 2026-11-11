import { createAuthEndpoint, APIError } from "better-auth/api";
import { setSessionCookie } from "better-auth/cookies";
import { randomBytes, randomUUID, randomInt } from "node:crypto";
import { z } from "zod";
import { db } from "./db";
import { matchesAppOrigin } from "./origins";
import { limit } from "./http";
import { ApiError } from "./security";
import { telegramLoginAvailable, parseTelegramFlow, telegramFlowLifetime, type TelegramLoginFlow } from "./telegram-login";
import { digestTelegramProof, validTelegramBrowserProof, telegramFlowCookie } from "./telegram-login-proof";

const cookieOptions = { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax" as const, path: "/api/auth", maxAge: telegramFlowLifetime / 1000 };
const flowInput = z.object({ flowId: z.string().regex(/^[a-f0-9]{32}$/) });
function checkOrigin(request?: Request) {
  if (!request || !matchesAppOrigin(request.headers.get("origin"), request.url, process.env.APP_URL, process.env.NODE_ENV === "development", request.headers.get("host"))) throw new APIError("FORBIDDEN", { message: "So‘rov manbasiga ruxsat yo‘q." });
  if (!telegramLoginAvailable()) throw new APIError("SERVICE_UNAVAILABLE", { message: "Telegram orqali kirish hali sozlanmagan." });
}
async function rate(key: string, max: number) {
  try { await limit(key, max); } catch (error) {
    if (error instanceof ApiError) throw new APIError("TOO_MANY_REQUESTS", { message: error.message });
    throw error;
  }
}
async function browserFlow(flowId: string, cookie?: string | null) {
  const row = await db.verification.findUnique({ where: { id: flowId } });
  if (!row || row.identifier !== `telegram-login:${flowId}` || row.expiresAt.getTime() <= Date.now()) throw new APIError("BAD_REQUEST", { message: "Kirish havolasi eskirgan. Qayta boshlang." });
  const flow = parseTelegramFlow(row.value);
  if (!validTelegramBrowserProof(cookie, flowId, flow.proofHash)) throw new APIError("FORBIDDEN", { message: "Kirishni boshlagan brauzerga qayting." });
  return { row, flow };
}
export function telegramLoginPlugin() {
  return {
    id: "flowkey-telegram-login",
    endpoints: {
      startTelegramLogin: createAuthEndpoint("/telegram/start", { method: "POST", body: z.object({ language: z.enum(["uz", "ru", "en"]).default("uz") }), requireHeaders: true }, async (ctx) => {
        checkOrigin(ctx.request);
        await rate("telegram-login:start", 60);
        const flowId = randomBytes(16).toString("hex");
        const proof = randomBytes(32).toString("base64url");
        const startToken = randomBytes(16).toString("base64url");
        const code = String(randomInt(100000, 1000000));
        const oldCookie = ctx.getCookie(telegramFlowCookie);
        if (oldCookie) {
          const oldId = oldCookie.split(".")[0];
          if (/^[a-f0-9]{32}$/.test(oldId)) {
            const old = await db.verification.findUnique({ where: { id: oldId } });
            if (old && old.identifier === `telegram-login:${oldId}` && validTelegramBrowserProof(oldCookie, oldId, parseTelegramFlow(old.value).proofHash)) await db.verification.deleteMany({ where: { id: oldId, value: old.value } });
          }
        }
        await db.verification.deleteMany({ where: { identifier: { startsWith: "telegram-login:" }, expiresAt: { lt: new Date() } } });
        const value: TelegramLoginFlow = { proofHash: digestTelegramProof(proof), startHash: digestTelegramProof(startToken), code, language: ctx.body.language, status: "pending" };
        await db.verification.create({ data: { id: flowId, identifier: `telegram-login:${flowId}`, value: JSON.stringify(value), expiresAt: new Date(Date.now() + telegramFlowLifetime) } });
        ctx.setCookie(telegramFlowCookie, `${flowId}.${proof}`, cookieOptions);
        return ctx.json({ flowId, code, expiresIn: telegramFlowLifetime / 1000, url: `https://t.me/${process.env.TELEGRAM_LOGIN_BOT_USERNAME}?start=fk_${flowId}_${startToken}` });
      }),
      statusTelegramLogin: createAuthEndpoint("/telegram/status", { method: "POST", body: flowInput, requireHeaders: true }, async (ctx) => {
        checkOrigin(ctx.request);
        await rate(`telegram-login:poll:${ctx.body.flowId}`, 60);
        const { flow } = await browserFlow(ctx.body.flowId, ctx.getCookie(telegramFlowCookie));
        return ctx.json({ status: flow.status });
      }),
      completeTelegramLogin: createAuthEndpoint("/telegram/complete", { method: "POST", body: flowInput, requireHeaders: true }, async (ctx) => {
        checkOrigin(ctx.request);
        await rate(`telegram-login:complete:${ctx.body.flowId}`, 10);
        const { row, flow } = await browserFlow(ctx.body.flowId, ctx.getCookie(telegramFlowCookie));
        if (flow.status !== "confirmed" || !flow.telegramId) throw new APIError("BAD_REQUEST", { message: "Avval Telegram botida kirishni tasdiqlang." });
        const telegramId = flow.telegramId;
        const account = await db.$transaction(async (tx) => {
          const consumed = await tx.verification.deleteMany({ where: { id: row.id, value: row.value, expiresAt: { gt: new Date() } } });
          if (!consumed.count) throw new APIError("BAD_REQUEST", { message: "Bu kirish havolasi allaqachon ishlatilgan." });
          return tx.account.upsert({
            where: { providerId_accountId: { providerId: "telegram", accountId: telegramId } }, update: {},
            create: { id: randomUUID(), providerId: "telegram", accountId: telegramId, user: { create: { name: flow.name || "Telegram member", email: `telegram-${randomUUID()}@telegram.flowkey.invalid`, emailVerified: false } } },
            include: { user: true },
          });
        });
        const session = await ctx.context.internalAdapter.createSession(account.userId);
        if (!session) throw new APIError("INTERNAL_SERVER_ERROR", { message: "Sessiyani yaratib bo‘lmadi." });
        await setSessionCookie(ctx, { session, user: account.user });
        ctx.setCookie(telegramFlowCookie, "", { ...cookieOptions, maxAge: 0 });
        return ctx.json({ success: true, url: "/onboarding" });
      }),
    },
  };
}

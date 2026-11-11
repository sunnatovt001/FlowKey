import test from "node:test";
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { digestTelegramProof, validTelegramBrowserProof, equalTelegramSecret, privateTelegramSender } from "../server/telegram-login-proof";

test("Telegram browser proofs bind the flow, reject tampering and require full entropy", () => {
  const id = randomBytes(16).toString("hex");
  const proof = randomBytes(32).toString("base64url");
  assert(validTelegramBrowserProof(`${id}.${proof}`, id, digestTelegramProof(proof)));
  assert(!validTelegramBrowserProof(`${id}.${proof}`, "0".repeat(32), digestTelegramProof(proof)));
  assert(!validTelegramBrowserProof(`${id}.${proof}x`, id, digestTelegramProof(proof)));
  assert(!validTelegramBrowserProof(`${id}.short`, id, digestTelegramProof("short")));
  assert(!validTelegramBrowserProof(null, id, digestTelegramProof(proof)));
  assert(!equalTelegramSecret("wrong", "correct"));
  assert(equalTelegramSecret("same", "same"));
});
test("Telegram login accepts only a real sender in their own private chat", () => {
  assert(privateTelegramSender({ id: 123, type: "private" }, { id: 123 }));
  assert(!privateTelegramSender({ id: 123, type: "group" }, { id: 123 }));
  assert(!privateTelegramSender({ id: 124, type: "private" }, { id: 123 }));
  assert(!privateTelegramSender({ id: 123, type: "private" }, { id: 123, is_bot: true }));
});

test("Telegram login confirms privately, consumes once, issues a standard session and never verifies a fake email", { skip: process.env.FLOWZA_TELEGRAM_LOGIN_TEST !== "1" }, async () => {
  const url = new URL(process.env.DATABASE_URL || "postgresql://invalid/invalid");
  assert(["localhost", "127.0.0.1"].includes(url.hostname) && url.pathname.endsWith("_test"), "Disposable local test database required");
  process.env.TELEGRAM_LOGIN_BOT_TOKEN = "test-token-not-a-real-credential";
  process.env.TELEGRAM_LOGIN_BOT_USERNAME = "flowkey_test_bot";
  process.env.TELEGRAM_LOGIN_WEBHOOK_SECRET = "test-webhook-secret-for-local-integration";
  const { auth } = await import("../server/auth-instance");
  const { db } = await import("../server/db");
  const { POST: webhook } = await import("../app/api/telegram-login/webhook/route");
  const base = process.env.APP_URL!;
  const flowIds: string[] = [];
  const users: string[] = [];
  const originalFetch = globalThis.fetch;
  const sent: unknown[] = [];
  globalThis.fetch = async (input, init) => {
    assert.equal(new URL(String(input)).hostname, "api.telegram.org");
    sent.push(JSON.parse(String(init?.body)));
    return Response.json({ ok: true, result: {} });
  };
  const request = (path: string, body: unknown, cookie = "", origin = base) => new Request(base + path, { method: "POST", headers: { origin, "Content-Type": "application/json", cookie }, body: JSON.stringify(body) });
  const call = (action: string, body: unknown, cookie = "", origin = base) => auth.handler(request(`/api/auth/telegram/${action}`, body, cookie, origin));
  async function start() {
    const response = await call("start", { language: "ru" });
    assert.equal(response.status, 200, await response.clone().text());
    const data = await response.json();
    flowIds.push(data.flowId);
    const cookie = response.headers.getSetCookie().find(s => s.startsWith("flowkey-telegram-login="))!.split(";")[0];
    assert(cookie.includes("="));
    const secretCookie = response.headers.getSetCookie().join(";");
    assert(secretCookie.includes("HttpOnly") && secretCookie.toLowerCase().includes("samesite=lax"));
    return { data, cookie };
  }
  async function bot(body: unknown, secret = process.env.TELEGRAM_LOGIN_WEBHOOK_SECRET!) {
    return webhook(new Request(base + "/api/telegram-login/webhook", { method: "POST", headers: { "Content-Type": "application/json", "x-telegram-bot-api-secret-token": secret }, body: JSON.stringify(body) }));
  }
  const sender = { id: 991234567, first_name: "Telegram test" };
  const chat = { id: sender.id, type: "private" };
  try {
    assert.equal((await call("start", { language: "ru" }, "", "https://evil.example")).status, 403);
    const { data, cookie } = await start();
    assert.equal((await call("status", { flowId: data.flowId })).status, 403);
    assert.equal((await call("complete", { flowId: data.flowId }, cookie)).status, 400);
    const payload = new URL(data.url).searchParams.get("start");
    assert.equal((await bot({ message: { chat, from: sender, text: `/start ${payload}` } }, "wrong-secret")).status, 403);
    await bot({ message: { chat: { id: sender.id, type: "group" }, from: sender, text: `/start ${payload}` } });
    assert.equal((await (await call("status", { flowId: data.flowId }, cookie)).json()).status, "pending");
    assert.equal((await bot({ message: { chat, from: sender, text: `/start ${payload}` } })).status, 200);
    assert.equal((await (await call("status", { flowId: data.flowId }, cookie)).json()).status, "awaiting");
    assert(JSON.stringify(sent).includes(data.code));
    await bot({ callback_query: { id: "wrong-person", data: `fk_confirm_${data.flowId}`, from: { id: sender.id + 1 }, message: { chat: { id: sender.id + 1, type: "private" } } } });
    assert.equal((await (await call("status", { flowId: data.flowId }, cookie)).json()).status, "awaiting");
    await bot({ callback_query: { id: "confirmed", data: `fk_confirm_${data.flowId}`, from: sender, message: { chat } } });
    const responses = await Promise.all([call("complete", { flowId: data.flowId }, cookie), call("complete", { flowId: data.flowId }, cookie)]);
    assert.equal(responses.filter(r => r.status === 200).length, 1);
    const complete = responses.find(r => r.status === 200)!;
    assert.deepEqual(await complete.json(), { success: true, url: "/onboarding" });
    const sessionCookie = complete.headers.getSetCookie().find(s => s.includes("better-auth.session_token="))!.split(";")[0];
    const session = await auth.api.getSession({ headers: new Headers({ cookie: sessionCookie }) });
    assert(session);
    users.push(session.user.id);
    assert.equal(session.user.emailVerified, false);
    assert(session.user.email.endsWith("@telegram.flowkey.invalid"));
    if (process.env.FLOWZA_TELEGRAM_HTTP_TEST === "1") {
      const page = await originalFetch(base + "/onboarding", { headers: { cookie: sessionCookie }, redirect: "manual" });
      assert.equal(page.status, 200, "Telegram identity must reach onboarding without falsely verifying an email");
    }
    const repeat = await start();
    const repeatPayload = new URL(repeat.data.url).searchParams.get("start");
    await bot({ message: { chat, from: sender, text: `/start ${repeatPayload}` } });
    await bot({ callback_query: { id: "repeat", data: `fk_confirm_${repeat.data.flowId}`, from: sender, message: { chat } } });
    const repeatComplete = await call("complete", { flowId: repeat.data.flowId }, repeat.cookie);
    assert.equal(repeatComplete.status, 200);
    assert.equal(await db.account.count({ where: { userId: session.user.id, providerId: "telegram", accountId: String(sender.id) } }), 1);
    assert((await call("complete", { flowId: data.flowId }, cookie)).status >= 400);
    const expired = await start();
    await db.verification.update({ where: { id: expired.data.flowId }, data: { expiresAt: new Date(0) } });
    assert.equal((await call("status", { flowId: expired.data.flowId }, expired.cookie)).status, 400);
  } finally {
    globalThis.fetch = originalFetch;
    await db.verification.deleteMany({ where: { id: { in: flowIds } } });
    await db.user.deleteMany({ where: { id: { in: users } } });
    await db.$disconnect();
  }
});

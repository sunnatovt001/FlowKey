import { toNextJsHandler } from "better-auth/next-js";
import { auth } from "@/server/auth-instance";
import { body, limit } from "@/server/http";
import { ApiError } from "@/server/security";
const handlers = toNextJsHandler(auth);
function redact(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(redact);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(
    Object.entries(value)
      .filter(
        ([key]) =>
          ![
            "token",
            "tokenHash",
            "password",
            "accessToken",
            "refreshToken",
            "idToken",
          ].includes(key),
      )
      .map(([key, entry]) => [key, redact(entry)]),
  );
}
async function safeResponse(response: Response) {
  if (response.status >= 300 && response.status < 400) return response;
  if (!response.headers.get("content-type")?.includes("application/json"))
    return response;
  const headers = new Headers(response.headers);
  headers.delete("content-length");
  headers.set("Cache-Control", "no-store");
  const text = await response.text();
  return new Response(text ? JSON.stringify(redact(JSON.parse(text))) : null, {
    status: response.status,
    headers,
  });
}
export async function GET(req: Request) {
  return safeResponse(await handlers.GET(req));
}
export async function POST(req: Request) {
  if (
    [
      "email-otp/send-verification-otp",
      "email-otp/verify-email",
      "email-otp/check-verification-otp",
      "email-otp/request-password-reset",
      "email-otp/reset-password",
      "sign-in/email-otp",
      "forget-password/email-otp",
      "sign-in/email",
      "sign-up/email",
      "request-password-reset",
      "send-verification-email",
    ].some((path) => new URL(req.url).pathname.endsWith(`/${path}`))
  ) {
    try {
      const input = (await body(req.clone())) as { email?: unknown };
      if (typeof input?.email === "string" && input.email.trim().toLowerCase().endsWith("@telegram.flowkey.invalid"))
        throw new ApiError(400, "Bu hisobga Telegram orqali kiring.");
      if (typeof input?.email === "string")
        await limit(
          `auth-account:${input.email.trim().toLowerCase().slice(0, 254)}`,
          10,
        );
    } catch (error) {
      if (error instanceof ApiError)
        return Response.json(
          { message: error.message },
          { status: error.status, headers: { "Retry-After": "60" } },
        );
      console.error(
        JSON.stringify({
          event: "auth.request_failed",
          type: error instanceof Error ? error.name : "unknown",
        }),
      );
      return Response.json(
        { message: "Kirish xizmati vaqtincha ishlamayapti." },
        { status: 503 },
      );
    }
  }
  return safeResponse(await handlers.POST(req));
}

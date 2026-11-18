import { toNextJsHandler } from "better-auth/next-js";
import { auth } from "@/server/auth-instance";
import { body, limit, sameOrigin } from "@/server/http";
import { z } from "zod";
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
      "sign-in/email",
      "sign-up/email",
      "request-password-reset",
      "send-verification-email",
    ].some((path) => new URL(req.url).pathname.endsWith(`/${path}`))
  ) {
    try {
      // Reject foreign-origin and malformed requests before they consume an
      // account's allowance or reach the password/email provider.
      sameOrigin(req);
      const parsed = z
        .object({ email: z.email().max(254) })
        .safeParse(await body(req.clone()));
      if (!parsed.success)
        throw new ApiError(400, "Email manzilini to‘g‘ri kiriting.");
      const email = parsed.data.email.toLowerCase();
      if (email.endsWith("@telegram.flowkey.invalid"))
        throw new ApiError(400, "Bu hisobga Telegram orqali kiring.");
      await limit(`auth-account:${email}`, 10);
      const path = new URL(req.url).pathname;
      if (
        path.endsWith("/request-password-reset") ||
        path.endsWith("/send-verification-email")
      )
        await limit(`auth-mail:${path.split("/").pop()}:${email}`, 3);
    } catch (error) {
      if (error instanceof ApiError)
        return Response.json(
          { message: error.message },
          {
            status: error.status,
            headers: {
              "Cache-Control": "no-store",
              ...(error.status === 429 ? { "Retry-After": "60" } : {}),
            },
          },
        );
      console.error(
        JSON.stringify({
          event: "auth.request_failed",
          type: error instanceof Error ? error.name : "unknown",
        }),
      );
      return Response.json(
        { message: "Kirish xizmati vaqtincha ishlamayapti." },
        { status: 503, headers: { "Cache-Control": "no-store" } },
      );
    }
  }
  return safeResponse(await handlers.POST(req));
}

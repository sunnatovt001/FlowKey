import { NextRequest, NextResponse } from "next/server";
export function proxy(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const miniapp = request.nextUrl.pathname === "/miniapp";
  const embeddable = /^\/(pay|checkout)\/[a-f0-9]{64}$/.test(
    request.nextUrl.pathname,
  );
  const googleAuthPage = ["/login", "/signup"].includes(request.nextUrl.pathname);
  const googleStyles = googleAuthPage ? " https://accounts.google.com/gsi/style" : "";
  const googleConnections = googleAuthPage ? " https://accounts.google.com https://oauth2.googleapis.com" : "";
  const googleFrames = googleAuthPage ? "; frame-src https://accounts.google.com" : "";
  const policy = `default-src 'self'; script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${process.env.NODE_ENV === "development" ? " 'unsafe-eval'" : ""}; style-src 'self' 'unsafe-inline'${googleStyles}; img-src 'self' data:; font-src 'self'; connect-src 'self'${googleConnections}${googleFrames}; frame-ancestors ${miniapp ? "https://web.telegram.org https://webk.telegram.org https://webz.telegram.org" : embeddable ? "*" : "'none'"}; base-uri 'self'; form-action 'self'; object-src 'none'`;
  const headers = new Headers(request.headers);
  headers.set("x-nonce", nonce);
  headers.set("Content-Security-Policy", policy);
  const response = NextResponse.next({ request: { headers } });
  response.headers.set("Content-Security-Policy", policy);
  response.headers.set("X-Request-ID", crypto.randomUUID());
  if (
    /^\/(miniapp|dashboard|transactions|developers|testing|finance|subscriptions|team|activity|invitations|settings|onboarding|login|signup|forgot-password|reset-password|verify-email|telegram-login|api)/.test(
      request.nextUrl.pathname,
    )
  )
    response.headers.set("Cache-Control", "no-store");
  return response;
}
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.svg).*)"],
};

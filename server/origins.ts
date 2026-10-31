/** Development accepts only the two loopback aliases at the configured port. */
export function authTrustedOrigins(
  baseURL: string,
  development: boolean,
): string[] {
  const base = new URL(baseURL);
  const origins = [base.origin];
  if (development && ["localhost", "127.0.0.1"].includes(base.hostname)) {
    const alternate = new URL(base);
    alternate.hostname =
      base.hostname === "localhost" ? "127.0.0.1" : "localhost";
    origins.push(alternate.origin);
  }
  return origins;
}
export function matchesAppOrigin(
  origin: string | null,
  requestURL: string,
  configuredURL: string | undefined,
  development: boolean,
  requestHost?: string | null,
) {
  if (!origin) return false;
  const expected = new URL(configuredURL || requestURL).origin;
  if (origin === expected) return true;
  if (!development) return false;
  const allowed = authTrustedOrigins(expected, true);
  const request = new URL(requestURL);
  if (!allowed.includes(origin) || !allowed.includes(request.origin))
    return false;
  // Next.js can build req.url using its listening hostname (localhost), even
  // when the browser requested 127.0.0.1. Host retains that request authority.
  // Do not trust forwarded hosts or permit other hosts/ports.
  return (requestHost ?? request.host).toLowerCase() === new URL(origin).host;
}

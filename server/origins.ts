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
) {
  if (!origin) return false;
  const expected = new URL(configuredURL || requestURL).origin;
  if (origin === expected) return true;
  // Loopback alias support must still be same-origin to the actual request.
  return (
    development &&
    origin === new URL(requestURL).origin &&
    authTrustedOrigins(expected, true).includes(origin)
  );
}

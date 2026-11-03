import { createHmac, timingSafeEqual } from "node:crypto";
export const ADMIN_SESSION_SECONDS = 15 * 60;
function signature(payload: string, key: string, credentialHash: string) {
  return createHmac("sha256", key)
    .update(credentialHash + ":" + payload)
    .digest("base64url");
}
export function issueAdminToken(
  userId: string,
  sessionId: string,
  key: string,
  credentialHash: string,
  now = Date.now(),
) {
  const payload = Buffer.from(
    JSON.stringify({
      userId,
      sessionId,
      expires: now + ADMIN_SESSION_SECONDS * 1000,
    }),
  ).toString("base64url");
  return payload + "." + signature(payload, key, credentialHash);
}
export function validAdminToken(
  token: string,
  userId: string,
  sessionId: string,
  key: string,
  credentialHash: string,
  now = Date.now(),
) {
  if (!key || !credentialHash || token.length > 2048) return false;
  try {
    const [payload, sig, ...extra] = token.split(".");
    if (extra.length || !payload || !sig) return false;
    const expected = Buffer.from(signature(payload, key, credentialHash)),
      actual = Buffer.from(sig);
    if (expected.length !== actual.length || !timingSafeEqual(expected, actual))
      return false;
    const data = JSON.parse(Buffer.from(payload, "base64url").toString());
    return (
      data.userId === userId &&
      data.sessionId === sessionId &&
      Number.isFinite(data.expires) &&
      data.expires > now &&
      data.expires <= now + ADMIN_SESSION_SECONDS * 1000
    );
  } catch {
    return false;
  }
}

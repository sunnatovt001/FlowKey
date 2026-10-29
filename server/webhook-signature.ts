import { createHmac, timingSafeEqual } from "node:crypto";
export function signWebhook(
  rawBody: string,
  secret: string,
  timestamp = Math.floor(Date.now() / 1000),
) {
  const digest = createHmac("sha256", secret)
    .update(`${timestamp}.${rawBody}`)
    .digest("hex");
  return `t=${timestamp},v1=${digest}`;
}
export function verifyWebhook(
  rawBody: string,
  signature: string,
  secret: string,
  now = Math.floor(Date.now() / 1000),
) {
  const match = /^t=(\d+),v1=([a-f0-9]{64})$/.exec(signature);
  if (!match || Math.abs(now - Number(match[1])) > 300) return false;
  const expected = signWebhook(rawBody, secret, Number(match[1])).split(
    "v1=",
  )[1];
  return timingSafeEqual(
    Buffer.from(expected, "hex"),
    Buffer.from(match[2], "hex"),
  );
}

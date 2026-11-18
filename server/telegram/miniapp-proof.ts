import { createHmac, timingSafeEqual } from "node:crypto";

/** Validate Telegram's signed envelope, never initDataUnsafe or a client user ID. */
export function verifyMiniAppData(raw: string, token: string, now = Date.now()) {
  if (!token || !raw || Buffer.byteLength(raw) > 8192) throw new Error("invalid_init_data");
  const params = new URLSearchParams(raw);
  const keys = [...params.keys()];
  if (new Set(keys).size !== keys.length) throw new Error("duplicate_fields");
  const hash = params.get("hash") || "";
  if (!/^[a-f0-9]{64}$/.test(hash)) throw new Error("invalid_hash");
  const timestamp = Number(params.get("auth_date"));
  const age = Math.floor(now / 1000) - timestamp;
  if (!Number.isSafeInteger(timestamp) || age < -30 || age > 3600) throw new Error("expired_init_data");
  params.delete("hash");
  const check = [...params.entries()].sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0).map(([k, v]) => `${k}=${v}`).join("\n");
  const secret = createHmac("sha256", "WebAppData").update(token).digest();
  const expected = createHmac("sha256", secret).update(check).digest();
  if (!timingSafeEqual(expected, Buffer.from(hash, "hex"))) throw new Error("invalid_signature");
  const user = JSON.parse(params.get("user") || "null") as { id?: number; is_bot?: boolean } | null;
  if (!user || !Number.isSafeInteger(user.id) || user.id! <= 0 || user.is_bot) throw new Error("invalid_user");
  return String(user.id);
}

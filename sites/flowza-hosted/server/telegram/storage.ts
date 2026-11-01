// Keep Telegram Unicode intact even on existing local PostgreSQL databases
// initialized with a legacy Windows encoding. Decode only at the app boundary.
export function packText(value: string) {
  return "utf8-v1:" + Buffer.from(value, "utf8").toString("base64");
}
export function unpackText(value: string) {
  return value.startsWith("utf8-v1:")
    ? Buffer.from(value.slice(8), "base64").toString("utf8")
    : value;
}
export function packSnapshot(value: unknown) {
  return {
    encoding: "utf8-base64-v1",
    data: Buffer.from(JSON.stringify(value), "utf8").toString("base64"),
  };
}
export function unpackSnapshot(value: unknown): Record<string, unknown> {
  if (
    value &&
    typeof value === "object" &&
    "encoding" in value &&
    value.encoding === "utf8-base64-v1" &&
    "data" in value &&
    typeof value.data === "string"
  )
    return JSON.parse(Buffer.from(value.data, "base64").toString("utf8"));
  return value as Record<string, unknown>;
}

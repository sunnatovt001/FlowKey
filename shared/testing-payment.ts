export type TestOutcome = "successful" | "failed" | "pending";
export type TestPaymentReply = {
  id: string;
  amount_minor: number;
  currency: "UZS";
  status: TestOutcome;
  project_id: string;
  livemode: false;
  created_at: string;
};
export function testAmount(value: string) {
  const clean = value.replace(/\s/g, "").replace(",", ".");
  if (!/^\d+(\.\d{1,2})?$/.test(clean)) return null;
  const [whole, fraction = ""] = clean.split(".");
  const minor = Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
  return Number.isSafeInteger(minor) && minor >= 1 && minor <= 1000000000
    ? minor
    : null;
}
export function testPaymentReply(
  value: unknown,
  projectId: string,
  amount: number,
): value is TestPaymentReply {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.id === "string" &&
    v.id.length > 0 &&
    v.project_id === projectId &&
    v.amount_minor === amount &&
    v.currency === "UZS" &&
    v.livemode === false &&
    typeof v.status === "string" &&
    ["successful", "failed", "pending"].includes(v.status) &&
    typeof v.created_at === "string" &&
    Number.isFinite(Date.parse(v.created_at))
  );
}

import { ApiError } from "./security";

export const feeFor = (amount: bigint) => (amount * 3n) / 100n;
export function refundSplit(gross: bigint, already: bigint, amount: bigint) {
  if (amount <= 0n || already + amount > gross)
    throw new ApiError(409, "Qaytarish summasi to‘lov qoldig‘idan oshadi.");
  const fee = feeFor(already + amount) - feeFor(already);
  return { fee, merchant: amount - fee };
}
export function nextBilling(date: Date, interval: string) {
  const result = new Date(date);
  const day = result.getUTCDate();
  result.setUTCDate(1);
  if (interval === "monthly") result.setUTCMonth(result.getUTCMonth() + 1);
  else if (interval === "yearly")
    result.setUTCFullYear(result.getUTCFullYear() + 1);
  else throw new ApiError(400, "Obuna davri noto‘g‘ri.");
  const end = new Date(
    Date.UTC(result.getUTCFullYear(), result.getUTCMonth() + 1, 0),
  ).getUTCDate();
  result.setUTCDate(Math.min(day, end));
  return result;
}

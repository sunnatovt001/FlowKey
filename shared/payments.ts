export type PaymentFilters = {
  q: string;
  status: string;
  from: string;
  to: string;
};
export function paymentDate(value: unknown) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value))
    return "";
  const time = Date.parse(value + "T00:00:00Z");
  return Number(value.slice(0, 4)) > 0 &&
    Number.isFinite(time) &&
    new Date(time).toISOString().slice(0, 10) === value
    ? value
    : "";
}
export function paymentFilters(
  search: Record<string, unknown>,
): PaymentFilters {
  return {
    q: typeof search.q === "string" ? search.q.trim().slice(0, 100) : "",
    status:
      typeof search.status === "string" &&
      ["successful", "pending", "failed"].includes(search.status)
        ? search.status
        : "",
    from: paymentDate(search.from),
    to: paymentDate(search.to),
  };
}
export function paymentFilterKey(value: PaymentFilters) {
  return JSON.stringify([value.q.trim(), value.status, value.from, value.to]);
}
export function paymentRangeError(filters: PaymentFilters) {
  return filters.from && filters.to && filters.from > filters.to
    ? "Boshlanish sanasi tugash sanasidan keyin bo‘lmasin."
    : "";
}
export function paymentPeriod(days: number, today: string) {
  return {
    from: new Date(Date.parse(today + "T00:00:00Z") - (days - 1) * 86400000)
      .toISOString()
      .slice(0, 10),
    to: today,
  };
}
export function paymentHref(
  project: string,
  filters: PaymentFilters,
  page = 1,
) {
  const params = new URLSearchParams({ project });
  for (const [k, v] of Object.entries(filters))
    if (v.trim()) params.set(k, v.trim());
  if (page > 1) params.set("page", String(page));
  return "/transactions?" + params;
}

export function paymentToday(now = new Date()) {
  return new Date(now.getTime() + 5 * 3600000).toISOString().slice(0, 10);
}

export function paymentDateLabel(value: string) {
  const date = new Date(new Date(value).getTime() + 5 * 3600000);
  const month = [
    "yan",
    "fev",
    "mar",
    "apr",
    "may",
    "iyn",
    "iyl",
    "avg",
    "sen",
    "okt",
    "noy",
    "dek",
  ][date.getUTCMonth()];
  return `${date.getUTCDate()} ${month} ${date.getUTCFullYear()}`;
}
export function paymentTimeLabel(value: string) {
  return new Date(new Date(value).getTime() + 5 * 3600000)
    .toISOString()
    .slice(11, 16);
}

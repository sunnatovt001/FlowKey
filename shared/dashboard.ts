export function dashboardPeriod(value: unknown, now = new Date()) {
  const days = value === "30" ? 30 : value === "90" ? 90 : 7;
  const today = new Date(now.getTime() + 5 * 3600000)
    .toISOString()
    .slice(0, 10);
  const end = new Date(
    new Date(`${today}T00:00:00+05:00`).getTime() + 86400000,
  );
  const start = new Date(end.getTime() - days * 86400000);
  const dates = Array.from({ length: days }, (_, i) =>
    new Date(start.getTime() + i * 86400000 + 5 * 3600000)
      .toISOString()
      .slice(0, 10),
  );
  return { days, start, end, dates };
}
export function dashboardVolumeLabel(minor: bigint) {
  if (minor >= 100000n)
    return new Intl.NumberFormat("uz-UZ", {
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(minor / 100n);
  const fraction = minor % 100n;
  return (
    new Intl.NumberFormat("uz-UZ").format(minor / 100n) +
    (fraction ? "." + String(fraction).padStart(2, "0") : "")
  );
}

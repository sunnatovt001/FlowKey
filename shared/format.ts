// Explicit formats keep Uzbek UI consistent on Workers with limited ICU data.
export function formatMinor(minor: number) {
 const [whole, fraction] = (minor / 100).toFixed(2).split(".");
 const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
 return grouped + (fraction === "00" ? "" : "," + fraction.replace(/0$/, ""));
}
const tashkentOffset = 5 * 60 * 60 * 1000;
export function tashkentDayKey(date: Date) {
 return new Date(date.getTime() + tashkentOffset).toISOString().slice(0, 10);
}
export function tashkentWeekday(date: Date) {
 return ["Yak", "Dush", "Sesh", "Chor", "Pay", "Jum", "Shan"][new Date(date.getTime() + tashkentOffset).getUTCDay()];
}

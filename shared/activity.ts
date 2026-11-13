export const activityCategories = [
  { id: "all", label: "Barchasi" },
  { id: "payment", label: "To‘lovlar" },
  { id: "project", label: "Loyiha" },
  { id: "integration", label: "Integratsiya" },
  { id: "finance", label: "Mablag‘lar" },
  { id: "team", label: "Jamoa" },
  { id: "subscription", label: "Obunalar" },
  { id: "other", label: "Boshqa" },
] as const;
export const activityActions: Record<string, string> = {
  "project.created": "Loyiha yaratildi",
  "project.updated": "Loyiha yangilandi",
  "project.archived": "Loyiha arxivlandi",
  "key.created": "API kaliti yaratildi",
  "key.revoked": "API kaliti bekor qilindi",
  "webhook.created": "Webhook ulandi",
  "webhook.updated": "Webhook yangilandi",
  "webhook.deleted": "Webhook o‘chirildi",
  "webhook.secret_rotated": "Webhook kaliti yangilandi",
  "payment.created": "Sinov to‘lovi yaratildi",
  "sandbox.refund.created": "Sinov to‘lovi qaytarildi",
  "sandbox.payout.requested": "Pul chiqarish so‘raldi",
  "sandbox.payout.approved": "Ariza tasdiqlandi",
  "sandbox.payout.completed": "Sinov pul chiqarishi bajarildi",
  "sandbox.payout.failed": "Sinov pul chiqarishi bajarilmadi",
  "sandbox.payout.rejected": "Ariza rad etildi",
  "team.invited": "Jamoaga taklif yuborildi",
  "team.accepted": "Taklif qabul qilindi",
  "team.declined": "Taklif rad etildi",
  "team.removed": "A’zolik bekor qilindi",
  "team.invite_revoked": "Taklif bekor qilindi",
  "sandbox.subscription.created": "Sinov obunasi yaratildi",
  "sandbox.subscription.billed": "Obuna davri sinovdan o‘tdi",
  "sandbox.subscription.cancelled": "Obuna bekor qilindi",
};
export function activityCategory(action: string) {
  if (action.startsWith("payment.")) return "payment";
  if (action.startsWith("project.")) return "project";
  if (action.startsWith("key.") || action.startsWith("webhook."))
    return "integration";
  if (action.startsWith("sandbox.subscription.")) return "subscription";
  if (action.startsWith("sandbox.")) return "finance";
  if (action.startsWith("team.")) return "team";
  return "other";
}
export function activitySearch(value: string) {
  return value
    .toLocaleLowerCase("uz")
    .replace(/[‘’ʻʼ`]/g, "'")
    .trim();
}

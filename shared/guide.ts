export const guideCategories = [
  { id: "start", label: "Boshlash" },
  { id: "api", label: "API" },
  { id: "webhook", label: "Webhook" },
  { id: "errors", label: "Xatolar" },
] as const;
export type GuideCategory = (typeof guideCategories)[number]["id"];
export const guideTopics = [
  {
    id: "api-keys",
    title: "API kalitlari",
    description: "Kalit yaratish va xavfsiz saqlash.",
    category: "api",
    featured: true,
    keywords: "key token maxfiy secret yaratish bekor revoke",
  },
  {
    id: "hosted-checkout",
    title: "To‘lov havolasi",
    description: "Tayyor sahifani ulash.",
    category: "start",
    featured: true,
    keywords: "checkout pay link url sahifa html",
  },
  {
    id: "script-button",
    title: "Script va tugma",
    description: "Saytingizga joylashtirish.",
    category: "start",
    featured: true,
    keywords: "button js javascript html embed kod script",
  },
  {
    id: "webhooks",
    title: "Webhooklar",
    description: "Hodisalarni qabul qilish.",
    category: "webhook",
    featured: true,
    keywords: "vebhuk hodisa imzo signature hmac retry qayta yuborish endpoint",
  },
  {
    id: "payment-status",
    title: "To‘lov holatlari",
    description: "Natijalarni tushunish.",
    category: "start",
    featured: true,
    keywords:
      "status successful pending failed muvaffaqiyatli muvaffaqiyatsiz kutilmoqda natija",
  },
  {
    id: "error-handling",
    title: "Xatolar yechimi",
    description: "Muammoni aniqlash.",
    category: "errors",
    featured: true,
    keywords:
      "400 401 403 404 409 413 429 500 503 error xato limit muammo ishlamayapti",
  },
  {
    id: "introduction",
    title: "API manzili",
    description: "Asosiy manzil va ma’lumot formati.",
    category: "api",
    featured: false,
    keywords: "base url json uzs valyuta tiyin som so'm summa",
  },
  {
    id: "authentication",
    title: "Autentifikatsiya",
    description: "So‘rovga kirish ruxsatini qo‘shish.",
    category: "api",
    featured: false,
    keywords: "authorization bearer header auth avtorizatsiya kirish cookie",
  },
  {
    id: "create-payment",
    title: "To‘lov yaratish",
    description: "Serverdan API so‘rovi yuborish.",
    category: "api",
    featured: false,
    keywords:
      "post curl amount_minor currency idempotency-key idempotency takror summa",
  },
  {
    id: "retrieve-payment",
    title: "To‘lovni olish",
    description: "Saqlangan tranzaksiyani topish.",
    category: "api",
    featured: false,
    keywords: "get payment id tranzaksiya qidirish olish",
  },
  {
    id: "quick-start",
    title: "Tezkor boshlash",
    description: "Birinchi API so‘rovigacha qadamlar.",
    category: "start",
    featured: false,
    keywords: "loyiha project hisob boshlash birinchi tezkor curl",
  },
] as const;
export function normalizeGuideText(text: string) {
  return text
    .normalize("NFKC")
    .toLocaleLowerCase("uz")
    .replace(/[‘’ʻ'`]/g, "")
    .trim();
}
export function searchGuide(query: string, category: GuideCategory = "start") {
  const tokens = normalizeGuideText(query)
    .slice(0, 120)
    .split(/\s+/)
    .filter(Boolean);
  return guideTopics.filter((topic) =>
    tokens.length
      ? tokens.every((token) =>
          normalizeGuideText(
            `${topic.title} ${topic.description} ${topic.keywords}`,
          ).includes(token),
        )
      : category === "start"
        ? topic.featured
        : topic.category === category,
  );
}

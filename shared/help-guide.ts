export type HelpAnswer = { text: string; href: string; label: string };
export const helpSuggestions = [
  "Loyiha qanday yarataman?",
  "API kalitni qayerdan olaman?",
  "To‘lov ishlamayapti",
];
export function helpGuide(question: string): HelpAnswer {
  const text = question.toLocaleLowerCase("uz");
  if (/parol|password|kirish|email|pochta/.test(text))
    return { text: "Parolni tiklash uchun kirish sahifasida «Parolni unutdingizmi?»ni bosing va hisob emailingizni kiriting. Kelgan xatdagi havolani oching. Spam papkasini ham tekshiring.", href: "/login?mode=reset", label: "Kirish sahifasi" };
  if (/telegram|\bbot\b|admin/.test(text))
    return { text: "Hisob sozlamalarida «Telegram yordamchi» bo‘limini oching. «Telegramni ulash» orqali hisobingizni bog‘lang. AI va adminga yetkazish ishlashi uchun xizmat serverda sozlangan bo‘lishi kerak.", href: "/settings", label: "Hisob sozlamalari" };
  if (/api|kalit|token|key/.test(text))
    return { text: "«Ulash» bo‘limida «API kaliti» yoki «Token»ni tanlang. Yangi kalit yarating va uni xavfsiz saqlang — maxfiy qiymat faqat bir marta ko‘rsatiladi. Kalitni brauzer kodiga yoki chatga yozmang.", href: "/developers", label: "Ulash bo‘limi" };
  if (/loyiha|project/.test(text))
    return { text: "Tepadagi loyiha ro‘yxatidan «+ Yangi loyiha»ni tanlang. Loyiha nomi va kerak bo‘lsa sayt havolasini kiriting. Birinchi API kalitingiz loyiha bilan birga yaratiladi.", href: "/settings#create-project", label: "Loyiha yaratish" };
  if (/webhook/.test(text))
    return { text: "«Ulash» → «Webhooklar»da HTTPS manzilingizni kiriting. Endpoint to‘lov hodisasini qabul qilib, 2xx javob qaytarishi kerak. Yetkazilish xatosi bo‘lsa, urinishlar tarixini tekshiring.", href: "/developers?tab=webhooks", label: "Webhooklar" };
  if (/script|tugma|button|havola|ulash|integrats/.test(text))
    return { text: "«Ulash»da API kaliti, token, havola, script yoki tugmadan birini tanlang. Tayyor sahifa uchun «Havola», saytingizga joylash uchun «Script» yoki «Tugma» qulay. GPT va Claude uchun tayyor promptlar ham shu yerda.", href: "/developers", label: "Ulash usullari" };
  if (/refund|qaytar|moliya|balans|obuna/.test(text))
    return { text: "«Moliya»da sinov balansi, qaytarishlar va pul chiqarish arizalarini ko‘ring. Obunalar alohida «Obunalar» bo‘limida. Bu amallar hozir sinov tariqasida bajariladi, haqiqiy pul o‘tkazilmaydi.", href: "/finance", label: "Moliya" };
  if (/to[‘’ʻ'`]?lov|payment|xato|ishlama|failed|tranzaksiya/.test(text))
    return { text: "«Tranzaksiyalar»da to‘lov holatini tekshiring. Unit’da «Muvaffaqiyatsiz» natija ataylab tanlangan bo‘lishi mumkin. API so‘rovida faol kalit, butun kichik birlikdagi summa, UZS va yangi Idempotency-Key ishlating. Aniq hisob diagnostikasi uchun «Hisob sozlamalari»dagi «Hisobni tekshirish»dan foydalaning.", href: "/transactions", label: "Tranzaksiyalar" };
  if (/unit|sandbox|haqiqiy|pul/.test(text))
    return { text: "FlowKey hozir Unit sinov muhitida ishlaydi. To‘lov va moliya amallari simulyatsiya qilinadi. Haqiqiy pul, karta raqami yoki bank ma’lumotlari kerak emas.", href: "/docs", label: "Qo‘llanma" };
  return { text: "Hozir tayyor qo‘llanma javoblarini ko‘rsatyapman. Loyiha, API kaliti, to‘lov, webhook yoki parolni tiklash haqida so‘rang. Erkin AI suhbati xizmat ulangandan keyin ishlaydi.", href: "/docs", label: "Qo‘llanmani ochish" };
}

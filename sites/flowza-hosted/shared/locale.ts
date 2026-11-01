export function statusLabel(status: string): string {
  return (
    (
      {
        successful: "Muvaffaqiyatli",
        failed: "Muvaffaqiyatsiz",
        pending: "Kutilmoqda",
        queued: "Navbatda",
        sending: "Yuborilmoqda",
        delivered: "Yetkazildi",
        open: "Ochiq",
        expired: "Muddati tugagan",
        disabled: "O‘chirilgan",
        active: "Faol",
        revoked: "Bekor qilingan",
      } as Record<string, string>
    )[status] || status
  );
}
export function businessLabel(type: string): string {
  return (
    (
      {
        Company: "Kompaniya",
        Individual: "Jismoniy shaxs",
        "Individual developer": "Mustaqil dasturchi",
        "SaaS company": "SaaS kompaniyasi",
        Startup: "Startap",
        "Online platform": "Onlayn platforma",
        Other: "Boshqa",
        Uzbekistan: "O‘zbekiston",
      } as Record<string, string>
    )[type] || type
  );
}
export function authError(code: unknown): string {
  return (
    (
      {
        INVALID_EMAIL_OR_PASSWORD: "Elektron pochta yoki parol noto‘g‘ri.",
        EMAIL_NOT_VERIFIED: "Avval elektron pochtangizni tasdiqlang.",
        USER_ALREADY_EXISTS: "Bu elektron pochta bilan hisob mavjud.",
        USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL:
          "Bu elektron pochta bilan hisob mavjud. Boshqa manzil kiriting yoki hisobga kiring.",
        INVALID_PASSWORD: "Joriy parol noto‘g‘ri.",
        PASSWORD_TOO_SHORT: "Parol kamida 12 ta belgidan iborat bo‘lsin.",
        PASSWORD_TOO_LONG: "Parol 128 ta belgidan oshmasin.",
        INVALID_TOKEN:
          "Havola noto‘g‘ri yoki muddati tugagan. Yangi havola so‘rang.",
        TOKEN_EXPIRED: "Havolaning muddati tugagan. Yangi havola so‘rang.",
        TOO_MANY_REQUESTS:
          "Urinishlar ko‘payib ketdi. Biroz kutib qayta urinib ko‘ring.",
        INVALID_EMAIL: "Elektron pochta manzilini tekshiring.",
      } as Record<string, string>
    )[String(code)] ||
    "Amalni bajarib bo‘lmadi. Ma’lumotlarni tekshiring yoki birozdan keyin qayta urinib ko‘ring."
  );
}

// Stable Uzbek numeric date format across server and browser locale data.
export function tashkentDate(value: string, withTime = true): string {
  const shifted = new Date(
    new Date(value).getTime() + 5 * 3600000,
  ).toISOString();
  const date = `${shifted.slice(8, 10)}.${shifted.slice(5, 7)}.${shifted.slice(0, 4)}`;
  return withTime ? `${date}, ${shifted.slice(11, 19)}` : date;
}

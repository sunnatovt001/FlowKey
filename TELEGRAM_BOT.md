# Telegram AI yordamchi — faqat local

Bu o‘zgarish root Next.js/PostgreSQL ilovasiga qo‘shildi. `sites/flowza-hosted` va e’lon qilingan sayt o‘zgartirilmagan. Bot sayt va mahalliy baza ishlayotgan kompyuterda alohida process sifatida ishlaydi. Tokenlarsiz haqiqiy Telegram/AI bilan aloqa qilinmaydi.

## 1. Bot va AI sozlamalari

Telegram’da rasmiy `@BotFather` bilan `/newbot` orqali bot yarating. Tokenni faqat local `.env` fayliga kiriting; chatga, Git’ga yoki frontend kodiga joylamang:

```dotenv
TELEGRAM_BOT_TOKEN="BotFather bergan token"
TELEGRAM_BOT_USERNAME="bot_username_bot"
TELEGRAM_ADMIN_CHAT_ID=""
SUPPORT_AI_API_KEY="OpenAI API kaliti"
SUPPORT_AI_MODEL="gpt-4.1-mini"
```

`TELEGRAM_BOT_USERNAME` — `@` belgisiz bot nomi. Modelni API hisobingizda mavjud bo‘lgan modelga o‘zgartirish mumkin. Oddiy ChatGPT obunasi o‘rniga OpenAI API uchun alohida API kaliti kerak; AI so‘rovlari API hisobingizdan sarflanadi. AI sozlanmasa bot buni ochiq aytadi, `/check` va murojaat saqlash AI’siz ham ishlaydi.

## 2. Mahalliy ishga tushirish

Node va PostgreSQL o‘rnatilgan bo‘lishi kerak. Birinchi terminalda mahalliy bazani ishga tushiring, boshqa terminalda migratsiyalar va klientni tayyorlang:

```powershell
npm run db:local
```

```powershell
npm run db:generate
npm run db:migrate
npm run dev
```

Uchinchi terminalda:

```powershell
npm run bot:telegram
```

Bot Telegram’dan long polling bilan xabar oladi; localhost uchun ochiq HTTPS webhook yoki tunnel talab qilinmaydi. Bir bot tokeniga bir poller ishlating. Bazadagi lease boshqa nusxani to‘xtatadi va offset qayta ishga tushganda saqlanadi. Avvaldan webhook sozlangan bo‘lsa poller tushunarli xato bilan to‘xtaydi; mavjud webhook avtomatik o‘chirilmaydi. Ctrl+C pollerni to‘xtatadi; tarmoq so‘rovi tugashi uchun 35 soniyagacha kutishi mumkin.

## 3. Adminni ulash

Admin botning shaxsiy chatini ochib `/start`, keyin `/id` yuboradi. Javobdagi raqamni `.env` dagi `TELEGRAM_ADMIN_CHAT_ID` ga kiriting va pollerni qayta ishga tushiring. Bot boshlamagan shaxsiy chatga xabar yubora olmaydi.

Admin ulanishi yoki token bo‘lmasa murojaat `queued` holatida bazada qoladi. Sozlash tugab poller ishga tushganda navbat yuboriladi. Telegram muvaffaqiyatli javob bergandagina `sent` yoziladi; xatoda cheklangan qayta urinish va so‘ng `failed` holati qo‘llanadi. Yetkazish kamida bir marta tamoyilida: tarmoq uzilishi va jarayon to‘xtashi chegarasida bir murojaat qayta kelishi mumkin; ID orqali ajrating. `sent` — Telegram API qabul qildi, admin o‘qidi degani emas.

## 4. Foydalanuvchi oqimi

1. Local saytga hisob bilan kiring.
2. **Hisob sozlamalari → Telegram yordamchi → Telegramni ulash**.
3. Bir martalik havolani shaxsiy Telegram’ingizda ochib **Start** bosing. Kod 10 daqiqada tugaydi; yangi kod eskisini bekor qiladi. Uni boshqalarga bermang.
4. Botga savol yozing. U shu hisobdagi mahsulot, loyihalar, tranzaksiyalar, kalitlarning holati (maxfiy qiymati emas), webhook yetkazishlari, checkout muddati va oldingi murojaatlar bilan javob beradi.
5. **Hisobni tekshirish** yoki `/check` — deterministik tekshiruv. Muvaffaqiyatsiz Unit to‘lovi tanlangan sinov natijasi bo‘lishi mumkinligi alohida tushuntiriladi.
6. Muammoni yozgach **Adminga yuborish** yoki `/admin` — oxirgi muammo va tekshiruv ma’lumotlarini murojaatga qo‘shadi. Kabinetdan ham tavsif yozib yuborish mumkin.
7. **Telegramni uzish** yoki `/unlink` — bog‘lanishni, suhbat tarixini va yangi ulash kodlarini bekor qiladi. Oldin yuborilgan support murojaatlari kabinet tarixida saqlanadi.

## 5. Ma’lumotlar va chegaralar

- Har DB so‘rovi hisob egasi bilan cheklangan; Telegram chat ID’si hech qachon boshqa hisobga kirish huquqi bermaydi.
- Faqat shaxsiy chatlar ishlaydi. Guruh va boshqa jo‘natuvchidan kelgan callbacklar hisob ma’lumotlarini ochmaydi.
- AI OpenAI Responses API’dan foydalanadi, `store:false`. Bu providerning barcha xavfsizlik/monitoring saqlash siyosatlarini bekor qilmaydi.
- AI faqat o‘qiydi. Kalit yaratish/o‘chirish, to‘lov yuborish, webhookni qayta jo‘natish, SQL yoki shell bajarish huquqi yo‘q. Murojaat faqat foydalanuvchining tugmasi/buyrug‘i bilan yaratiladi.
- Har javobda hisobning yangi holati olinadi. Boshlang‘ich tanlanma cheklangan; AI eski/aniq yozuvlarni hisobga bog‘langan read-only qidiruv orqali sahifalab topa oladi. Bir savolda ko‘pi bilan ikki qidiruv, so‘ng faktlarga asoslangan javob.
- Parollar, sessiyalar, API kalitlarining maxfiy qiymatlari, webhook signing secret va rasm fayllari AI kontekstiga olinmaydi. Ma’lum kalit/token formatlari foydalanuvchi matnidan ham niqoblanadi. Baribir maxfiy ma’lumot yubormang: ixtiyoriy matndagi barcha turdagi sirlarni avtomatik tanish kafolatlanmaydi.
- OpenAI’ga hisob bo‘yicha tanlangan ma’lumotlar va qisqa suhbat tarixi yuboriladi; admin murojaatida tekshiruv va oxirgi 6 xabar bo‘ladi. Telegram/AI ishlatishdan oldin shu almashuvni hisobga oling.
- Bot tashqi serverlarga ixtiyoriy ulanish qilmaydi va tizim avtomatik tuzatildi deb da’vo qilmaydi. Hisob DB holatini tekshiradi; bazaning o‘zi ishlamasa hisob ma’lumotlarini ololmaydi.
- Hisobdagi so‘rovlar rate limit bilan, AI va Telegram chaqiruvlari timeout bilan cheklangan. Link kodining faqat SHA-256 xeshi saqlanadi.
- Mahalliy eski Windows DB kodlashlarida ham o‘zbekcha/emojili xabarlar yo‘qolmasligi uchun support matnlari UTF-8 transport shaklida saqlanadi. Bu shifrlash emas; DB kirishini oddiy server ma’lumotlaridek himoyalang.

## 6. Tekshirish

```powershell
npm run typecheck
npm test
npm run test:telegram-db
```

Oxirgi buyruq faqat loopback PostgreSQL’da alohida `flowkey_support_test` bazasini yaratadi/migratsiya qiladi va o‘z fixture hisoblarini tozalaydi. Asosiy ma’lumotlar o‘zgartirilmaydi. Testlar bir martalik kod/expiry, parallel qayta ishlatish, boshqa hisob loyihasiga kira olmaslik, ticket idempotency, Unicode, provider payload/redaction, guruh chatlarini rad etish va read-only tool oqimini tekshiradi. Tokenlarsiz haqiqiy Telegram javobi yoki admin yetkazilishi tasdiqlanmaydi.

Rasmiy manbalar: [Telegram Bot API](https://core.telegram.org/bots/api), [OpenAI Responses API](https://developers.openai.com/api/reference/resources/responses/methods/create), [OpenAI function calling](https://developers.openai.com/api/docs/guides/function-calling).

## Admin ID’sini avtomatik ulash

ID’ni qo‘lda ko‘chirmasdan ulash uchun local terminalda `npm run bot:setup-admin` bajaring. Chiqqan bir martalik havolani faqat admin bo‘ladigan o‘z Telegram hisobingizda ochib Start bosing. Havola 10 daqiqada tugaydi va bir marta ishlaydi. `TELEGRAM_ADMIN_CHAT_ID` local `.env` ga avtomatik saqlanadi; poller shu zahoti yangi sozlamadan foydalanadi. Oldindan sozlangan adminni bu havola bilan almashtirib bo‘lmaydi. Yangi havola oldingi hali ishlatilmagan admin havolalarini bekor qiladi. Havola admin murojaatlarini olish huquqini beradi — uni boshqalarga bermang.

## Sayt va Telegram admin boshqaruvi

Saytdagi Admin panel → Telegram sahifasida admin paroli bilan kirgan foydalanuvchi Telegram boshqaruvini 15 daqiqaga yoqadi. So‘ng botga `/panel` yoziladi. Parolni Telegram xabariga yubormang.

Boshqaruv uchta shartni tekshiradi: `TELEGRAM_ADMIN_CHAT_ID` mosligi, shu chatga bog‘langan tasdiqlangan foydalanuvchining `FLOWKEY_ADMIN_USER_IDS` ro‘yxatida borligi va muddati tugamagan web ruxsati. Telegram uzilsa yoki admin paroli o‘zgarsa eski ruxsat ishlamaydi. Oddiy foydalanuvchining `/admin` buyrug‘i yordam murojaati yuborish vazifasida qoladi; sozlangan admin uchun `/admin` ham boshqaruvni ochadi.

Botda murojaatlarni holati bo‘yicha ko‘rish, matnini ochish, tasdiqlab holatini o‘zgartirish, foydalanuvchi/loyiha ro‘yxatini sahifalash mumkin. Moliyaviy operatsiyalar, hisob o‘chirish yoki maxfiy kalitlarni chiqarish yo‘q. Sayt va bot bir xil status xizmatidan foydalanadi; auditda `source: telegram` yoziladi. Eski tugma yoki takroriy yangilanish boshqa holat ustidan yozmaydi.

Admin chatning alohida buyruqlar menyusi: `node --env-file=.env --import tsx scripts/configure-telegram-admin-menu.ts`. Bu boshqa foydalanuvchilar bot menyusini o‘zgartirmaydi.


## FlowKey Business Mini App

Open https://flowkey.uz/miniapp or the support bot menu button “FlowKey Business”. For Telegram access, first link your existing verified account in website Settings → Telegram. The support-bot token verifies Mini App initData; the separate login-bot token is not used. No implicit account merge by email, username or submitted user ID. Browser access reuses existing verified sessions.

Four in-page destinations: Asosiy (7/30/90-day simulated volume and counts), To‘lovlar (last 50, local search/status filters and detail dialog), Loyihalar (authorized projects), Profil (own ticket summaries and existing account/help links). Website configuration pages open through links. No card credentials or real-money actions are collected.

To configure the support bot menu after deployment: `node --env-file=.env --import tsx scripts/configure-telegram-miniapp.ts`. This updates only the menu button; it does not change the webhook or send messages. Mini App HTML is no-store and allows only Telegram web frame origins. initData HMAC, duplicate fields, future timestamps and one-hour expiry are checked on the server; each requested project is reauthorized.


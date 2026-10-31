import Link from "@/components/site-link";
import { ArrowRight, BookOpen } from "lucide-react";
import { PublicNav } from "@/components/ui";
import { Code } from "@/components/copy";
export const metadata = { title: "Qo‘llanma" };
const sections = [
  ["introduction", "Kirish"],
  ["quick-start", "Tezkor boshlash"],
  ["authentication", "Autentifikatsiya"],
  ["api-keys", "API kalitlari"],
  ["create-payment", "To‘lov yaratish"],
  ["hosted-checkout", "To‘lov sahifasi va HTML tugmalar"],
  ["retrieve-payment", "To‘lovni olish"],
  ["payment-status", "To‘lov holati"],
  ["webhooks", "Webhooklar"],
  ["error-handling", "Xatolarni boshqarish"],
];
export default function Docs() {
  const base = "https://flowza-sandbox.u-t-m-u.chatgpt.site";
  return (
    <>
      <PublicNav />
      <div className="docs-layout">
        <aside className="docs-sidebar">
          <div>
            <BookOpen size={18} />
            <strong>Qo‘llanma</strong>
          </div>
          <nav aria-label="Qo‘llanma bo‘limlari">
            {sections.map(([id, title]) => (
              <a key={id} href={`#${id}`}>
                {title}
              </a>
            ))}
          </nav>
          <Link href="/dashboard">
            Kabinetga o‘tish <ArrowRight size={14} />
          </Link>
        </aside>
        <main className="docs-content">
          <p className="breadcrumb">Qo‘llanma / Sinov API’si</p>
          <section id="introduction">
            <h1>
              Birinchi to‘lovingizga
              <br />
              aniq va sodda yo‘l.
            </h1>
            <p className="lead">
              FlowKey Unit muhitida mahsulotingiz uchun to‘lov jarayonlarini yarating va tekshiring.
            </p>
            <div className="notice">
              Bu API faqat sinov natijalarini yaratadi. Karta, bank ma’lumotlari yoki haqiqiy pul ishlatilmaydi. Haqiqiy to‘lovlar hamkor tasdig‘idan so‘ng kelajakda qo‘shiladi.
            </div>
            <h2>Kirish</h2>
            <p>
              API JSON, Bearer autentifikatsiyasi va butun kichik pul birliklaridan foydalanadi. Faqat UZS qo‘llanadi. 100 kichik birlik = 1 so‘m. Barcha javoblarda <code>livemode: false</code>.
            </p>
            <p>Sinov API’sining asosiy manzili:</p>
            <Code>{`${base}/api/v1`}</Code>
            <p>
              Yuqoridagi manzil ushbu o‘rnatmaning APP_URL qiymatidir. Haqiqiy pul uchun endpoint mavjud emas.
            </p>
          </section>
          <section id="hosted-checkout">
            <h2>Tayyor to‘lov sahifasi va HTML tugmalar</h2>
            <p>Dasturchilar bo‘limida belgilangan summali to‘lov havolasi yarating, HTML tugmasini saytingizga qo‘shing va sahifani e’lon qiling. Tugma tayyor sinov to‘lov sahifasini ochadi. Maxfiy API kalitni HTML yoki brauzer JavaScript kodiga qo‘ymang.</p>
            <p>Har bir buyurtma uchun backendingizdan alohida to‘lov sessiyasi yarating:</p>
            <Code>{`curl -X POST "${base}/api/v1/checkout/sessions" \\\n  -H "Authorization: Bearer $FLOWZA_KEY" \\\n  -H "Idempotency-Key: order-checkout-001" \\\n  -H "Content-Type: application/json" \\\n  -d '{"title":"Kursga kirish","amount_minor":12500000,"currency":"UZS"}'`}</Code>
            <p>Javobda id, url, expires_at va livemode: false keladi. Sessiya ID’sini buyurtma bilan saqlang va xaridorni url manziliga yo‘naltiring. Sessiya 30 daqiqada tugaydi. Bir xil idempotent so‘rov bitta sessiyani qaytaradi; o‘zgargan ma’lumotlar 409 qaytaradi.</p>
            <p>GET /api/v1/checkout/sessions/&#123;id&#125; endpointi o‘sha server kaliti bilan holat va to‘lovni (yoki null) qaytaradi. Sinov buyurtmasini bajarishdan oldin backendda summa, valyuta va successful holatini yoki imzolangan webhookni tekshiring. Brauzerdagi xabar to‘lov tasdig‘i emas. Qayta ishlatiladigan havolalar alohida buyurtma yoki xaridorni aniqlamaydi.</p>
            <p>To‘lov havolalarini Dasturchilar bo‘limida o‘chirishingiz mumkin. Barcha tranzaksiyalar sinov tariqasida; haqiqiy pul ishlatilmaydi.</p>
          </section>
          <section id="quick-start">
            <h2>Tezkor boshlash</h2>
            <ol>
              <li>
                <Link href="/signup">Hisob yarating</Link> va Unit muhitini sozlashni yakunlang.
              </li>
              <li>
                Kabinet ichida loyiha yarating. Birinchi API kaliti avtomatik beriladi. Qo‘shimcha kalitlar Ulash → API kalitlari bo‘limida yaratiladi.
              </li>
              <li>
                To‘liq maxfiy kalitni darhol saqlang. U faqat bir marta ko‘rsatiladi.
              </li>
              <li>
                Serverdagi muhit o‘zgaruvchilarini sozlang va quyidagi so‘rovni yuboring.
              </li>
              <li>Saqlangan natijani Tranzaksiyalar va Umumiy ko‘rinish bo‘limlarida ko‘ring.</li>
            </ol>
            <Code>{`export BASE_URL="${base}"
export FLOWZA_KEY="YOUR_UNIT_API_KEY"

curl -X POST "$BASE_URL/api/v1/payments" \\
  -H "Authorization: Bearer $FLOWZA_KEY" \\
  -H "Content-Type: application/json" \\
  -H "Idempotency-Key: first-payment-001" \\
  -d '{"amount_minor":12500000,"currency":"UZS","result":"successful"}'`}</Code>
          </section>
          <section id="authentication">
            <h2>Autentifikatsiya</h2>
            <p>
              Har bir dasturiy so‘rov Authorization headerida sinov API kalitini talab qiladi. Kalit faqat o‘zi yaratilgan loyihaga kirish beradi. Brauzerda kirish ChatGPT orqali boshqariladi. Sayt ochiq, ammo hisob amallari kirishni va loyiha ruxsatini talab qiladi. Maxfiy kalitni frontend kodiga qo‘ymang.
            </p>
            <Code>{"Authorization: Bearer fz_test_<your-secret>"}</Code>
            <p>
              Bekor qilingan yoki noto‘g‘ri kalit HTTP 401 qaytaradi. Loyiha API so‘rovlari daqiqasiga 120 ta, kabinetdagi o‘zgarishlar foydalanuvchiga daqiqasiga 60 ta bilan cheklangan. Kirish urinishlari elektron pochta uchun daqiqasiga 10 ta bilan cheklangan.
            </p>
          </section>
          <section id="api-keys">
            <h2>API kalitlari</h2>
            <p>
              Kalitlarni yaratish va bekor qilish:{" "}
              <Link href="/developers">Dasturchilar → API kalitlari</Link>. 256 bitli tasodifiy maxfiy kalitning SHA-256 xeshi saqlanadi. Kabinetda faqat niqoblangan boshlanish qismi qoladi. Almashtirish uchun yangi kalit yarating, server sozlamasini yangilang va eski kalitni bekor qiling.
            </p>
            <p>
              Maxfiy kalitlarni loglarga, URL’ga, manba kodiga yoki brauzer paketlariga joylamang.
            </p>
          </section>
          <section id="create-payment">
            <h2>To‘lov yaratish</h2>
            <p>
              <code>POST /api/v1/payments</code>
            </p>
            <p>
              So‘rovda <code>Idempotency-Key</code> headeri majburiy: 8–128 ta harf, raqam, chiziqcha yoki pastki chiziq. Bir xil kalit va ma’lumotlar asl to‘lovni qaytaradi. Ma’lumotlar o‘zgarsa HTTP 409 qaytadi. Kalitlar loyiha doirasida amal qiladi.
            </p>
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>Maydon</th>
                    <th>Turi</th>
                    <th>Qoidalar</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>amount_minor</td>
                    <td>integer</td>
                    <td>1–1 000 000 000 (10 000 000 so‘mgacha)</td>
                  </tr>
                  <tr>
                    <td>currency</td>
                    <td>string</td>
                    <td>UZS</td>
                  </tr>
                  <tr>
                    <td>result</td>
                    <td>string</td>
                    <td>successful, failed yoki pending</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <Code>
              {
                '{\n  "amount_minor": 12500000,\n  "currency": "UZS",\n  "result": "successful"\n}'
              }
            </Code>
            <p>HTTP 200 javobi (ID va vaqt namunaviy):</p>
            <Code>
              {
                '{\n  "id": "cm_example_payment",\n  "amount_minor": 12500000,\n  "currency": "UZS",\n  "status": "successful",\n  "project_id": "cm_example_project",\n  "livemode": false,\n  "created_at": "2026-10-25T12:00:00.000Z"\n}'
              }
            </Code>
          </section>
          <section id="retrieve-payment">
            <h2>To‘lovni olish</h2>
            <p>
              <code>GET /api/v1/payments/:id</code>
            </p>
            <Code>{`curl "$BASE_URL/api/v1/payments/$PAYMENT_ID" \\
  -H "Authorization: Bearer $FLOWZA_KEY"`}</Code>
            <p>
              Xuddi shu shakldagi to‘lov javobini qaytaradi. Mavjud bo‘lmagan yoki boshqa loyihaga tegishli to‘lov HTTP 404 qaytaradi.
            </p>
          </section>
          <section id="payment-status">
            <h2>To‘lov holati</h2>
            <ul>
              <li>
                <strong>successful</strong> — muvaffaqiyatli sinov natijasi.
              </li>
              <li>
                <strong>failed</strong> — muvaffaqiyatsiz sinov natijasi.
              </li>
              <li>
                <strong>pending</strong> — ushbu MVP’da kutilayotgan holatda qoladi; avtomatik hisob-kitob yoki holat almashinuvi yo‘q.
              </li>
            </ul>
            <p>
              Kabinetdagi to‘lov hajmiga faqat muvaffaqiyatli sinov summalari qo‘shiladi. Jami tranzaksiyalarda barcha natijalar hisoblanadi.
            </p>
          </section>
          <section id="webhooks">
            <h2>Webhooklar</h2>
            <p>
              Dasturchilar → Webhooklar bo‘limida ochiq HTTPS endpointingizni ro‘yxatdan o‘tkazing va hodisalarni tanlang: <code>payment.successful</code>,{" "}
              <code>payment.failed</code>, va/yoki <code>payment.pending</code>. Bir marta ko‘rsatiladigan imzolash kalitini saqlang.
            </p>
            <p>
              To‘lovlar tegishli hodisalarni atomik ravishda navbatga qo‘shadi. Yetkazish urinishlari bo‘limida Yuborish tugmasini bosing. Xatodan so‘ng jami uch urinishgacha qo‘lda qayta yuborish mumkin. Ushbu hosted MVP’da avtomatik fon ishchisi yo‘q. Faqat tasdiqlangan HTTP 2xx javobi yetkazildi deb belgilanadi. Javob muddati 5 soniya.
            </p>
            <p>
              Yo‘naltirishlar kuzatilmaydi. IP qiymatlar, localhost, xususiy tarmoq, metadata, rezerv va IPv6 manzillari rad etiladi. DNS har bir urinishda tekshiriladi va hosted Worker faqat ochiq tarmoqqa ulanadi.
            </p>
            <Code>
              {
                '{\n  "id": "delivery_id",\n  "type": "payment.successful",\n  "data": { "id": "payment_id", "amount_minor": 12500000,\n    "currency": "UZS", "status": "successful",\n    "project_id": "project_id", "livemode": false,\n    "created_at": "2026-10-25T12:00:00.000Z" }\n}'
              }
            </Code>
            <h3>Imzoni serveringizda tekshiring</h3>
            <p>
              Header: <code>Flowza-Signature: t=TIMESTAMP,v1=HEX_HMAC</code>. Vaqt belgisi va nuqtadan keyingi aynan xom javob tanasi imzolanadi. Besh daqiqadan eski yoki kelajakdagi vaqtni rad eting, doimiy vaqtli taqqoslashdan foydalaning va yetkazish ID’lari orqali dublikatni ajrating.
            </p>
            <Code>{`import { createHmac, timingSafeEqual } from 'node:crypto';

export function verify(rawBody, signatureHeader, secret) {
  const match = /^t=(\\d+),v1=([a-f0-9]{64})$/.exec(signatureHeader ?? '');
  if (!match) return false;
  const [, timestamp, signature] = match;
  if (Math.abs(Date.now() / 1000 - Number(timestamp)) > 300) return false;
  const expected = createHmac('sha256', secret)
    .update(timestamp + '.' + rawBody).digest();
  const actual = Buffer.from(signature, 'hex');
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}
// JSON ajratishdan OLDIN tekshiring. Dublikatlarni rad etish uchun yetkazish ID’larini saqlang.
// Ilova hodisani qabul qilgandan keyingina 2xx qaytaring.`}</Code>
          </section>
          <section id="error-handling">
            <h2>Xatolarni boshqarish</h2>
            <Code>
              {
                '{\n  "error": { "message": "Unit muhitining Bearer API kaliti kerak." }\n}'
              }
            </Code>
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>HTTP</th>
                    <th>Ma’nosi</th>
                    <th>Keyingi qadam</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    [
                      "400",
                      "So‘rov noto‘g‘ri",
                      "Maydonlar va idempotency kalitini tekshiring.",
                    ],
                    ["401", "Kirish tasdiqlanmagan", "Faol sinov kalitidan foydalaning."],
                    [
                      "403",
                      "So‘rov manbasi rad etildi",
                      "Sessiyaga oid o‘zgarishlar uchun ilovaning to‘g‘ri manbasidan foydalaning.",
                    ],
                    [
                      "404",
                      "Topilmadi",
                      "To‘lov ID’si va loyiha kalitini tekshiring.",
                    ],
                    [
                      "409",
                      "Ziddiyat",
                      "Asl ma’lumotlarni takrorlang yoki yangi idempotency kaliti tanlang.",
                    ],
                    ["413", "So‘rov hajmi katta", "JSON hajmi 16 KB’dan oshmasin."],
                    ["429", "Limitga yetildi", "Qayta urinishdan oldin bir daqiqa kuting."],
                    [
                      "500 / 503",
                      "Server mavjud emas",
                      "O‘sha idempotency kaliti bilan qayta urinib ko‘ring. Server va baza sozlamalarini tekshiring.",
                    ],
                  ].map((row) => (
                    <tr key={row[0]}>
                      {row.map((cell) => (
                        <td key={cell}>{cell}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p>
              Tarmoq xatosida o‘sha idempotency kaliti va o‘zgarmagan ma’lumotlar bilan qayta urinib ko‘ring. Kutish oralig‘ini bosqichma-bosqich oshiring. Validatsiya yoki kirish xatosini tuzatmasdan qayta yubormang.
            </p>
          </section>
          <div className="docs-close">
            <h2>Sinashga tayyormisiz?</h2>
            <Link href="/signup" className="button primary">
              Sinov loyihasi yaratish <ArrowRight size={16} />
            </Link>
            <a href="#introduction">Kirish bo‘limiga qaytish ↑</a>
          </div>
        </main>
      </div>
    </>
  );
}



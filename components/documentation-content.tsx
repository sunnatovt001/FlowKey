import Link from "next/link";
import { Code } from "@/components/copy";
export function documentationSections({
  base,
  workspace,
  projectId,
}: {
  base: string;
  workspace: boolean;
  projectId: string;
}) {
  const developers =
    workspace && projectId
      ? `/developers?project=${encodeURIComponent(projectId)}`
      : "/developers";
  return [
    {
      id: "introduction",
      title: "API manzili",
      content: (
        <>
          <p>
            API JSON formatida ishlaydi. Faqat UZS qo‘llanadi: 100 kichik birlik
            = 1 so‘m. Hozirgi javoblarda livemode: false.
          </p>
          <Code>{`${base}/api/v1`}</Code>
        </>
      ),
    },
    {
      id: "hosted-checkout",
      title: "To‘lov havolasi",
      content: (
        <>
          <p>
            Faqat HTML ishlatadigan sayt uchun Ulash bo‘limida belgilangan
            summali to‘lov havolasini yarating va HTML tugmasini sahifangizga
            qo‘shing. Sahifani e’lon qiling, tugmani oching va sinov to‘lovini
            bajaring. Natija Tranzaksiyalar bo‘limida chiqadi. Maxfiy API
            kalitni HTML ichiga qo‘ymang.
          </p>
          <p>
            Backend integratsiyasi uchun serveringizdan to‘lov sessiyasi
            yarating:
          </p>
          <Code>{`curl -X POST "${base}/api/v1/checkout/sessions" \\\n  -H "Authorization: Bearer $FLOWZA_KEY" \\\n  -H "Idempotency-Key: order-checkout-001" \\\n  -H "Content-Type: application/json" \\\n  -d '{"title":"Kursga kirish","amount_minor":12500000,"currency":"UZS"}'`}</Code>
          <p>
            Javobda id, url, expires_at va livemode: false keladi. Xaridorni url
            manziliga yo‘naltiring. Sessiya 30 daqiqada tugaydi. Bir xil
            idempotency kaliti va ma’lumotlar o‘sha sessiyani qaytaradi;
            o‘zgargan ma’lumotlar 409 xatosini beradi.
          </p>
          <p>
            Qayta ishlatiladigan to‘lov havolasi buyurtma yoki xaridorni
            aniqlamaydi. Buyurtma uchun sessiya ID’sini backendingizda saqlang.
            GET /api/v1/checkout/sessions/&#123;id&#125; endpointiga o‘sha
            server API kaliti bilan so‘rov yuborsangiz, holat va to‘lov qaytadi.
            Buyurtmani bajarishdan oldin shu javobni yoki imzolangan webhookni
            tekshiring. Brauzerdagi muvaffaqiyat xabari to‘lov tasdig‘i emas.
          </p>
        </>
      ),
    },
    {
      id: "quick-start",
      title: "Tezkor boshlash",
      content: (
        <>
          <ol>
            <li>
              <Link
                href={
                  workspace
                    ? `/settings?project=${encodeURIComponent(projectId)}#create-project`
                    : "/signup"
                }
              >
                {workspace ? "Loyiha yarating" : "Hisob yarating"}
              </Link>{" "}
              va Unit muhitini sozlashni yakunlang.
            </li>
            <li>
              Kabinet ichida loyiha yarating. Birinchi API kaliti avtomatik
              beriladi. Qo‘shimcha kalitlarni Ulash → API kalitlari bo‘limida
              yarating.
            </li>
            <li>
              To‘liq maxfiy kalitni darhol saqlang. U faqat bir marta
              ko‘rsatiladi.
            </li>
            <li>
              Serverdagi muhit o‘zgaruvchilarini sozlang va quyidagi so‘rovni
              yuboring.
            </li>
            <li>
              Saqlangan natijani Tranzaksiyalar va Dashboard bo‘limlarida
              ko‘ring.
            </li>
          </ol>
          <Code>{`export BASE_URL="${base}"
export FLOWZA_KEY="YOUR_UNIT_API_KEY"

curl -X POST "$BASE_URL/api/v1/payments" \\
  -H "Authorization: Bearer $FLOWZA_KEY" \\
  -H "Content-Type: application/json" \\
  -H "Idempotency-Key: first-payment-001" \\
  -d '{"amount_minor":12500000,"currency":"UZS","result":"successful"}'`}</Code>
        </>
      ),
    },
    {
      id: "authentication",
      title: "Autentifikatsiya",
      content: (
        <>
          <p>
            Har bir dasturiy so‘rov Authorization headerida sinov API kalitini
            talab qiladi. Kalit faqat o‘zi yaratilgan loyihaga kirish beradi.
            Brauzer sessiyasi alohida HTTP-only cookie ishlatadi; maxfiy kalitni
            frontend kodiga qo‘ymang.
          </p>
          <Code>{"Authorization: Bearer fz_test_<your-secret>"}</Code>
          <p>
            Bekor qilingan yoki noto‘g‘ri kalit HTTP 401 qaytaradi. Loyiha API
            so‘rovlari daqiqasiga 120 ta, kabinetdagi o‘zgarishlar
            foydalanuvchiga daqiqasiga 60 ta bilan cheklangan. Kirish
            urinishlari elektron pochta uchun daqiqasiga 10 ta bilan cheklangan.
          </p>
        </>
      ),
    },
    {
      id: "api-keys",
      title: "API kalitlari",
      content: (
        <>
          <p>
            Kalitlarni yaratish va bekor qilish:{" "}
            <Link href={developers}>Ulash → API kalitlari</Link>. 256 bitli
            tasodifiy maxfiy kalitning SHA-256 xeshi saqlanadi. Kabinetda faqat
            niqoblangan boshlanish qismi qoladi. Almashtirish uchun yangi kalit
            yarating, server sozlamasini yangilang va eski kalitni bekor qiling.
          </p>
          <p>
            Maxfiy kalitlarni loglarga, URL’ga, manba kodiga yoki brauzer
            paketlariga joylamang.
          </p>
        </>
      ),
    },
    {
      id: "create-payment",
      title: "To‘lov yaratish",
      content: (
        <>
          <p>
            <code>simulated_result</code> maydoni quyidagi maydonning muqobil
            nomi sifatida ham qabul qilinadi: <code>result</code>. Faqat bitta
            natija maydonini yuboring; zid qiymatlar rad etiladi.
          </p>

          <p>
            <code>POST /api/v1/payments</code>
          </p>
          <p>
            So‘rovda <code>Idempotency-Key</code> headeri majburiy: 8–128 ta
            harf, raqam, chiziqcha yoki pastki chiziq. Bir xil kalit va
            ma’lumotlar asl to‘lovni qaytaradi. Ma’lumotlar o‘zgarsa HTTP 409
            qaytadi. Kalitlar loyiha doirasida amal qiladi.
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
          <p>
            Yangi to‘lov uchun HTTP 201, bir xil takroriy so‘rov uchun HTTP 200
            (ID va vaqt namunaviy):
          </p>
          <Code>
            {
              '{\n  "id": "cm_example_payment",\n  "amount_minor": 12500000,\n  "currency": "UZS",\n  "status": "successful",\n  "project_id": "cm_example_project",\n  "livemode": false,\n  "created_at": "2026-10-25T12:00:00.000Z"\n}'
            }
          </Code>
        </>
      ),
    },
    {
      id: "retrieve-payment",
      title: "To‘lovni olish",
      content: (
        <>
          <p>
            <code>GET /api/v1/payments/:id</code>
          </p>
          <Code>{`curl "$BASE_URL/api/v1/payments/$PAYMENT_ID" \\
  -H "Authorization: Bearer $FLOWZA_KEY"`}</Code>
          <p>
            Xuddi shu shakldagi to‘lov javobini qaytaradi. Mavjud bo‘lmagan yoki
            boshqa loyihaga tegishli to‘lov HTTP 404 qaytaradi.
          </p>
        </>
      ),
    },
    {
      id: "payment-status",
      title: "To‘lov holatlari",
      content: (
        <>
          <ul>
            <li>
              <strong>successful</strong> — muvaffaqiyatli sinov natijasi.
            </li>
            <li>
              <strong>failed</strong> — muvaffaqiyatsiz sinov natijasi.
            </li>
            <li>
              <strong>pending</strong> — ushbu MVP’da kutilayotgan holatda
              qoladi; avtomatik hisob-kitob yoki holat almashinuvi yo‘q.
            </li>
          </ul>
          <p>
            Kabinetdagi to‘lov hajmiga faqat muvaffaqiyatli sinov summalari
            qo‘shiladi. Jami tranzaksiyalarda barcha natijalar hisoblanadi.
          </p>
        </>
      ),
    },
    {
      id: "webhooks",
      title: "Webhooklar",
      content: (
        <>
          <p>
            Ulash → Webhooklar bo‘limida ochiq HTTPS endpointingizni ro‘yxatdan
            o‘tkazing va hodisalarni tanlang: <code>payment.successful</code>,{" "}
            <code>payment.failed</code>, va/yoki <code>payment.pending</code>.
            Bir marta ko‘rsatiladigan imzolash kalitini saqlang.
          </p>
          <p>
            To‘lovlar tegishli hodisalarni atomik ravishda navbatga qo‘shadi.
            Avtomatik yetkazish uchun npm run worker buyrug‘ini ishga tushiring.
            Jami besh urinish: darhol, so‘ng 1 daqiqa, 5 daqiqa, 30 daqiqa va 2
            soatdan keyin. Qo‘lda qayta yuborish limitni yangilamaydi. Hodisa
            bir necha marta kelishi mumkin: event ID orqali dublikatni ajrating.
            Faqat tasdiqlangan HTTP 2xx javobi yetkazildi deb belgilanadi. Javob
            muddati 5 soniya.
          </p>
          <p>
            Yo‘naltirishlar kuzatilmaydi. To‘g‘ridan-to‘g‘ri IP, localhost,
            xususiy tarmoq, metadata, rezerv va IPv6 manzillari rad etiladi. Har
            bir urinishda DNS tekshiriladi va ulanish tasdiqlangan manzilga
            bog‘lanadi.
          </p>
          <Code>
            {
              '{\n  "id": "delivery_id",\n  "type": "payment.successful",\n  "data": { "id": "payment_id", "amount_minor": 12500000,\n    "currency": "UZS", "status": "successful",\n    "project_id": "project_id", "livemode": false,\n    "created_at": "2026-10-25T12:00:00.000Z" }\n}'
            }
          </Code>
          <h3>Imzoni serveringizda tekshiring</h3>
          <p>
            Header: <code>Flowza-Signature: t=TIMESTAMP,v1=HEX_HMAC</code>. Vaqt
            belgisi va nuqtadan keyingi aynan xom javob tanasi imzolanadi. Besh
            daqiqadan eski yoki kelajakdagi vaqtni rad eting, doimiy vaqtli
            taqqoslashdan foydalaning va yetkazish ID’lari orqali dublikatni
            ajrating.
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
        </>
      ),
    },
    {
      id: "error-handling",
      title: "Xatolar yechimi",
      content: (
        <>
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
                  [
                    "401",
                    "Kirish tasdiqlanmagan",
                    "Faol sinov kalitidan foydalaning.",
                  ],
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
                  [
                    "413",
                    "So‘rov hajmi katta",
                    "JSON hajmi 16 KB’dan oshmasin.",
                  ],
                  [
                    "429",
                    "Limitga yetildi",
                    "Qayta urinishdan oldin bir daqiqa kuting.",
                  ],
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
            Tarmoq xatosida o‘sha idempotency kaliti va o‘zgarmagan ma’lumotlar
            bilan qayta urinib ko‘ring. Kutish oralig‘ini bosqichma-bosqich
            oshiring. Validatsiya yoki kirish xatosini tuzatmasdan qayta
            yubormang.
          </p>
        </>
      ),
    },
    {
      id: "script-button",
      title: "Script va tugma",
      content: (
        <>
          <p>
            Ulash bo‘limida Script yoki Tugma usulini tanlang. To‘lov havolasini
            yarating va tayyor kodni saytingizga joylang.
          </p>
          <p>
            Maxfiy API kalitini HTML yoki brauzer kodiga qo‘ymang. API kaliti
            faqat serverda saqlanadi.
          </p>
          <Link href={developers}>Ulash bo‘limini ochish →</Link>
        </>
      ),
    },
  ];
}

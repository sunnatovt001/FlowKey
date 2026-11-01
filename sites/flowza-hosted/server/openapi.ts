import { z } from "zod";
import { payment } from "./validators";
export function openapi(base: string) {
  const errorResponses = Object.fromEntries(
    [400, 401, 403, 404, 409, 429, 500, 503].map((status) => [
      status,
      {
        description: (
          {
            400: "So‘rov noto‘g‘ri",
            401: "Kalit noto‘g‘ri",
            403: "Ruxsat yo‘q",
            404: "Topilmadi",
            409: "Idempotency ziddiyati",
            429: "So‘rovlar limitiga yetildi",
            500: "Ichki xato",
            503: "Xizmat vaqtincha mavjud emas",
          } as Record<number, string>
        )[status],
      },
    ]),
  );
  const schema = {
    anyOf: [
      z.toJSONSchema(payment),
      z.toJSONSchema(
        payment
          .omit({ result: true })
          .extend({
            simulated_result: z.enum(["successful", "failed", "pending"]),
          }),
      ),
    ],
  };
  return {
    openapi: "3.1.0",
    info: {
      title: "FlowKey sinov API’si",
      version: "1.0.0",
      description:
        "Faqat sinov to‘lovlari. Haqiqiy pul va amaliy to‘lovlarni qayta ishlash yo‘q.",
    },
    servers: [{ url: `${base}/api/v1` }],
    security: [{ SandboxKey: [] }],
    components: {
      securitySchemes: {
        SandboxKey: {
          type: "http",
          scheme: "bearer",
          description: "Loyiha doirasidagi fz_test_ maxfiy kaliti",
        },
      },
      schemas: {
        CreatePayment: schema,
        Payment: {
          type: "object",
          required: [
            "id",
            "amount_minor",
            "currency",
            "status",
            "project_id",
            "livemode",
            "created_at",
          ],
          properties: {
            id: { type: "string" },
            amount_minor: { type: "integer", minimum: 1, maximum: 1000000000 },
            currency: { const: "UZS" },
            status: { enum: ["successful", "failed", "pending"] },
            project_id: { type: "string" },
            livemode: { const: false },
            created_at: { type: "string", format: "date-time" },
          },
        },
      },
    },
    paths: {
      "/payments": {
        post: {
          operationId: "createPayment",
          summary: "Sinov to‘lovi yaratish",
          parameters: [
            {
              in: "header",
              name: "Idempotency-Key",
              required: true,
              schema: { type: "string", pattern: "^[\\w-]{8,128}$" },
            },
          ],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/CreatePayment" },
                example: {
                  amount_minor: 12500000,
                  currency: "UZS",
                  result: "successful",
                },
              },
            },
          },
          responses: {
            ...errorResponses,
            "201": {
              description: "Yangi sinov to‘lovi",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Payment" },
                },
              },
            },
            "200": {
              description: "Bir xil idempotent takroriy so‘rov",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Payment" },
                },
              },
            },
          },
        },
      },
      "/checkout/sessions": {
        post: {
          operationId: "createCheckoutSession",
          summary: "Backenddan 30 daqiqalik sinov to‘lov sessiyasi yaratish",
          parameters: [{ in: "header", name: "Idempotency-Key", required: true, schema: { type: "string", pattern: "^[\\w-]{8,128}$" } }],
          requestBody: { required: true, content: { "application/json": { schema: { type: "object", additionalProperties: false, required: ["title", "amount_minor", "currency"], properties: { title: { type: "string", minLength: 1, maxLength: 120 }, amount_minor: { type: "integer", minimum: 1, maximum: 1000000000 }, currency: { type: "string", const: "UZS" } } } } } },
          responses: { ...errorResponses, "200": { description: "Yangi yoki takrorlangan to‘lov sessiyasi; to‘lov tasdig‘i hisoblanmaydi", content: { "application/json": { schema: { type: "object", required: ["id", "url", "expires_at", "livemode"], properties: { id: { type: "string" }, url: { type: "string", format: "uri" }, expires_at: { type: "string", format: "date-time" }, livemode: { type: "boolean", const: false } } } } } } },
        },
      },
      "/checkout/sessions/{id}": {
        get: {
          operationId: "retrieveCheckoutSession",
          summary: "Loyihaning server API kaliti bilan to‘lov sessiyasi holati va to‘lovni tekshirish",
          parameters: [{ in: "path", name: "id", required: true, schema: { type: "string" } }],
          responses: { ...errorResponses, "200": { description: "open, expired, successful, failed yoki pending holatidagi sessiya va to‘lov obyekti (yoki null). Barcha javoblarda livemode: false." } },
        },
      },
      "/payments/{id}": {
        get: {
          operationId: "retrievePayment",
          summary: "Kalit loyihasiga tegishli to‘lovni olish",
          parameters: [
            {
              in: "path",
              name: "id",
              required: true,
              schema: { type: "string" },
            },
          ],
          responses: {
            ...errorResponses,
            "200": {
              description: "Sinov to‘lovi",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Payment" },
                },
              },
            },
          },
        },
      },
    },
  };
}

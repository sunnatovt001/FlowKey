import { matchesAppOrigin } from "./origins";
import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { ZodError } from "zod";
import { db } from "./db";
import { ApiError, hash } from "./security";
import { randomUUID } from "node:crypto";
export async function body(req: Request): Promise<unknown> {
  const maxBytes = 16384;
  if (Number(req.headers.get("content-length")) > maxBytes)
    throw new ApiError(413, "So‘rov hajmi juda katta.");
  const reader = req.body?.getReader();
  if (!reader) throw new ApiError(400, "JSON tanasi kerak.");
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > maxBytes) {
      await reader.cancel();
      throw new ApiError(413, "So‘rov hajmi juda katta.");
    }
    chunks.push(value);
  }
  const text = Buffer.concat(chunks).toString("utf8");
  try {
    return JSON.parse(text);
  } catch {
    throw new ApiError(400, "JSON tanasi noto‘g‘ri.");
  }
}
export function sameOrigin(req: Request) {
  const origin = req.headers.get("origin");
  if (
    !matchesAppOrigin(
      origin,
      req.url,
      process.env.APP_URL,
      process.env.NODE_ENV === "development",
    )
  )
    throw new ApiError(403, "So‘rov manbasiga ruxsat yo‘q.");
}
export async function limit(key: string, max = 60) {
  const now = new Date();
  const bucket = Math.floor(now.getTime() / 60000);
  const row = await db.rateLimit.upsert({
    where: { key: hash(`${key}:${bucket}`) },
    create: {
      key: hash(`${key}:${bucket}`),
      resetsAt: new Date((bucket + 1) * 60000),
    },
    update: { count: { increment: 1 } },
  });
  if (row.count > max)
    throw new ApiError(
      429,
      "So‘rovlar juda ko‘p. Bir daqiqadan keyin qayta urinib ko‘ring.",
    );
}
export async function handle(fn: () => Promise<unknown>) {
  const requestId = randomUUID();
  const started = Date.now();
  try {
    const result = await fn();
    console.info(
      JSON.stringify({
        event: "api.completed",
        request_id: requestId,
        status: result instanceof Response ? result.status : 200,
        duration_ms: Date.now() - started,
      }),
    );
    if (result instanceof Response) {
      result.headers.set("X-Request-ID", requestId);
      return result;
    }
    return NextResponse.json(result, {
      headers: { "Cache-Control": "no-store", "X-Request-ID": requestId },
    });
  } catch (error) {
    let status = 500,
      message = "So‘rovni bajarib bo‘lmadi. Qayta urinib ko‘ring.";
    if (error instanceof ApiError) {
      status = error.status;
      message = error.message;
    } else if (error instanceof ZodError) {
      status = 400;
      message = error.issues
        .map((i) => `${i.path.join(".")}: ${i.message}`)
        .join("; ");
    } else if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      status = 409;
      message = "Bu yozuv allaqachon mavjud.";
    } else if (error instanceof Prisma.PrismaClientInitializationError) {
      status = 503;
      message = "Baza mavjud emas. PostgreSQL va migratsiyalarni tekshiring.";
    }
    console.warn(
      JSON.stringify({
        event: "api.failed",
        request_id: requestId,
        status,
        duration_ms: Date.now() - started,
      }),
    );
    return NextResponse.json(
      {
        error: {
          code:
            error instanceof ApiError && error.code
              ? error.code
              : (
                  {
                    400: "invalid_request",
                    401: "unauthorized",
                    403: "forbidden",
                    404: "not_found",
                    409: "conflict",
                    429: "rate_limited",
                    503: "unavailable",
                  } as Record<number, string>
                )[status] || "internal_error",
          message,
          request_id: requestId,
        },
      },
      {
        status,
        headers: {
          "Cache-Control": "no-store",
          "X-Request-ID": requestId,
          ...(status === 429 ? { "Retry-After": "60" } : {}),
        },
      },
    );
  }
}

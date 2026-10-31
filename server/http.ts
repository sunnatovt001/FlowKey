import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client/wasm";
import { ZodError } from "zod";
import { db } from "./db";
import { ApiError, hash } from "./security";
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
  if (!origin || origin !== new URL(process.env.APP_URL || req.url).origin)
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
    throw new ApiError(429, "So‘rovlar juda ko‘p. Bir daqiqadan keyin qayta urinib ko‘ring.");
}
export async function handle(fn: () => Promise<unknown>) {
  try {
    return NextResponse.json(await fn(), {
      headers: { "Cache-Control": "no-store" },
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
      message =
        "Baza mavjud emas. PostgreSQL va migratsiyalarni tekshiring.";
    }
    return NextResponse.json(
      { error: { message } },
      { status, headers: { "Cache-Control": "no-store" } },
    );
  }
}


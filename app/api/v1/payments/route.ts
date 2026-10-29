import { apiProject } from "@/server/auth";
import { body, handle, limit } from "@/server/http";
import { createPayment } from "@/server/payments";
import { NextResponse } from "next/server";
export async function POST(req: Request) {
  return handle(async () => {
    const projectId = await apiProject(req);
    await limit(`api:${projectId}`, 120);
    const { replayed, ...result } = await createPayment(
      projectId,
      await body(req),
      req.headers.get("idempotency-key"),
    );
    return NextResponse.json(result, {
      status: replayed ? 200 : 201,
      headers: { "Cache-Control": "no-store" },
    });
  });
}

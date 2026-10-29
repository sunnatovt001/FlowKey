import { openapi } from "@/server/openapi";
export async function GET() {
  return Response.json(openapi(process.env.APP_URL || "http://localhost:3000"));
}

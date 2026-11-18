import { socialAuthAvailability } from "@/server/social-auth";
import { telegramLoginAvailable } from "@/server/telegram-login";
export function GET() {
  return Response.json({ ...socialAuthAvailability(), telegram: telegramLoginAvailable() }, { headers: { "Cache-Control": "no-store" } });
}

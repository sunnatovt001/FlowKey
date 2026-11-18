import { z } from "zod";
import { currentUser, requireUser } from "@/server/auth";
import { body, handle, limit, sameOrigin } from "@/server/http";
import { ApiError } from "@/server/security";
import { answerWebQuestion } from "@/server/web-assistant";
import { webAiConfigured } from "@/server/telegram/ai-config";
import { accountContext } from "@/server/telegram/context";
import { lookupAccount } from "@/server/telegram/lookup";

export const maxDuration = 70;
const input = z.object({
  page:z.string().max(200).optional(),
  question: z.string().trim().min(1).max(1500),
  history: z.array(z.object({
    role: z.enum(["user", "assistant"]),
    content: z.string().max(2000),
  })).max(8).default([]),
}).strict();
export async function GET() {
  return Response.json({ available: webAiConfigured() }, {
    headers: { "Cache-Control": "no-store" },
  });
}
export async function POST(req: Request) {
  return handle(async () => {
    sameOrigin(req);
    const user = await requireUser();
    await limit(`web-assistant:${user.id}`, 8);
    const data = input.parse(await body(req));
    if (!webAiConfigured())
      throw new ApiError(503, "AI hozircha ulanmagan. Qo‘llanma rejimidan foydalaning.");
    let answer: string;
    try {
      answer = await answerWebQuestion(
        { account: await accountContext(user.id), currentPage:data.page?.split("?")[0] }, data.history, data.question, fetch,
        args => lookupAccount(user.id, args),
      );
    } catch {
      throw new ApiError(502, "Yordamchi hozir javob bera olmadi. Birozdan keyin qayta urinib ko‘ring.");
    }
    if ((await currentUser())?.id !== user.id)
      throw new ApiError(401, "Sessiya tugagan. Hisobga qayta kiring.");
    return { answer };
  });
}

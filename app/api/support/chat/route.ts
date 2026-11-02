import { z } from "zod";
import { currentUser, requireUser } from "@/server/auth";
import { body, handle, limit, sameOrigin } from "@/server/http";
import { ApiError } from "@/server/security";
import { answerQuestion } from "@/server/telegram/ai";
import { accountContext } from "@/server/telegram/context";
import { lookupAccount } from "@/server/telegram/lookup";
import { helpGuide, helpSuggestions } from "@/shared/help-guide";

export const maxDuration = 70;
const input = z.object({
  question: z.string().trim().min(1).max(1500),
  history: z.array(z.object({
    role: z.enum(["user", "assistant"]),
    content: z.string().max(2000),
  })).max(8).default([]),
}).strict();
export async function GET() {
  return Response.json({ available: !!process.env.SUPPORT_AI_API_KEY?.trim() }, {
    headers: { "Cache-Control": "no-store" },
  });
}
export async function POST(req: Request) {
  return handle(async () => {
    sameOrigin(req);
    const user = await requireUser();
    await limit(`web-assistant:${user.id}`, 8);
    const data = input.parse(await body(req));
    if (!process.env.SUPPORT_AI_API_KEY?.trim())
      throw new ApiError(503, "AI hozircha ulanmagan. Qo‘llanma rejimidan foydalaning.");
    let answer: string;
    try {
      answer = await answerQuestion(
        { account: await accountContext(user.id), guide: helpSuggestions.map(question => helpGuide(question).text) }, data.history, data.question, fetch,
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

import { answerQuestion, answerWithResponses, ResponsesError, type Turn } from "./telegram/ai";
import { aiConfigured } from "./telegram/ai-config";
import { answerGemini } from "./telegram/gemini";

let metaRetryAt = 0;

export async function answerWebQuestion(
  snapshot: unknown,
  history: Turn[],
  question: string,
  fetcher: typeof fetch,
  lookup?: (args: unknown) => Promise<unknown>,
) {
  const key = process.env.FLOWKEY_WEB_META_API_KEY?.trim();
  const hasGemini = Boolean(process.env.GEMINI_API_KEY?.trim());
  const hasFallback = aiConfigured();
  const totalSignal = AbortSignal.timeout(55_000);
  const withinDeadline: typeof fetch = (url, init) => fetcher(url, {
    ...init,
    signal: init?.signal ? AbortSignal.any([totalSignal, init.signal]) : totalSignal,
  });

  if (key && (!hasFallback || Date.now() >= metaRetryAt)) {
    try {
      return await answerWithResponses({
        endpoint: "https://api.meta.ai/v1/responses",
        key,
        model: process.env.FLOWKEY_WEB_META_MODEL?.trim() || "muse-wonder-1.0",
        reasoning: { effort: "high", summary: "auto" },
        signal: hasFallback ? AbortSignal.timeout(25_000) : totalSignal,
      }, snapshot, history, question, withinDeadline, lookup);
    } catch (failure) {
      const status = failure instanceof ResponsesError ? failure.status : undefined;
      if (hasFallback && (status === 401 || status === 403 || status === 404 || status === 429)) {
        metaRetryAt = Date.now() + 5 * 60_000;
      }
      console.warn(JSON.stringify({ event: "web_assistant.meta_failed", status }));
      if (!hasFallback) throw failure;
    }
  }

  // The website uses the working Gemini transport before the legacy Llama transport.
  if (hasGemini) return answerGemini(snapshot, history, question, withinDeadline, lookup);
  return answerQuestion(snapshot, history, question, withinDeadline, lookup);
}

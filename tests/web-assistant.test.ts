import test from "node:test";
import assert from "node:assert/strict";
import { answerWebQuestion } from "../server/web-assistant";

test("website uses Meta Responses, then keeps answering through Gemini when the model is unavailable", async () => {
  const keys = ["FLOWKEY_WEB_META_API_KEY", "FLOWKEY_WEB_META_MODEL", "GEMINI_API_KEY"] as const;
  const saved = keys.map(key => process.env[key]);
  process.env.FLOWKEY_WEB_META_API_KEY = "test-only";
  process.env.FLOWKEY_WEB_META_MODEL = "muse-wonder-1.0";
  process.env.GEMINI_API_KEY = "test-only";

  const urls: string[] = [];
  let modelAvailable = true;
  const fetcher: typeof fetch = async (url, init) => {
    const endpoint = String(url);
    urls.push(endpoint);
    const payload = JSON.parse(String(init?.body));
    if (endpoint === "https://api.meta.ai/v1/responses") {
      assert.equal(payload.model, "muse-wonder-1.0");
      assert.deepEqual(payload.reasoning, { effort: "high", summary: "auto" });
      assert.equal(payload.store, false);
      assert.equal(payload.input.at(-1).content, "Salom");
      if (!modelAvailable) return Response.json({ error: { code: "model_not_found" } }, { status: 404 });
      return Response.json({ output: [
        { type: "reasoning", summary: [{ text: "Internal reasoning" }] },
        { type: "message", content: [{ type: "output_text", text: "Salom!" }] },
      ] });
    }
    assert.equal(endpoint, "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions");
    return Response.json({ choices: [{ message: { role: "assistant", content: "Assalomu alaykum!" } }] });
  };

  try {
    assert.equal(await answerWebQuestion({}, [], "Salom", fetcher), "Salom!");
    modelAvailable = false;
    assert.equal(await answerWebQuestion({}, [], "Salom", fetcher), "Assalomu alaykum!");
    assert.equal(await answerWebQuestion({}, [], "Salom", fetcher), "Assalomu alaykum!");
    assert.deepEqual(urls.map(url => new URL(url).hostname), [
      "api.meta.ai", "api.meta.ai", "generativelanguage.googleapis.com", "generativelanguage.googleapis.com",
    ]);
  } finally {
    keys.forEach((key, i) => {
      if (saved[i] === undefined) delete process.env[key];
      else process.env[key] = saved[i];
    });
  }
});

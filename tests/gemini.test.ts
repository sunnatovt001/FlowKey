import test from "node:test";
import assert from "node:assert/strict";
import { answerGemini } from "../server/telegram/gemini";
import { redact } from "../server/telegram/policy";
test("Gemini keeps lookup owner supplied, redacts key, and handles tool results", async () => {
  let requests = 0,
    lookups = 0;
  const secret = "AIza" + "x".repeat(35);
  const result = await answerGemini(
    {},
    [],
    secret,
    async (url, init) => {
      assert.equal(
        url,
        "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
      );
      const request = JSON.parse(String(init?.body));
      assert.ok(!JSON.stringify(request).includes(secret));
      requests++;
      if (requests === 1)
        return Response.json({
          choices: [
            {
              message: {
                role: "assistant",
                content: null,
                tool_calls: [
                  {
                    id: "c1",
                    type: "function",
                    function: {
                      name: "lookup_account",
                      arguments: '{"section":"projects"}',
                    },
                  },
                ],
              },
            },
          ],
        });
      assert.equal(request.messages.at(-1).role, "tool");
      return Response.json({
        choices: [{ message: { content: "Javob: " + secret } }],
      });
    },
    async () => {
      lookups++;
      return { projects: [] };
    },
  );
  assert.equal(lookups, 1);
  assert.equal(requests, 2);
  assert.ok(!result.includes(secret));
  assert.ok(!redact(secret).includes(secret));
});
test("Gemini provider failure never returns raw provider response", async () => {
  await assert.rejects(
    answerGemini({}, [], "salom", async () =>
      Response.json(
        { error: { message: "secret-provider-detail" } },
        { status: 429 },
      ),
    ),
    /limiti/,
  );
});

import test from "node:test";
import assert from "node:assert/strict";
import { answerLlama } from "../server/telegram/llama";

test("Meta uses native completion response, redacts secrets, and bounds owner-scoped lookup", async () => {
  let requests = 0;
  const secret = "LLM_" + "x".repeat(35);
  const lookupCalls: unknown[] = [];
  const answer = await answerLlama({ project: secret }, [], "Help " + secret, (async (url, options) => {
    assert.equal(url, "https://api.llama.com/v1/chat/completions");
    const body = JSON.parse(String(options?.body));
    assert.equal(body.max_completion_tokens, 1500);
    assert.ok(!String(options?.body).includes(secret));
    requests++;
    if (requests === 1) return Response.json({ completion_message: {role: "assistant", tool_calls: [{id: "one", function: {name: "lookup_account", arguments: '{"kind":"payments"}'}}]}});
    assert.deepEqual(JSON.parse(body.messages.at(-1).content), { count: 2 });
    return Response.json({ completion_message: {role: "assistant", content: {type: "text", text: "**Two** payments"}}});
  }) as typeof fetch, async args => { lookupCalls.push(args); return { count: 2 }; });
  assert.equal(answer, "Two payments");
  assert.equal(lookupCalls.length, 1);
  assert.equal(requests, 2);
});
test("Meta provider errors and empty responses do not expose provider payload", async () => {
  await assert.rejects(answerLlama({}, [], "hello", (async () => new Response("PRIVATE", { status: 401 })) as typeof fetch), error => error instanceof Error && !error.message.includes("PRIVATE"));
  await assert.rejects(answerLlama({}, [], "hello", (async () => Response.json({completion_message: {role: "assistant", content: null}})) as typeof fetch));
});

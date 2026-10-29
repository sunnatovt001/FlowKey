import test from "node:test";
import assert from "node:assert/strict";
import {
  redact,
  safeWebsite,
  diagnosticFindings,
} from "../server/telegram/policy";
import { answerQuestion } from "../server/telegram/ai";
import { processUpdate } from "../server/telegram/bot";
test("Telegram redacts API, webhook, AI and bot secrets", () => {
  const data =
    "fz_test_" +
    "a".repeat(64) +
    " whsec_" +
    "b".repeat(64) +
    " sk-proj-" +
    "c".repeat(30) +
    " 123456789:" +
    "d".repeat(30);
  const result = redact(data);
  for (const value of [
    "a".repeat(64),
    "b".repeat(64),
    "c".repeat(30),
    "d".repeat(30),
  ])
    assert.ok(!result.includes(value));
});
test("diagnostics distinguish simulated failure from infrastructure faults", () => {
  const findings = diagnosticFindings({
    projects: 1,
    activeKeys: 0,
    failedDeliveries: 2,
    failedPayments: 3,
    expiredSessions: 1,
  });
  assert.equal(findings.length, 4);
  assert.ok(
    findings.some((f) => f.includes("avtomatik tizim nosozligi degani emas")),
  );
  assert.equal(
    safeWebsite("https://user:password@example.com/path?secret=abc#token"),
    "https://example.com/path",
  );
});
test("AI request uses private snapshot, bounded history, no retained provider response, and redacts secrets", async () => {
  const saved = process.env.SUPPORT_AI_API_KEY;
  process.env.SUPPORT_AI_API_KEY = "test-only";
  let request: Record<string, unknown> = {};
  try {
    const result = await answerQuestion(
      { findings: ["No issue"] },
      Array.from({ length: 12 }, () => ({
        role: "user" as const,
        content: "fz_test_" + "a".repeat(64),
      })),
      "Yordam",
      async (_url, init) => {
        request = JSON.parse(String(init?.body));
        return Response.json({
          output: [
            { content: [{ type: "output_text", text: "Tekshirildi." }] },
          ],
        });
      },
    );
    assert.equal(result, "Tekshirildi.");
    assert.equal(request.store, false);
    assert.equal((request.input as unknown[]).length, 10);
    assert.ok(!JSON.stringify(request).includes("a".repeat(64)));
  } finally {
    if (saved === undefined) delete process.env.SUPPORT_AI_API_KEY;
    else process.env.SUPPORT_AI_API_KEY = saved;
  }
});
test("missing AI configuration is explicit and makes no network calls", async () => {
  const saved = process.env.SUPPORT_AI_API_KEY;
  delete process.env.SUPPORT_AI_API_KEY;
  try {
    const result = await answerQuestion({}, [], "salom", async () => {
      throw Error("Network should not run");
    });
    assert.match(result, /sozlanmagan/);
  } finally {
    if (saved !== undefined) process.env.SUPPORT_AI_API_KEY = saved;
  }
});
test("group chats and callbacks from a different sender are ignored before database/API access", async () => {
  await processUpdate({
    update_id: 1,
    message: {
      message_id: 1,
      text: "/check",
      from: { id: 1 },
      chat: { id: -123, type: "group" },
    },
  });
  await processUpdate({
    update_id: 2,
    callback_query: {
      id: "no",
      from: { id: 99 },
      data: "admin",
      message: { message_id: 2, chat: { id: 1, type: "private" } },
    },
  });
});

import {
  packText,
  unpackText,
  packSnapshot,
  unpackSnapshot,
} from "../server/telegram/storage";
test("support storage round-trips Uzbek and emoji on legacy local DB encodings", () => {
  const text = "O‘zbekcha yordam 🔧";
  const packed = packText(text);
  assert.ok(/^[\x00-\x7F]*$/.test(packed));
  assert.equal(unpackText(packed), text);
  assert.deepEqual(unpackSnapshot(packSnapshot({ text })), { text });
});
test("AI executes only the account lookup supplied by its trusted owner context", async () => {
  const saved = process.env.SUPPORT_AI_API_KEY;
  process.env.SUPPORT_AI_API_KEY = "test-only";
  let requests = 0,
    lookups = 0;
  try {
    const answer = await answerQuestion(
      {},
      [],
      "Eski loyihamni toping",
      async (_url, init) => {
        requests++;
        const body = JSON.parse(String(init?.body));
        assert.equal(body.store, false);
        if (requests === 1)
          return Response.json({
            output: [
              {
                type: "function_call",
                call_id: "one",
                name: "lookup_account",
                arguments: JSON.stringify({
                  section: "projects",
                  query: null,
                  project_id: null,
                  status: null,
                  offset: 0,
                }),
              },
            ],
          });
        assert.ok(
          body.input.some(
            (item: { type: string; call_id: string }) =>
              item.type === "function_call_output" && item.call_id === "one",
          ),
        );
        return Response.json({
          output: [
            { content: [{ type: "output_text", text: "Loyiha topildi." }] },
          ],
        });
      },
      async (args) => {
        lookups++;
        assert.equal((args as { section: string }).section, "projects");
        return { rows: [{ name: "Owned project" }] };
      },
    );
    assert.equal(lookups, 1);
    assert.equal(answer, "Loyiha topildi.");
  } finally {
    if (saved === undefined) delete process.env.SUPPORT_AI_API_KEY;
    else process.env.SUPPORT_AI_API_KEY = saved;
  }
});

import {mkdtemp,writeFile,readFile,unlink,rmdir} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {writeAdminChatId} from '../server/telegram/admin-setup';
test('one-time admin setup preserves local settings and cannot replace an existing admin',async()=>{const directory=await mkdtemp(join(tmpdir(),'flowkey-admin-test-'));const file=join(directory,'.env');try{await writeFile(file,'OTHER_VALUE="preserve-me"\nTELEGRAM_ADMIN_CHAT_ID=""\n');await writeAdminChatId('123456',file);const saved=await readFile(file,'utf8');assert.ok(saved.includes('OTHER_VALUE="preserve-me"'));assert.ok(saved.includes('TELEGRAM_ADMIN_CHAT_ID="123456"'));await assert.rejects(writeAdminChatId('999999',file),/allaqachon/);await assert.rejects(writeAdminChatId('invalid',file),/noto‘g‘ri/);}finally{await unlink(file);await rmdir(directory);}});

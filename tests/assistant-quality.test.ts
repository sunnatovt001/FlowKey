import test from "node:test";
import assert from "node:assert/strict";
import { cleanAssistantAnswer } from "../server/telegram/policy";
test("assistant plain text formatting preserves API names and hides secrets", () => {
  const key = "AIza" + "x".repeat(35);
  const answer = cleanAssistantAnswer(
    "## Tekshirish\n1. **Tranzaksiyalar**ni oching.\n2. `Idempotency-Key` va project_id.\n\n\n*Eslatma:* " +
      key,
  );
  assert.equal(
    answer,
    "Tekshirish\n1. Tranzaksiyalarni oching.\n2. Idempotency-Key va project_id.\n\nEslatma: [MAXFIY KALIT YASHIRILDI]",
  );
});

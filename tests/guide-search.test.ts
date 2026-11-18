import test from "node:test";
import assert from "node:assert/strict";
import { searchGuide, guideTopics, normalizeGuideText } from "../shared/guide";
test("guide search matches Uzbek apostrophe variants, error codes and technical synonyms", () => {
  assert.ok(
    searchGuide("to'lov havolasi").some((t) => t.id === "hosted-checkout"),
  );
  assert.ok(searchGuide("TOLОV").length === 0); // Latin/Cyrillic lookalikes are not treated as trusted aliases.
  assert.equal(normalizeGuideText(" TO‘LOV "), "tolov");
  assert.deepEqual(
    searchGuide("401").map((t) => t.id),
    ["error-handling"],
  );
  assert.deepEqual(
    searchGuide("vebhuk").map((t) => t.id),
    ["webhooks"],
  );
  assert.ok(searchGuide("idempotency").some((t) => t.id === "create-payment"));
  assert.equal(searchGuide("unknown-nonexistent-topic").length, 0);
});
test("guide categories keep the six starting topics concise and technical topics discoverable", () => {
  assert.equal(searchGuide("").length, 6);
  assert.ok(searchGuide("", "api").some((t) => t.id === "authentication"));
  assert.ok(searchGuide("", "api").every((t) => t.category === "api"));
  assert.deepEqual(
    searchGuide("", "webhook").map((t) => t.id),
    ["webhooks"],
  );
  assert.equal(new Set(guideTopics.map((t) => t.id)).size, guideTopics.length);
  assert.ok(searchGuide("webhook", "api").some((t) => t.id === "webhooks"));
});

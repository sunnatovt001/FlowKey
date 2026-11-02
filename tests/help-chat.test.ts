import test from "node:test";
import assert from "node:assert/strict";
import { helpGuide } from "../shared/help-guide";
import "./helpers";

test("guide answers use real in-app destinations and never claim account access", () => {
  assert.equal(helpGuide("Loyiha qanday yarataman?").href, "/settings#create-project");
  assert.equal(helpGuide("API kalit qayerda?").href, "/developers");
  assert.equal(helpGuide("Parolimni unutdim").href, "/login?mode=reset");
  assert.equal(helpGuide("Webhook ishlamayapti").href, "/developers?tab=webhooks");
  assert.match(helpGuide("Salom").text, /tayyor qo‘llanma/);
  assert.match(helpGuide("Haqiqiy pul ishlaydimi?").text, /Haqiqiy pul.*kerak emas/);
});
const base = process.env.FLOWZA_TEST_URL;
test("web assistant status exposes no secret and private chat rejects anonymous/cross-origin requests", {skip: !base}, async () => {
  const status = await fetch(`${base}/api/support/chat`);
  assert.equal(status.status, 200);
  const value = await status.json();
  assert.deepEqual(Object.keys(value), ["available"]);
  assert.equal(typeof value.available, "boolean");
  const post = (origin: string) => fetch(`${base}/api/support/chat`, {
    method: "POST", headers: {Origin: origin, "Content-Type": "application/json"},
    body: JSON.stringify({question: "Hisobimni tekshir", history: []}),
  });
  assert.equal((await post(base!)).status, 401);
  assert.equal((await post("https://untrusted.example")).status, 403);
});

import { createHmac } from "node:crypto";
import { test } from "node:test";
import assert from "node:assert/strict";
import { verifyMiniAppData } from "../server/telegram/miniapp-proof";
const token = "test-only-token";
const now = 1800000000000;
function signed(overrides: Record<string,string> = {}) {
 const params = new URLSearchParams({ auth_date: String(now / 1000), user: JSON.stringify({ id: 12345, first_name: "Test" }), ...overrides });
 const check = [...params.entries()].sort(([a],[b]) => a < b ? -1 : a > b ? 1 : 0).map(([k,v])=>`${k}=${v}`).join("\n");
 const secret = createHmac("sha256", "WebAppData").update(token).digest();
 params.set("hash", createHmac("sha256", secret).update(check).digest("hex"));
 return params.toString();
}
test("Mini App verifies a signed Telegram identity",()=>assert.equal(verifyMiniAppData(signed(),token,now),"12345"));
test("Mini App rejects tampering, wrong bot, expiry and future timestamps",()=>{
 assert.throws(()=>verifyMiniAppData(signed().replace("12345","54321"),token,now));
 assert.throws(()=>verifyMiniAppData(signed(),"another-bot",now));
 assert.throws(()=>verifyMiniAppData(signed({auth_date:String(now/1000-3601)}),token,now));
 assert.throws(()=>verifyMiniAppData(signed({auth_date:String(now/1000+31)}),token,now));
});
test("Mini App rejects duplicate fields, bots and missing envelopes",()=>{
 assert.throws(()=>verifyMiniAppData(signed()+"&user=bad",token,now));
 assert.throws(()=>verifyMiniAppData(signed({user:JSON.stringify({id:12345,is_bot:true})}),token,now));
 assert.throws(()=>verifyMiniAppData("",token,now));
 assert.throws(()=>verifyMiniAppData(signed(),"",now));
});

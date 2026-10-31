import { env } from "cloudflare:workers";
import { timingSafeEqual } from "node:crypto";
import { processUpdate } from "@/server/telegram/bot";
import { deliverTickets } from "@/server/telegram/tickets";
import { body } from "@/server/http";
import type { TelegramUpdate } from "@/server/telegram/api";
export async function POST(req: Request) {
 const expected = env.TELEGRAM_WEBHOOK_SECRET;
 const received = req.headers.get('x-telegram-bot-api-secret-token') || '';
 if (!expected) return new Response('Unavailable', {status:503});
 const a=Buffer.from(expected), b=Buffer.from(received);
 if (a.length!==b.length || !timingSafeEqual(a,b)) return new Response('Forbidden',{status:403});
 let update: TelegramUpdate;
 try { update=await body(req) as TelegramUpdate; } catch { return new Response('Invalid update',{status:400}); }
 if (!Number.isSafeInteger(update?.update_id)) return new Response('Invalid update',{status:400});
 const id='webhook:'+update.update_id, owner=crypto.randomUUID(), now=new Date().toISOString();
 const claim=await env.DB!.prepare('INSERT INTO SupportBotState (id,offset,leaseOwner,leaseUntil) VALUES (?,0,?,?) ON CONFLICT(id) DO UPDATE SET leaseOwner=excluded.leaseOwner,leaseUntil=excluded.leaseUntil WHERE SupportBotState.offset=0 AND julianday(SupportBotState.leaseUntil)<julianday(?)').bind(id,owner,new Date(Date.now()+120000).toISOString(),now).run();
 if(!claim.meta.changes){
  const state=await env.DB!.prepare('SELECT offset FROM SupportBotState WHERE id=?').bind(id).first<{offset:number}>();
  return new Response(state?.offset===1?'OK':'Busy',{status:state?.offset===1?200:503});
 }
 try {
  await processUpdate(update);
  await deliverTickets();
  await env.DB!.prepare('UPDATE SupportBotState SET offset=1 WHERE id=? AND leaseOwner=?').bind(id,owner).run();
  return new Response('OK');
 } catch {
  await env.DB!.prepare('DELETE FROM SupportBotState WHERE id=? AND leaseOwner=?').bind(id,owner).run();
  return new Response('Retry',{status:500});
 }
}

import { randomBytes } from "node:crypto";
import { env } from "cloudflare:workers";
import { db } from "./db";
import { ApiError, hash } from "./security";
import { checkoutInput } from "./checkout-validation";
import { createPayment } from "./payments";
export function checkoutUrl(path: string) {
  return new URL(path, "https://flowza-sandbox.u-t-m-u.chatgpt.site").href;
}
export async function newSession(projectId: string, input: unknown, key: string | null, linkId?: string) {
  const data = checkoutInput.parse(input);
  if (!key || !/^[\w-]{8,128}$/.test(key)) throw new ApiError(400, "8–128 belgili Idempotency-Key kerak.");
  const requestKey = `checkout:${key}`, requestHash = hash(JSON.stringify({ ...data, linkId }));
  const project = await db.project.findUnique({ where: { id: projectId } });
  if (!project || project.archivedAt) throw new ApiError(404, "Loyiha mavjud emas.");
  // Native D1 INSERT handles concurrent creation; replay always reads the winning immutable row.
  await env.DB!.prepare('INSERT INTO CheckoutSession (id,projectId,linkId,title,amountMinor,currency,requestKey,requestHash,createdAt,expiresAt) VALUES (?,?,?,?,?,?,?,?,?,?) ON CONFLICT(projectId,requestKey) DO NOTHING')
    .bind(randomBytes(32).toString("hex"),projectId,linkId || null,data.title,data.amount_minor,data.currency,requestKey,requestHash,new Date().toISOString(),new Date(Date.now()+30*60_000).toISOString()).run();
  const row = await env.DB!.prepare('SELECT * FROM CheckoutSession WHERE projectId=? AND requestKey=?').bind(projectId,requestKey).first<SessionRow>();
  if (!row) throw new ApiError(503,"To‘lov sessiyasini yaratib bo‘lmadi. Qayta urinib ko‘ring.");
  const session = sessionValue(row);
  if (session.requestHash !== requestHash) throw new ApiError(409, "Idempotency kaliti boshqa to‘lov sessiyasi uchun ishlatilgan.");
  return { id: session.id, url: checkoutUrl(`/checkout/${session.id}`), expires_at: session.expiresAt.toISOString(), livemode: false };
}
export async function completeSession(sessionId: string, result: "successful" | "failed" | "pending") {
  const session = await getSession(sessionId);
  if (!session || session.project.archivedAt || session.link?.disabledAt) throw new ApiError(404, "To‘lov sessiyasi mavjud emas.");
  if (!session.result && session.expiresAt <= new Date()) throw new ApiError(410, "To‘lov sessiyasi muddati tugagan. To‘lov havolasini qayta oching.");
  await env.DB!.prepare('UPDATE CheckoutSession SET result=? WHERE id=? AND result IS NULL AND expiresAt>?').bind(result,sessionId,new Date().toISOString()).run();
  const locked = await getSession(sessionId);
  if (!locked?.result) throw new ApiError(410, "To‘lov sessiyasi muddati tugagan.");
  return createPayment(session.projectId, { amount_minor: session.amountMinor, currency: session.currency, result: locked.result }, `checkout_${sessionId}`);
}
type LinkRow = { id:string;projectId:string;title:string;amountMinor:number;currency:string;createdAt:string;disabledAt:string|null };
type SessionRow = { id:string;projectId:string;linkId:string|null;title:string;amountMinor:number;currency:string;requestKey:string;requestHash:string;result:string|null;createdAt:string;expiresAt:string };
function sessionValue(row:SessionRow){return {...row,expiresAt:new Date(row.expiresAt)};}
export async function getLink(id:string){
  const row=await env.DB!.prepare('SELECT * FROM PaymentLink WHERE id=?').bind(id).first<LinkRow>();
  if(!row)return null;
  const project=await db.project.findUnique({where:{id:row.projectId}});
  return project?{...row,project}:null;
}
export async function getSession(id:string){
  const row=await env.DB!.prepare('SELECT * FROM CheckoutSession WHERE id=?').bind(id).first<SessionRow>();
  if(!row)return null;
  const [project,link]=await Promise.all([db.project.findUnique({where:{id:row.projectId}}),row.linkId?getLink(row.linkId):Promise.resolve(null)]);
  return project?{...sessionValue(row),project,link}:null;
}
export async function listLinks(projectId:string){return (await env.DB!.prepare('SELECT * FROM PaymentLink WHERE projectId=? ORDER BY createdAt DESC LIMIT 50').bind(projectId).all<LinkRow>()).results;}
export async function createLink(projectId:string,input:unknown){const data=checkoutInput.parse(input);const id=randomBytes(32).toString('hex');await env.DB!.prepare('INSERT INTO PaymentLink (id,projectId,title,amountMinor,currency,createdAt) VALUES (?,?,?,?,?,?)').bind(id,projectId,data.title,data.amount_minor,data.currency,new Date().toISOString()).run();return {id,url:checkoutUrl(`/pay/${id}`),livemode:false};}
export async function disableLink(projectId:string,id:string){const r=await env.DB!.prepare('UPDATE PaymentLink SET disabledAt=? WHERE id=? AND projectId=?').bind(new Date().toISOString(),id,projectId).run();if(!r.meta.changes)throw new ApiError(404,"Havola topilmadi.");return {disabled:true};}

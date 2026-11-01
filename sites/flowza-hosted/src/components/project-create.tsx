"use client";
import { useRouter } from "next/navigation";
import {useState} from "react";
import Link from "./site-link";
import {Code} from "./copy";
import {IntegrationPrompts} from "./integration-prompts";
export function ProjectCreate(){
 const router=useRouter();
 const [busy,setBusy]=useState(false),[error,setError]=useState("");
 const [created,setCreated]=useState<{id:string;secret:string}|null>(null);
 return <section className="panel settings-panel"><h2 id="create-project">Loyiha yaratish</h2><p>Loyiha nomini kiriting. API kaliti avtomatik yaratiladi.</p><form onSubmit={async e=>{
 e.preventDefault();const values=Object.fromEntries(new FormData(e.currentTarget));setBusy(true);setError("");
 try{const response=await fetch('/api/projects',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(values)});const result=await response.json() as {id:string;secret:string;error?:{message:string}};if(!response.ok)throw new Error(result.error?.message||'Loyihani yaratib bo‘lmadi.');setCreated(result);router.refresh();}catch(e){setError(e instanceof Error?e.message:'Qayta urinib ko‘ring.');}finally{setBusy(false);}
 }}><label>Loyiha nomi<input name="projectName" required minLength={2} maxLength={100} placeholder="Masalan, mening platformam" disabled={busy}/></label><label>Veb-sayt (ixtiyoriy)<input type="url" name="website" maxLength={500} placeholder="https://mahsulotingiz.uz" disabled={busy}/></label>{error&&<p role="alert" className="error">{error}</p>}<button className="button primary" disabled={busy}>{busy?'Yaratilmoqda…':'Loyiha yaratish'}</button></form>
 {created&&<div className="integration-prompts" role="status"><h3>Loyiha tayyor. API kalitingiz</h3><p>Kalit faqat bir marta ko‘rsatiladi. Uni xavfsiz saqlang. AI suhbatiga yoki brauzer kodiga qo‘shmang.</p><Code>{created.secret}</Code><IntegrationPrompts projectId={created.id} method="API kaliti"/><Link className="button primary" href={`/developers?project=${created.id}`}>Loyihani ulash</Link><button className="button secondary" onClick={()=>setCreated(null)}>Kalitni yashirish</button></div>}
 </section>;
}

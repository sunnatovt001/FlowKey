import {env} from "cloudflare:workers";
import {db} from "@/server/db";
import {requireUser} from "@/server/auth";
import {body,handle,limit,sameOrigin} from "@/server/http";
import {onboarding} from "@/server/validators";
import {ApiError,hash,secret} from "@/server/security";
export async function POST(req:Request){return handle(async()=>{
 sameOrigin(req);const user=await requireUser();await limit(`write:${user.id}`,30);
 const input=onboarding.pick({projectName:true,website:true}).parse(await body(req));
 const business=await db.business.findUnique({where:{ownerId:user.id}});
 if(!business)throw new ApiError(409,"Avval mahsulot ma’lumotlarini kiriting.");
 const id=crypto.randomUUID(),keyId=crypto.randomUUID(),fullSecret=secret("fz_test_"),now=new Date().toISOString();
 await env.DB!.batch([
 env.DB!.prepare('INSERT INTO Project (id,businessId,name,website,description,createdAt) VALUES (?,?,?,?,?,?)').bind(id,business.id,input.projectName,input.website||null,null,now),
 env.DB!.prepare('INSERT INTO Membership (userId,projectId,role) VALUES (?,?,?)').bind(user.id,id,'owner'),
 env.DB!.prepare('INSERT INTO ApiKey (id,projectId,name,prefix,secretHash,createdAt) VALUES (?,?,?,?,?,?)').bind(keyId,id,'Birinchi Unit kaliti',fullSecret.slice(0,16),hash(fullSecret),now),
 env.DB!.prepare('INSERT INTO AuditLog (id,projectId,action,resourceId,createdAt) VALUES (?,?,?,?,?)').bind(crypto.randomUUID(),id,'project.created',id,now)
 ]);
 return {id,name:input.projectName,secret:fullSecret};
});}

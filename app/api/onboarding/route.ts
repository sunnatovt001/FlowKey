import { db } from "@/server/db";
import { requireUser } from "@/server/auth";
import { body, handle, limit, sameOrigin } from "@/server/http";
import { onboarding } from "@/server/validators";
export async function POST(req: Request) {
 return handle(async()=>{
  sameOrigin(req); const user=await requireUser();await limit(`onboard:${user.id}`,10);
  const data=onboarding.pick({businessName:true,businessType:true}).parse(await body(req));
  const business=await db.business.upsert({where:{ownerId:user.id},update:{},create:{ownerId:user.id,name:data.businessName,type:data.businessType}});
  return {ok:true,businessId:business.id,redirect:"/settings?welcome=1#create-project"};
 });
}

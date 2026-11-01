export const dynamic="force-dynamic";
import Link from "@/components/site-link";
import {redirect} from "next/navigation";
import {pageUser} from "@/server/auth";
import {db} from "@/server/db";
import {businessLabel} from "@/shared/locale";

import {TelegramSettings} from "@/components/telegram-settings";
import {AvatarSettings} from "@/components/avatar";
import {ProjectCreate} from "@/components/project-create";
import {Search} from "@/server/workspace";
export const metadata={title:"Hisob sozlamalari"};
export default async function Settings({searchParams}:{searchParams:Promise<Search>}){
 const search=await searchParams;const user=await pageUser();const business=await db.business.findUnique({where:{ownerId:user.id}});
 if(!business)redirect('/onboarding');
 const projects=await db.project.findMany({where:{businessId:business.id,archivedAt:null},orderBy:{createdAt:'asc'}});

 return <><div className="page-heading"><div><p className="breadcrumb">Kabinet / Hisob sozlamalari</p><h1>{projects.length?'Kabinet ma’lumotlari.':'Kabinetga xush kelibsiz.'}</h1><p className="muted">{projects.length?'Mahsulot va loyihalaringizni boshqaring.':'Birinchi loyihangizni yarating va saytingizga ulang.'}</p></div></div><AvatarSettings email={user.email}/><ProjectCreate/><TelegramSettings/><section className="panel settings-panel"><h2>Mahsulot</h2><dl className="detail-list"><div><dt>Mahsulot nomi</dt><dd>{business.name}</dd></div><div><dt>Mahsulot turi</dt><dd>{businessLabel(business.type)}</dd></div><div><dt>Elektron pochta</dt><dd>{user.email}</dd></div></dl><p className="muted">Kirish va hisob xavfsizligi ChatGPT tomonidan boshqariladi.</p></section>{projects.map(project=><section className="panel settings-panel" key={project.id}><h2>{project.name}</h2><p>{project.website||'Sayt manzili kiritilmagan'}</p><Link className="button secondary" href={`/developers?project=${project.id}`}>Loyihani ulash</Link></section>)}</>;
}

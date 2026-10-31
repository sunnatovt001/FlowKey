import {redirect} from 'next/navigation';
import {getChatGPTUser} from '@/app/chatgpt-auth';
import {db} from './db';
import {ApiError,hash} from './security';
export async function currentUser(){const identity=await getChatGPTUser();if(!identity)return null;return db.user.upsert({where:{id:identity.userId},create:{id:identity.userId,email:identity.email,passwordHash:'!dispatch-owned-identity'},update:{email:identity.email}});}
export async function requireUser(){const user=await currentUser();if(!user)throw new ApiError(401,"Davom etish uchun ChatGPT orqali kiring.");return user;}
export async function pageUser(){const user=await currentUser();if(!user)redirect('/login');return user;}
export async function requireProject(projectId:string,userId:string){const member=await db.membership.findUnique({where:{userId_projectId:{userId,projectId}},include:{project:{include:{business:true}}}});if(!member||member.role!=='owner'||member.project.business.ownerId!==userId)throw new ApiError(404,"Loyiha topilmadi.");if(member.project.archivedAt)throw new ApiError(409,"Loyiha arxivlangan.");return member.project;}
export async function apiProject(req:Request){const token=req.headers.get('authorization')?.replace(/^Bearer /,'');if(!token?.startsWith('fz_test_'))throw new ApiError(401,"Sinov muhitining Bearer API kaliti kerak.");const key=await db.apiKey.findUnique({where:{secretHash:hash(token)},include:{project:true}});if(!key||key.revokedAt||key.project.archivedAt)throw new ApiError(401,"Sinov kaliti noto‘g‘ri, bekor qilingan yoki loyiha arxivlangan.");return key.projectId;}

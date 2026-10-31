import { PrismaClient } from '@prisma/client/wasm';
import { PrismaD1 } from '@prisma/adapter-d1';
import { AsyncLocalStorage } from 'node:async_hooks';
import { env } from 'cloudflare:workers';
const context=new AsyncLocalStorage<PrismaClient>();
export function withDatabase<T>(fn:()=>T){if(!env.DB)throw new Error("Baza ulanishi sozlanmagan.");return context.run(new PrismaClient({adapter:new PrismaD1(env.DB)}),fn);}
export const db=new Proxy({} as PrismaClient,{get:(_,key)=>{const client=context.getStore();if(!client)throw new Error("So‘rovning baza muhiti mavjud emas.");const value=Reflect.get(client,key);return typeof value==='function'?value.bind(client):value;}});


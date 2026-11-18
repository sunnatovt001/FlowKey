import {createRequire} from 'node:module';
import {execFileSync} from 'node:child_process';
import {readFileSync,writeFileSync,renameSync,mkdirSync} from 'node:fs';
export const root=process.env.FLOWKEY_OPS_ROOT||'/home/deploy/flowkey-ops';
export function setup(){process.umask(0o077);process.loadEnvFile(root+'/shared/.env');mkdirSync(root+'/reliability',{recursive:true,mode:0o700});}
export function database(){const u=new URL(process.env.DATABASE_URL);if(!['127.0.0.1','localhost'].includes(u.hostname))throw Error('Loopback database required');return u;}
export function pgClient(url){const require=createRequire(root+'/current/package.json');const {Client}=require('pg');return new Client({connectionString:url.href,connectionTimeoutMillis:5000,query_timeout:30000});}
export function pgArgs(u){return ['-h',u.hostname,'-p',u.port||'5432','-U',decodeURIComponent(u.username),'-d',decodeURIComponent(u.pathname.slice(1))];}
export function pgEnv(u){return {...process.env,PGPASSWORD:decodeURIComponent(u.password),PGCONNECT_TIMEOUT:'10'};}
export function run(command,args,env=process.env){return execFileSync(command,args,{env,stdio:['ignore','pipe','pipe'],timeout:300000,maxBuffer:2*1024*1024});}
export function writeJson(path,data){writeFileSync(path+'.new',JSON.stringify(data,null,2)+'\n',{mode:0o600});renameSync(path+'.new',path);}
export function readJson(path,fallback=null){try{return JSON.parse(readFileSync(path,'utf8'));}catch{return fallback;}}
export function quote(value){return '"'+value.replaceAll('"','""')+'"';}

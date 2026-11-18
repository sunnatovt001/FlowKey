import {root,setup,run,readJson,writeJson} from './common.mjs';
import {nextIncident,markSent} from './incident.mjs';
setup();
const problems=[];
try{const response=await fetch('https://flowkey.uz/api/health',{signal:AbortSignal.timeout(10000),redirect:'error'});if(!response.ok||(await response.json()).status!=='ok')problems.push('Sayt yoki baza javob bermayapti');}catch{problems.push('Sayt yoki baza javob bermayapti');}
try{const processes=JSON.parse(run('pm2',['jlist']).toString());const worker=processes.find(x=>x.name==='FlowKey-worker');if(!worker||worker.pm2_env.status!=='online')problems.push('Worker to‘xtagan');
 const log=run('tail',['-c','8192','/home/deploy/.pm2/logs/FlowKey-worker-out.log']).toString().trim().split('\n').reverse();const last=log.map(l=>{try{return JSON.parse(l);}catch{return {};}}).find(x=>x.event==='worker.heartbeat');if(!last||Date.now()-Date.parse(last.at)>180000)problems.push('Worker heartbeat eskirgan');}catch{problems.push('Worker holati tekshirilmadi');}
const backup=readJson(root+'/reliability/backup.json');if(!backup?.ok||!Number.isFinite(Date.parse(backup.at))||Date.now()-Date.parse(backup.at)>8*3600000)problems.push('Backup 8 soatdan eski yoki yo‘q');
const restore=readJson(root+'/reliability/restore.json');if(!restore?.ok||!Number.isFinite(Date.parse(restore.at))||Date.now()-Date.parse(restore.at)>8*86400000)problems.push('Tiklash sinovi 8 kundan eski yoki yo‘q');
const path=root+'/reliability/monitor.json';const previous=readJson(path,{});const {state,kind}=nextIncident(previous,problems.length>0);
if(kind){
 const token=process.env.TELEGRAM_BOT_TOKEN,chat=process.env.TELEGRAM_ADMIN_CHAT_ID;
 if(token&&chat){try{const response=await fetch(`https://api.telegram.org/bot${token}/sendMessage`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({chat_id:chat,text:kind==='failure'?'FlowKey monitoring: '+problems.join('; ')+'.':'FlowKey monitoring: sayt, worker va backup tekshiruvlari yana me’yorda.'}),signal:AbortSignal.timeout(10000)});const result=await response.json();if(response.ok&&result.ok)Object.assign(state,markSent(state,kind));}catch{}}
}
writeJson(path,{...state,at:new Date().toISOString(),ok:problems.length===0,problems});console.log(JSON.stringify({event:'monitor.completed',ok:problems.length===0,problemCount:problems.length,notificationDue:!!kind}));
if(problems.length)process.exitCode=1;

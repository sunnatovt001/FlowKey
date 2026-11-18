import {setup} from './common.mjs';
setup();const token=process.env.TELEGRAM_BOT_TOKEN,chat=process.env.TELEGRAM_ADMIN_CHAT_ID;
if(!token||!chat)throw Error('Admin Telegram is not configured');
const response=await fetch(`https://api.telegram.org/bot${token}/sendMessage`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({chat_id:chat,text:'FlowKey monitoring sinovi: bu sinov xabari. Sayt, worker va backup kuzatuvi yoqildi. Haqiqiy nosozlik emas.'}),signal:AbortSignal.timeout(10000)});
const result=await response.json();if(!response.ok||!result.ok)throw Error('Monitoring test notice not delivered');console.log('Monitoring test notice delivered to configured admin');

import {createHash,randomBytes} from 'node:crypto';
import {readFileSync,realpathSync,readdirSync} from 'node:fs';
import {join} from 'node:path';
import {root,setup,database,pgClient,pgArgs,pgEnv,run,writeJson,quote} from './common.mjs';
setup();
const dir=realpathSync(root+'/backups');const requested=process.argv[2]||readdirSync(dir).filter(x=>/^scheduled-\d{8}T\d{9}Z\.dump$/.test(x)).sort().at(-1);
if(!requested||!/^scheduled-\d{8}T\d{9}Z\.dump$/.test(requested))throw Error('A scheduled backup name is required');
const file=realpathSync(join(dir,requested));if(!file.startsWith(dir+'/'))throw Error('Backup outside expected directory');
const m=JSON.parse(readFileSync(file+'.json','utf8'));if(createHash('sha256').update(readFileSync(file)).digest('hex')!==m.sha256)throw Error('Backup checksum mismatch');
const source=database(),name='flowkey_restore_'+Date.now()+'_'+randomBytes(4).toString('hex');
const adminUrl=new URL(source);adminUrl.pathname='/postgres';const admin=pgClient(adminUrl);await admin.connect();let created=false,restored,elevated=false;
try{
 try {await admin.query('CREATE DATABASE '+quote(name));} catch(error) {if(error.code!=='42501')throw error;run('sudo',['-n','-u','postgres','createdb','--owner',decodeURIComponent(source.username),'--',name]);elevated=true;}created=true;
 const target=new URL(source);target.pathname='/'+name;
 run('pg_restore',[...pgArgs(target),'--no-owner','--no-privileges','--exit-on-error',file],pgEnv(target));
 restored=pgClient(target);await restored.connect();
 for(const [table,count] of Object.entries(m.tables)){const n=(await restored.query('SELECT count(*)::text AS n FROM public.'+quote(table))).rows[0].n;if(n!==count)throw Error('Restored count mismatch');}
 const report={ok:true,at:new Date().toISOString(),backup:requested,tables:Object.keys(m.tables).length,checksumVerified:true,temporaryDatabaseRemoved:false};
 await restored.end();restored=null;
 if(elevated)run('sudo',['-n','-u','postgres','dropdb','--',name]);else await admin.query('DROP DATABASE '+quote(name));created=false;report.temporaryDatabaseRemoved=true;writeJson(root+'/reliability/restore.json',report);console.log(JSON.stringify({event:'restore.completed',...report}));
}finally{
 if(restored)await restored.end().catch(()=>{});
 if(created&&/^flowkey_restore_\d+_[a-f0-9]{8}$/.test(name)&&name!==source.pathname.slice(1)){if(elevated)run('sudo',['-n','-u','postgres','dropdb','--',name]);else await admin.query('DROP DATABASE '+quote(name));}
 await admin.end();
}

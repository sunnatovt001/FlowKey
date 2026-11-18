import {createHash} from 'node:crypto';
import {readFileSync,renameSync,unlinkSync,readdirSync,statSync} from 'node:fs';
import {join} from 'node:path';
import {root,setup,database,pgClient,pgArgs,pgEnv,run,writeJson,quote} from './common.mjs';
setup();
const dir=root+'/backups',stamp=new Date().toISOString().replace(/[-:.]/g,''),name='scheduled-'+stamp+'.dump',file=join(dir,name);
const u=database(),client=pgClient(u);await client.connect();
try{
 await client.query('BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY');
 const snapshot=(await client.query('SELECT pg_export_snapshot() AS id')).rows[0].id;
 const tables=(await client.query("SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY tablename")).rows;
 const counts={};for(const {tablename} of tables)counts[tablename]=(await client.query('SELECT count(*)::text AS n FROM public.'+quote(tablename))).rows[0].n;
 run('pg_dump',[...pgArgs(u),'-Fc','--snapshot='+snapshot,'-f',file+'.partial'],pgEnv(u));
 run('pg_restore',['--list',file+'.partial']);
 await client.query('COMMIT');renameSync(file+'.partial',file);
 const manifest={version:1,file:name,createdAt:new Date().toISOString(),sha256:createHash('sha256').update(readFileSync(file)).digest('hex'),bytes:statSync(file).size,tables:counts};
 writeJson(file+'.json',manifest);writeJson(root+'/reliability/backup.json',{ok:true,at:manifest.createdAt,file:name,bytes:manifest.bytes});
 // Delete only scheduled backups owned by this job after a new complete backup exists.
 for(const entry of readdirSync(dir))if(/^scheduled-\d{8}T\d{9}Z\.dump(?:\.json)?$/.test(entry)&&Date.now()-statSync(join(dir,entry)).mtimeMs>14*86400000)unlinkSync(join(dir,entry));
 console.log(JSON.stringify({event:'backup.completed',file:name,bytes:manifest.bytes,tables:tables.length}));
}catch{await client.query('ROLLBACK').catch(()=>{});try{unlinkSync(file+'.partial');}catch{};console.error('Backup failed; previous backups retained');process.exitCode=1;}finally{await client.end();}

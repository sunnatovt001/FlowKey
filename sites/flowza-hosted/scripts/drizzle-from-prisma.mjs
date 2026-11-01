import fs from 'node:fs';
const source=fs.readFileSync('prisma/schema.prisma','utf8');
let output="import {sqliteTable,text,integer,uniqueIndex,index} from 'drizzle-orm/sqlite-core';\nimport {sql} from 'drizzle-orm';\n";
for(const match of source.matchAll(/model (\w+) \{([\s\S]*?)\n\}/g)){
 const [,name,body]=match;const fields=[],constraints=[];
 for(const line of body.split('\n')){const m=line.trim().match(/^(\w+)\s+(String|Int|DateTime|Json)(\??)\s*(.*)$/);if(!m)continue;const [,key,type,optional,rest]=m;
 let field=type==='Int'?`integer('${key}')`:`text('${key}')`;
 if(rest.includes('@id'))field+='.primaryKey()';if(!optional&&!rest.includes('@id'))field+='.notNull()';if(rest.includes('@unique'))field+='.unique()';
 if(rest.includes('@default(now())'))field+='.default(sql`CURRENT_TIMESTAMP`)';else {const def=rest.match(/@default\(("[^"]*"|\d+)\)/);if(def)field+=`.default(${def[1]})`;}
 const relation=body.split('\n').find(l=>l.includes(`fields: [${key}]`));if(relation){const ref=relation.trim().match(/^\w+\s+(\w+).*references: \[(\w+)\]/);if(ref)field+=`.references(()=>${ref[1]}.${ref[2]},{onDelete:'cascade'})`;}
 fields.push(`  ${key}:${field}`);
 }
 for(const m of body.matchAll(/@@(unique|index|id)\(\[([^\]]+)\]\)/g)){const keys=m[2].split(',').map(v=>v.trim());constraints.push(`${m[1]==='index'?'index':'uniqueIndex'}('${name}_${keys.join('_')}_${m[1]}').on(${keys.map(k=>'t.'+k).join(',')})`);}
 output+=`export const ${name}=sqliteTable('${name}',{\n${fields.join(',\n')}\n}${constraints.length?`,t=>[${constraints.join(',')}]`:''});\n`;
}
fs.writeFileSync('db/schema.ts',output);

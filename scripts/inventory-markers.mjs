import { readdir,readFile,mkdir,writeFile } from 'node:fs/promises';
const found=[];
async function walk(folder){for(const entry of await readdir(folder,{withFileTypes:true})){
 const path=folder+'/'+entry.name;if(entry.isDirectory()){if(!['.temp','.branches'].includes(entry.name))await walk(path);continue;}
 if(!/\.(?:tsx?|jsx?|mjs|sql|md|json|csv|html|txt|toml)$/.test(path))continue;
 const text=await readFile(path,'utf8');for(const [offset,line] of text.split('\n').entries()){
  const terms=[...new Set([...line.matchAll(/TODO|FIXME|TBD|lorem|placeholder|example\.com/gi)].map(m=>m[0].toLowerCase()))];
  if(terms.length)found.push({path,line:offset+1,terms});
 }
}}
for(const folder of ['src','scripts','supabase','docs','data','public'])await walk(folder);
await mkdir('.artifacts/launch',{recursive:true});await writeFile('.artifacts/launch/placeholder-inventory.json',JSON.stringify({utc:new Date().toISOString(),matches:found},null,2)+'\n');
for(const match of found)console.log(JSON.stringify(match));
console.log('Marker inventory only. HTML input/CSS attributes, validator identifiers, third-party reports/provider annotations and historical applied SQL are not current citation stubs. npm run data:validate is the blocking shipped-data gate.');

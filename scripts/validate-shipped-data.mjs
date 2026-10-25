import { readdir,readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
export function findPlaceholders(value) {
 return /\b(?:TO\x44O|FIX\x4dE)\s*:\s*(?:exact|citation|source)|\blorem\s+ipsum\b|\bTBD\b|\bexample\.com\b|\[exact citation pending\]/i.test(value);
}
export async function validateShippedData() {
 const findings=[];
 async function walk(folder){for(const entry of await readdir(folder,{withFileTypes:true})){
  const path=folder+'/'+entry.name;if(entry.isDirectory())await walk(path);
  else if(/\.(?:json|csv|tsx?|jsx?|html|md|txt)$/i.test(path) && findPlaceholders(await readFile(path,'utf8'))) findings.push(path);
 }}
 for(const folder of ['src','public','data/processed'])await walk(folder);
 const weather=JSON.parse(await readFile('public/api/v2/weather.json','utf8'));
 if(!['available-context-only','unavailable'].includes(weather.status)) findings.push('public/api/v2/weather.json: unsupported status');
 const evidence=JSON.parse(await readFile('public/api/v2/manila.json','utf8'));
 if(evidence.version!==2 || evidence.historical_only!==true || evidence.community_included!==false) findings.push('public/api/v2/manila.json: historical isolation');
 if(!evidence.series?.M?.length || !evidence.series?.Z?.length) findings.push('public/api/v2/manila.json: missing scenarios');
 if(findings.length)throw Error('Shipped data validation failed: '+findings.join(', '));
 console.log('PASS: shipped data has both scenarios, historical isolation, valid weather status and no blocked attribution/filler text.');
}
if(process.argv[1] && import.meta.url===pathToFileURL(process.argv[1]).href){try{await validateShippedData();}catch(error){console.error(error.message);process.exitCode=1;}}

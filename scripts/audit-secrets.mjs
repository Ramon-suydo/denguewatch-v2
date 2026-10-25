import { execFileSync } from 'node:child_process';
import { mkdir,readFile,writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { inflateRawSync } from 'node:zlib';
import { pathToFileURL } from 'node:url';
import { exposedCredentialFingerprints } from './lib/hosted.mjs';
const git=(...args)=>execFileSync('git',args,{maxBuffer:256*1024*1024});
const patterns=[
 ['private-key',/-----BEGIN (?:RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----/],
 ['github-token',/\b(?:gh[pousr]_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{40,})\b/],
 ['supabase-secret',/\bsb_secret_[A-Za-z0-9_-]{15,}\b/],
 ['aws-access-key',/\b(?:AKIA|ASIA)[A-Z0-9]{16}\b/],
 ['database-password',/postgres(?:ql)?:\/\/[^:\s]+:([^@\s]+)@/g],
 ['private-api-token',/\bsk-[A-Za-z0-9_-]{20,}\b/],
];
const configuredPrivateValues=[];
for(const [key,value] of Object.entries(process.env)){
 if(!value || key.startsWith('VITE_') || !/PASSWORD|SECRET|TOKEN|DATABASE_URL|SERVICE_ROLE/.test(key))continue;
 if(value.length>=16 && !/^(true|false)$/.test(value))configuredPrivateValues.push(value);
 try{const password=decodeURIComponent(new URL(value).password);if(password.length>=8)configuredPrivateValues.push(password);}catch{}
}
function scanZip(buffer,depth){
 if(depth>3)return ['unscannable-archive'];
 try{
  let end=-1;for(let i=buffer.length-22;i>=Math.max(0,buffer.length-65557);i--)if(buffer.readUInt32LE(i)===0x06054b50){end=i;break;}
  if(end<0)return ['unscannable-archive'];
  const count=buffer.readUInt16LE(end+10);let offset=buffer.readUInt32LE(end+16),expanded=0;const findings=[];
  for(let i=0;i<count;i++){
   if(buffer.readUInt32LE(offset)!==0x02014b50)throw Error();
   const flags=buffer.readUInt16LE(offset+8),method=buffer.readUInt16LE(offset+10),compressed=buffer.readUInt32LE(offset+20),size=buffer.readUInt32LE(offset+24),namesize=buffer.readUInt16LE(offset+28),extra=buffer.readUInt16LE(offset+30),comment=buffer.readUInt16LE(offset+32),local=buffer.readUInt32LE(offset+42);
   const name=buffer.subarray(offset+46,offset+46+namesize).toString('utf8');offset+=46+namesize+extra+comment;
   if(name.endsWith('/'))continue;expanded+=size;if(flags&1 || expanded>100*1024*1024 || size>25*1024*1024)throw Error();
   if(name.split('/').some(x=>['..','.git','node_modules','certs'].includes(x)) || /(^|\/)\.env(?:\..*)?$/.test(name)&&!name.endsWith('.env.example'))findings.push('archive-prohibited-path:'+name);
   if(buffer.readUInt32LE(local)!==0x04034b50)throw Error();
   const start=local+30+buffer.readUInt16LE(local+26)+buffer.readUInt16LE(local+28),bytes=buffer.subarray(start,start+compressed);
   const content=method===0?bytes:method===8?inflateRawSync(bytes,{maxOutputLength:25*1024*1024}):null;
   if(!content || content.length!==size)throw Error();
   for(const kind of scanContent(content,depth+1))findings.push('archive-member:'+name+':'+kind);
  }
  return findings;
 }catch{return ['unscannable-archive'];}
}
export function scanContent(buffer,depth=0){
 if(buffer.length>=4 && buffer.readUInt32LE(0)===0x04034b50)return scanZip(buffer,depth);
 if(buffer.includes(0))return [];
 const content=buffer.toString('utf8'),found=new Set();
 if(configuredPrivateValues.some(value=>content.includes(value)))found.add('configured-private-value');
 for(const [kind,pattern] of patterns){pattern.lastIndex=0;for(const match of content.matchAll(new RegExp(pattern.source,pattern.flags.includes('g')?pattern.flags:pattern.flags+'g'))){
  if(kind==='database-password' && /^(?:password|YOUR_PASSWORD|\[.*\]|<.*>|example|test)$/i.test(match[1]))continue;found.add(kind);
 }}
 for(const token of content.match(/eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g)??[]){try{if(JSON.parse(Buffer.from(token.split('.')[1],'base64url')).role==='service_role')found.add('privileged-jwt');}catch{}}
 for(const word of content.match(/[A-Za-z0-9_-]{8,}/g)??[]){if(exposedCredentialFingerprints.includes(createHash('sha256').update(word).digest('hex')))found.add('known-exposure');}
 return [...found];
}
export async function audit(){
 const staged=process.argv.includes('--staged'),findings=[],history=[];
 const paths=git('ls-files',...(staged?['--cached']:['--cached','--others','--exclude-standard']),'-z').toString().split('\0').filter(Boolean);
 for(const path of paths){
  if((/(^|\/)\.env(?:\..*)?$/.test(path)&&!path.endsWith('.env.example'))||/(^|\/)certs\//.test(path)){findings.push({path,commit:'INDEX',kind:'prohibited-path'});continue;}
  let data;try{data=staged?git('show',':'+path):await readFile(path);}catch{continue;}
  for(const kind of scanContent(data))findings.push({path,commit:staged?'INDEX':'WORKTREE',kind});
 }
 if(!staged){
  const objects=git('rev-list','--objects','--all').toString().trim().split('\n');
  const input=objects.map(x=>x.split(' ')[0]).join('\n')+'\n';
  const batch=execFileSync('git',['cat-file','--batch'],{input,maxBuffer:512*1024*1024});let offset=0;
  for(const line of objects){
   const end=batch.indexOf(10,offset),header=batch.subarray(offset,end).toString().split(' '),size=Number(header[2]);offset=end+1;
   const data=batch.subarray(offset,offset+size);offset+=size+1;if(header[1]!=='blob')continue;
   const path=line.slice(line.indexOf(' ')+1),kinds=scanContent(data);
   if((/(^|\/)\.env(?:\..*)?$/.test(path)&&!path.endsWith('.env.example'))||/(^|\/)certs\//.test(path))kinds.push('prohibited-path');
   if(!kinds.length)continue;
   let commit='NOT VERIFIED';
   for(const candidate of git('log','--all','--find-object='+header[0],'--format=%H','--',path).toString().trim().split('\n').filter(Boolean)){
    try{if(git('rev-parse',candidate+':'+path).toString().trim()===header[0]){commit=candidate;break;}}catch{}
   }
   for(const kind of kinds)history.push({path,commit,kind});
  }
 }
 const unexpectedHistory=history.filter(x=>x.kind!=='known-exposure');
 const rotationPending=history.some(x=>x.kind==='known-exposure')&&process.env.CREDENTIALS_ROTATED!=='1';
 const report={scope:staged?'Staged index':'Current tracked worktree plus all reachable history',current_findings:findings,historical_findings:history,rotation_attested:process.env.CREDENTIALS_ROTATED==='1',rotation_live_verification:'Separate gate: npm run credentials:verify. An attestation is not proof of hosted revocation.',private_guard_configured:exposedCredentialFingerprints.length>0,passed:exposedCredentialFingerprints.length>0&&!findings.length&&!unexpectedHistory.length&&!rotationPending};
 await mkdir('.artifacts',{recursive:true});await writeFile('.artifacts/secrets-audit'+(staged?'-staged':'')+'.json',JSON.stringify(report,null,2)+'\n');
 // Only paths and commit references for matches. Never print a matching string or patch.
 for(const f of [...findings,...history])console.log(JSON.stringify({path:f.path,commit:f.commit}));
 console.log(JSON.stringify({private_guard_configured:report.private_guard_configured,current_findings:findings.length,historical_findings:history.length,unexpected_historical_findings:unexpectedHistory.length,rotation_status:rotationPending?'NEEDS OWNER':'Attested or no known exposure',passed:report.passed}));
 if(!report.passed)process.exitCode=1;
}
if(process.argv[1] && import.meta.url===pathToFileURL(process.argv[1]).href){try{await audit();}catch{console.error('Secret audit could not complete. No matching values or patches printed. Check Git access and private guard configuration.');process.exitCode=1;}}

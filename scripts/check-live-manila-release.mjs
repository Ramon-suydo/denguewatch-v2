import {spawn,spawnSync} from 'node:child_process';
import {openSync,closeSync,readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs';
import {resolve} from 'node:path';
const folder='.artifacts/live-manila',port=43328;mkdirSync(folder,{recursive:true});
const server=spawn(process.execPath,['node_modules/vite/bin/vite.js','preview','--host','127.0.0.1','--port',String(port),'--strictPort'],{stdio:'ignore'});
function run(name,program,args,extra={}){
 const file=folder+'/checks.json',manifest=JSON.parse(readFileSync(file,'utf8')),log=folder+'/'+name+'-'+String(manifest.results.length+1).padStart(3,'0')+'.log',fd=openSync(log,'w'),start=new Date().toISOString();
 console.log('Starting '+name);const result=spawnSync(program,args,{env:{...process.env,...extra},shell:program.endsWith('.cmd'),stdio:['ignore',fd,fd]});closeSync(fd);
 const row={name,node:process.version,command:[program,...args],start,end:new Date().toISOString(),exit_code:result.status,signal:result.signal,log};manifest.results.push(row);writeFileSync(file,JSON.stringify(manifest,null,2)+'\n');console.log(JSON.stringify(row));if(result.status!==0){console.log(readFileSync(log,'utf8').slice(-3500));throw Error(name+' failed');}
}
try{
 let ready=false;for(let i=0;i<120;i++){try{if((await fetch(`http://127.0.0.1:${port}/healthz.txt`)).ok){ready=true;break;}}catch{}await new Promise(r=>setTimeout(r,250));}if(!ready)throw Error('Production preview readiness failed');
 run('lighthouse',process.platform==='win32'?'npm.cmd':'npm',['exec','--yes','--package=node@22','--package=lighthouse@13','--','node','scripts/audit-lighthouse.mjs',`http://127.0.0.1:${port}/`]);
 const java=resolve('.artifacts/launch/tools/jdk-17.0.20.1+1-jre/bin/java.exe'),jar=resolve('.artifacts/launch/tools/ZAP_2.17.0/zap-2.17.0.jar');if(!existsSync(java)||!existsSync(jar))throw Error('Local Java17/ZAP prerequisite unavailable; no scan success claimed');
 run('zap',process.execPath,['scripts/scan-zap.mjs',`http://127.0.0.1:${port}/`],{JAVA_BIN:java,ZAP_JAR:jar});
}finally{server.kill();}

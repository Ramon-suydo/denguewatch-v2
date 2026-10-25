import { spawnSync } from 'node:child_process';
import { mkdir,writeFile,readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
const value=process.argv[2] || process.env.ZAP_TARGET_URL;
if(!value)throw Error('NEEDS OWNER: set repository variable DEPLOYED_URL, or pass an authorized target URL.');
const url=new URL(value);if(!['http:','https:'].includes(url.protocol)||url.username||url.password)throw Error('Use an HTTP(S) target without credentials.');
const output=resolve('docs/evidence');await mkdir(output,{recursive:true});
const local=['localhost','127.0.0.1','[::1]'].includes(url.hostname),stem=local?'zap-local':'zap-baseline';
let result;
if(process.env.ZAP_JAR){
 const home=resolve('.artifacts/zap-home');await mkdir(home,{recursive:true});
 const pages=['/','/trends','/metro-manila','/methodology','/prevention','/report','/community','/privacy','/terms','/legal','/data-sources','/admin','/api/v2/manila.json','/api/v2/ncr.json','/api/v2/environment.json','/api/v2/weather.json'];
 const plan={env:{contexts:[{name:'authorized-public-target',urls:[url.origin]}],parameters:{failOnError:true,failOnWarning:false,progressToStdout:true}},jobs:[
 {type:'passiveScan-config',parameters:{maxAlertsPerRule:50,scanOnlyInScope:true}},
 {type:'requestor',requests:pages.map(path=>({url:new URL(path,url).toString(),method:'GET',responseCode:200}))},
 {type:'spider',parameters:{context:'authorized-public-target',maxDuration:1,maxDepth:3}},
 {type:'passiveScan-wait',parameters:{maxDuration:3}},
 {type:'report',parameters:{template:'traditional-html',reportDir:output,reportFile:stem,reportTitle:'Local passive ZAP baseline',displayReport:false}},
 {type:'report',parameters:{template:'traditional-json',reportDir:output,reportFile:stem,displayReport:false}},
 {type:'exitStatus',parameters:{errorLevel:'Medium',warnLevel:'Low'}}]};
 const path=resolve('.artifacts/zap-plan.yaml');await writeFile(path,JSON.stringify(plan,null,2));
 result=spawnSync(process.env.JAVA_BIN || 'java',['-Djava.awt.headless=true','-jar',resolve(process.env.ZAP_JAR),'-cmd','-dir',home,'-autorun',path],{stdio:'inherit',timeout:600000});
}else{
 result=spawnSync('docker',['run','--rm',...(local?['--network','host']:[]),'-v',`${output}:/zap/wrk/:rw`,'ghcr.io/zaproxy/zaproxy:stable','zap-baseline.py','-t',url.toString(),'-r',stem+'.html','-J',stem+'.json'],{stdio:'inherit',timeout:600000});
}
if(result.error){console.error('ZAP runtime failed or unavailable. No successful scan claimed. Configure Docker or JAVA_BIN and ZAP_JAR.');process.exitCode=1;}
else{
 try{
 const report=JSON.parse(await readFile(resolve(output,stem+'.json'),'utf8'));
 const alerts=(report.site??[]).flatMap(site=>site.alerts??[]),blocking=alerts.filter(alert=>Number(alert.riskcode)>=2);
 const summary={target:url.origin,utc:new Date().toISOString(),mode:'passive baseline; no active scan or authenticated coverage',runtime_exit_code:result.status,high_or_medium_alerts:blocking.length,low_or_info_alerts:alerts.length-blocking.length,passed:blocking.length===0&&[0,2].includes(result.status)};
 await writeFile(resolve(output,stem+'-summary.json'),JSON.stringify(summary,null,2)+'\n');console.log(JSON.stringify(summary));if(!summary.passed)process.exitCode=1;
 }catch{console.error('ZAP report missing/unreadable. Scan is NOT VERIFIED.');process.exitCode=1;}
}

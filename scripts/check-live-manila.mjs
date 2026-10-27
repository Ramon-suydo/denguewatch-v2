import {spawnSync} from 'node:child_process';
import {openSync,closeSync,readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs';
const folder='.artifacts/live-manila';mkdirSync(folder,{recursive:true});
const groups={
 focused:[['focused-unit',['node_modules/tsx/dist/cli.mjs','--test','tests/live-manila.test.ts']],['focused-browser',['node_modules/@playwright/test/cli.js','test','tests/ui/live-manila.spec.ts','--workers=1']],['focused-pixels',['node_modules/@playwright/test/cli.js','test','tests/ui/ml-map.spec.ts','--grep','rendered map pixels','--workers=1']]],
 core:[['ingestion',['node_modules/tsx/dist/cli.mjs','scripts/ingest_live_manila.ts']],['typecheck',['node_modules/typescript/bin/tsc','--noEmit']],['lint',['node_modules/eslint/bin/eslint.js','src','scripts','tests','vite.config.ts','playwright.config.ts','--max-warnings','0']],['unit',['node_modules/tsx/dist/cli.mjs','--test','--test-concurrency=1',...JSON.parse(readFileSync('package.json')).scripts.test.split(' ').slice(3)]],['live-data-validation',['node_modules/tsx/dist/cli.mjs','scripts/check-live-manila-data.ts']],['data-validation',['scripts/validate-shipped-data.mjs']],['credits',['scripts/check-credits.mjs']],['contrast',['scripts/check-contrast.mjs']],['hero-contrast',['scripts/check-hero-contrast.mjs']],['build',['node_modules/vite/bin/vite.js','build']],['prerender',['scripts/prerender-shell.mjs']],['pwa-build',['scripts/build-pwa.mjs']],['budget',['scripts/check-ui-budget.mjs']]],
 browser:[['browser',['node_modules/@playwright/test/cli.js','test','--workers=1']]],
 production:[['production',['node_modules/@playwright/test/cli.js','test','--config','playwright.research.config.ts','--workers=1']],['pwa',['node_modules/@playwright/test/cli.js','test','--config','playwright.production.config.ts','--workers=1']]],
 visual_update:[['visual-baselines',['node_modules/@playwright/test/cli.js','test','--config','playwright.visual.config.ts','--workers=1','--update-snapshots']]],
 visual:[['visual',['node_modules/@playwright/test/cli.js','test','--config','playwright.visual.config.ts','--workers=1']]],
 tools:[['lint-final',['node_modules/eslint/bin/eslint.js','src','scripts','tests','vite.config.ts','playwright.config.ts','--max-warnings','0']],['typecheck-final',['node_modules/@typescript/native/bin/tsc','--noEmit']]],
 compat:[['compat',['scripts/check-live-manila-browsers.mjs']]],
 security:[['npm-audit',null],['secrets',['scripts/audit-secrets.mjs']]],
};
// npm's tsc shim points at the aliased TypeScript 7 package in this project.
groups.core.find(([name])=>name==='typecheck')[1][0]='node_modules/@typescript/native/bin/tsc';
const selected=groups[process.argv[2]];if(!selected)throw Error('Use focused, core, browser, production, visual or security.');
const manifest=existsSync(folder+'/checks.json')?JSON.parse(readFileSync(folder+'/checks.json')):{node:process.version,platform:process.platform,results:[]};
for(const [name,args] of selected){
 const path=folder+'/'+name+'-'+String(manifest.results.length+1).padStart(3,'0')+'.log',fd=openSync(path,'w'),start=new Date().toISOString();
 console.log('Starting '+name);const command=args?[process.execPath,...args]:['npm','audit','--json'];
 const result=spawnSync(args?process.execPath:process.platform==='win32'?'npm.cmd':'npm',args??['audit','--json'],{shell:!args&&process.platform==='win32',env:{...process.env,PLAYWRIGHT_CHANNEL:process.env.PLAYWRIGHT_CHANNEL||'chrome',PLAYWRIGHT_PORT:process.env.PLAYWRIGHT_PORT||'43318'},stdio:['ignore',fd,fd]});
 closeSync(fd);const row={name,node:process.version,command,start,end:new Date().toISOString(),exit_code:result.status,signal:result.signal,log:path};
 manifest.results.push(row);writeFileSync(folder+'/checks.json',JSON.stringify(manifest,null,2)+'\n');console.log(JSON.stringify(row));
 if(result.status!==0){console.log(readFileSync(path,'utf8').slice(-5000));process.exitCode=result.status||1;break;}
}

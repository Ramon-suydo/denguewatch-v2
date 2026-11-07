import {spawnSync} from 'node:child_process';
import {openSync,closeSync,readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs';
const folder='.artifacts/expanded-manila';mkdirSync(folder,{recursive:true});
const group=process.argv[2]||'core';
const jobs={
 core:[['count-tests',['scripts/expanded-count.mjs','test']],['artifact-check',['scripts/check-expanded-count.mjs']],
 ['types',['node_modules/@typescript/native/bin/tsc','--noEmit']],['lint',['node_modules/eslint/bin/eslint.js','src','scripts','tests','vite.config.ts','playwright.config.ts','--max-warnings','0']],
 ['unit',['node_modules/tsx/dist/cli.mjs','--test','--test-concurrency=1',...JSON.parse(readFileSync('package.json','utf8')).scripts.test.split(' ').slice(3)]],
 ['protected-live',['node_modules/tsx/dist/cli.mjs','scripts/check-live-manila-data.ts']],['shipped-data',['scripts/validate-shipped-data.mjs']],['credits',['scripts/check-credits.mjs']],
 ['contrast',['scripts/check-contrast.mjs']],['hero-contrast',['scripts/check-hero-contrast.mjs']],['build',['node_modules/vite/bin/vite.js','build']],['prerender',['scripts/prerender-shell.mjs']],['pwa-build',['scripts/build-pwa.mjs']],['budget',['scripts/check-ui-budget.mjs']]],
 focused:[['expanded-browser',['node_modules/@playwright/test/cli.js','test','tests/ui/expanded-research.spec.ts','--workers=1']]],
 browser:[['all-browser',['node_modules/@playwright/test/cli.js','test','--workers=1']]],
 production:[['production',['node_modules/@playwright/test/cli.js','test','--config','playwright.research.config.ts','--workers=1']],['pwa',['node_modules/@playwright/test/cli.js','test','--config','playwright.production.config.ts','--workers=1']]],
 visual:[['visual',['node_modules/@playwright/test/cli.js','test','--config','playwright.visual.config.ts','--workers=1']]],
 visual_model_update:[['visual-model-update',['node_modules/@playwright/test/cli.js','test','--config','playwright.visual.config.ts','--grep','model [0-9]','--workers=1','--update-snapshots']]],
};
jobs.release=jobs.core.filter(([name])=>!['count-tests','unit','hero-contrast'].includes(name));
if(!jobs[group])throw Error('Unknown check group.');
const path=folder+'/checks.json';const manifest=existsSync(path)?JSON.parse(readFileSync(path,'utf8')):{node:process.version,results:[]};
for(const [name,args] of jobs[group]){
 const log=folder+'/'+name+'-'+String(manifest.results.length+1).padStart(3,'0')+'.log';const fd=openSync(log,'w');
 const start=new Date().toISOString();console.log('Starting '+name);
 const result=spawnSync(process.execPath,args,{env:{...process.env,PLAYWRIGHT_CHANNEL:process.env.PLAYWRIGHT_CHANNEL||'chrome',PLAYWRIGHT_PORT:process.env.PLAYWRIGHT_PORT||'43418'},stdio:['ignore',fd,fd]});closeSync(fd);
 const row={name,command:[process.execPath,...args],port:process.env.PLAYWRIGHT_PORT||'43418',start,end:new Date().toISOString(),exit_code:result.status,log};
 const latest=existsSync(path)?JSON.parse(readFileSync(path,'utf8')):manifest;latest.results.push(row);manifest.results=latest.results;writeFileSync(path,JSON.stringify(latest,null,2)+'\n');console.log(JSON.stringify(row));
 if(result.status!==0){console.log(readFileSync(log,'utf8').slice(-6000));process.exitCode=result.status||1;break;}
}

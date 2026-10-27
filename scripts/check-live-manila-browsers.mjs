import {chromium,firefox,webkit} from '@playwright/test';
import {spawn} from 'node:child_process';
import {writeFile,mkdir} from 'node:fs/promises';
import assert from 'node:assert/strict';
const port=43271,results=[],folder='.artifacts/live-manila/compat';
await mkdir(folder,{recursive:true});
const server=spawn(process.execPath,['node_modules/vite/bin/vite.js','--host','127.0.0.1','--port',String(port),'--strictPort'],{env:{...process.env,VITE_TEST_FIXTURES:'false',VITE_SUPABASE_URL:'https://denguewatch-tests.invalid',VITE_SUPABASE_ANON_KEY:'isolated-public-test-key'},stdio:'ignore'});
try{
 let ready=false;for(let i=0;i<120;i++){try{if((await fetch('http://127.0.0.1:'+port+'/healthz.txt')).ok){ready=true;break;}}catch{}await new Promise(r=>setTimeout(r,250));}assert.ok(ready,'Compatibility server ready');
 for(const [name,type,options] of [['Chrome',chromium,{channel:'chrome'}],['Edge',chromium,{channel:'msedge'}],['Firefox',firefox,{}],['WebKit',webkit,{}]]){
  let browser;const result={browser:name,status:'NOT VERIFIED',cases:0,version:null,error:null};
  try{
   browser=await type.launch({headless:true,...options});result.version=browser.version();const page=await browser.newPage({reducedMotion:'reduce',serviceWorkers:'block'}),errors=[];
   await page.clock.setFixedTime(new Date('2026-10-28T04:00:00Z'));page.on('pageerror',e=>errors.push(e.message));
   await page.route('**/*',r=>{const url=new URL(r.request().url());if(url.hostname==='127.0.0.1')return r.continue();if(url.pathname.endsWith('/published_manila_live_input'))return r.fulfill({status:200,json:null});if(url.pathname.endsWith('/reporting_v2_policy'))return r.fulfill({status:200,json:{enabled:false,consent_version:'community-v2'}});return r.abort();});
   for(const width of [360,1280])for(const theme of ['day','night'])for(const [routeName,path] of [['dashboard','/'],['map','/risk-map'],['report','/report'],['about','/about'],['model','/our-model']]){
    await page.setViewportSize({width,height:1000});await page.goto('http://127.0.0.1:'+port+path);await page.getByLabel('Appearance',{exact:true}).selectOption(theme);await page.getByRole('heading',{level:1}).waitFor();
    if(path==='/')await page.locator('[data-manila-prediction]').waitFor();if(path==='/our-model')await page.locator('.model-example').waitFor();if(path==='/risk-map')await page.locator('.city-picker button').first().waitFor();
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),routeName+' overflow '+width);await page.getByRole('button',{name:'Filipino',exact:true}).click();assert.equal(await page.locator('html').getAttribute('lang'),'fil');await page.getByRole('button',{name:'English',exact:true}).click();
    await page.screenshot({path:`${folder}/${name}-${routeName}-${width}-${theme}.png`});result.cases++;
   }
   for(const width of [360,1280])for(const theme of ['day','night'])for(const [routeName,path] of [['dashboard','/'],['map','/risk-map']]){
    await page.setViewportSize({width,height:1000});await page.goto('http://127.0.0.1:'+port+path);await page.getByLabel('Appearance',{exact:true}).selectOption(theme);
    const scope=path==='/'?page.getByRole('group',{name:'Manila Replay or Live',exact:true}):page.locator('.forecast-mode');await scope.getByRole('button',{name:'Live',exact:true}).click();await page.locator('[data-live-count]').waitFor();assert.equal(await page.locator('[data-live-count]').textContent(),'226');assert.equal(await page.locator('[data-live-bar]').count(),13);assert.equal(await page.locator('[data-estimated=true]').count(),9);assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Live overflow '+width);
    await page.screenshot({path:`${folder}/${name}-live-${routeName}-${width}-${theme}.png`});result.cases++;
   }
   assert.deepEqual(errors,[]);result.status='PASS';
  }catch(e){result.error=e.message;}finally{await browser?.close();results.push(result);console.log(JSON.stringify(result));}
 }
}finally{server.kill();await writeFile('docs/evidence/live-manila-browsers.json',JSON.stringify({node:process.version,scope:'Local installed Chrome/Edge and Playwright Firefox/WebKit; 20 unchanged public-page cases plus 8 Manila Live cases per engine. WebKit is not real iOS Safari/device verification.',results},null,2)+'\n');}
if(results.some(r=>r.status!=='PASS'))process.exitCode=1;

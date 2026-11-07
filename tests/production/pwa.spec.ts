import {readFile} from 'node:fs/promises';
import {goto,activeView} from '../support/active-view';
import { test, expect } from "@playwright/test";
test("production PWA isolates map caching, serves offline PMTiles ranges, and keeps reports map-free",async({page,context})=>{
 test.setTimeout(90000);const violations:string[]=[];await page.exposeFunction('recordOfflinePolicy',(directive:string)=>violations.push(directive));await page.addInitScript(()=>document.addEventListener('securitypolicyviolation',e=>{void (window as any).recordOfflinePolicy(e.violatedDirective);}));const mapRequests:string[]=[];page.on('request',r=>{if(/MapProvider|maplibre|\.pmtiles|openfreemap/.test(r.url()))mapRequests.push(r.url());});
 await page.route('https://tiles.openfreemap.org/**',r=>r.abort());await goto(page,'/');await expect(page.locator('[data-other-city]')).toHaveCount(16);
 await page.evaluate(async()=>{await navigator.serviceWorker.ready;if(!navigator.serviceWorker.controller)await new Promise<void>(r=>navigator.serviceWorker.addEventListener('controllerchange',()=>r(),{once:true}));});
 const cachePaths=()=>page.evaluate(async()=>(await Promise.all((await caches.keys()).filter(n=>n.startsWith('dw-research-')).map(async n=>(await(await caches.open(n)).keys()).map(r=>new URL(r.url).pathname)))).flat());
 let paths=await cachePaths();expect(paths.some(p=>p.includes('MapProvider')||p.endsWith('.pmtiles'))).toBe(false);expect(mapRequests).toEqual([]);
 await goto(page,'/report');await expect(page.getByRole('heading',{level:1})).toBeVisible();expect(mapRequests).toEqual([]);
 await goto(page,'/risk-map');await expect(page.locator('.city-picker button')).toHaveCount(17);await page.waitForFunction(()=>{const m=(document.querySelector('.city-map-canvas') as HTMLElement&{cityMap:any})?.cityMap;return m?.getLayer('ncr-fill')&&m.queryRenderedFeatures({layers:['ncr-fill']}).length>0;});
 const mapAssets=JSON.parse(await readFile('docs/evidence/ml-pwa-assets.json','utf8')).map_only_assets as string[];await expect.poll(async()=>{const paths=await cachePaths();return mapAssets.every(asset=>paths.includes(asset));}).toBe(true);
 await context.setOffline(true);await page.reload();await expect(page.locator('.city-picker button')).toHaveCount(17);await expect(page.locator('.basemap-indicator')).toContainText('offline');await page.waitForFunction(()=>{const m=(document.querySelector('.city-map-canvas') as HTMLElement&{cityMap:any})?.cityMap;return m?.getLayer('ncr-fill')&&m.queryRenderedFeatures({layers:['ncr-fill']}).length>0;});
 const range=await page.evaluate(async()=>{const r=await fetch('/basemap/metro-manila.pmtiles',{headers:{Range:'bytes=0-126'}});return {status:r.status,bytes:(await r.arrayBuffer()).byteLength,range:r.headers.get('Content-Range')};});expect(range).toEqual({status:206,bytes:127,range:'bytes 0-126/6712783'});await page.waitForFunction(()=>{const m=(document.querySelector('.city-map-canvas') as HTMLElement&{cityMap:any}).cityMap;return m.getLayer('ncr-city-labels')&&m.queryRenderedFeatures({layers:['ncr-city-labels']}).length>0;});
 mapRequests.length=0;await goto(page,'/report');await expect(page.getByText('We cannot confirm collection status.',{exact:true})).toBeVisible();await expect(page.getByRole('button',{name:'Submit community report'})).toHaveCount(0);expect(mapRequests).toEqual([]);
 expect(violations).toEqual([]);paths=await cachePaths();expect(paths.some(p=>p.startsWith('/admin')||p.includes('rest/v1')||p.startsWith('/img/source/'))).toBe(false);
});
test("production serves security headers and rejects fixture pages and legacy report preview", async ({
  page,
  request,
}) => {
  const response = await request.get("/");
  expect(response.headers()["content-security-policy"]).toContain(
    "script-src 'self'",
  );
  expect(response.headers()["content-security-policy"]).toContain(
    "frame-ancestors 'none'",
  );
  expect(response.headers()["x-content-type-options"]).toBe("nosniff");
  const manifest=JSON.parse(await readFile('docs/evidence/ml-pwa-assets.json','utf8'));const worker=manifest.map_only_assets.find((path:string)=>path.includes('/maplibre-gl-worker-'));expect(worker).toBeTruthy();const workerResponse=await request.get(worker);expect(workerResponse.headers()['content-security-policy']).toContain('https://tiles.openfreemap.org');expect(workerResponse.headers()['content-security-policy']).toContain("style-src-attr 'none'");const report=await request.get('/report');expect(report.headers()['content-security-policy']).not.toContain('tiles.openfreemap.org');
  for (const route of ["/dev", "/design", "/design-preview", "/dev/legacy-report"]) {
    await goto(page, route);
    await expect(
      activeView(page).getByRole("heading", { name: "Page not found" }),
    ).toBeVisible();
  }
});

test("production styles and public research charts comply with the strict CSP",async({page})=>{
 const violations:string[]=[];
 await page.exposeFunction('recordPolicyViolation',(directive:string)=>violations.push(directive));
 await page.addInitScript(()=>document.addEventListener('securitypolicyviolation',event=>{void (window as any).recordPolicyViolation(event.violatedDirective);}));
 for(const path of ['/','/risk-map','/report','/about','/trends','/methodology','/data-sources']){
  await goto(page, path);await expect(activeView(page).getByRole('heading',{level:1})).toBeVisible();
  if(path==='/methodology')await expect(activeView(page).getByRole('heading',{name:'How accurate is this?'})).toBeVisible();
  if(path==='/data-sources')await expect(page.locator('.coverage-present').first()).not.toHaveCSS('background-color','rgba(0, 0, 0, 0)');
 }
 expect(violations).toEqual([]);
});

test('public shell paints before the main bundle and hydrates saved preferences without errors',async({page,context,request})=>{const html=await (await request.get('/')).text();expect(html).toContain('<template id="dashboard-prerender">');expect(html).toContain('dashboard-title');const early=await context.newPage();const dataRequests:string[]=[];early.on('request',r=>{if(new URL(r.url()).pathname.startsWith('/ml/'))dataRequests.push(r.url());});await early.route('**/assets/index-*.js',r=>r.abort());await early.goto('/');await expect(early.locator('#dashboard-title')).toBeVisible();await expect(early.locator('[data-other-city]')).toHaveCount(0);expect(dataRequests).toEqual([]);await early.locator('#hero-city').fill('Makati');await early.getByRole('button',{name:/^Check my city/}).click();await expect(early).toHaveURL(/risk-map[?]city=Makati/);await early.unroute('**/assets/index-*.js');await early.reload();await expect(early.locator('.city-detail h2')).toHaveText('Makati');await early.close();const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error'&&/hydration|did not match|Minified React error/i.test(m.text()))errors.push(m.text());});await page.goto('/');await expect(page.locator('[data-other-city]')).toHaveCount(16);await page.evaluate(()=>{localStorage.setItem('dw-language','fil');localStorage.setItem('dw-theme','night');});await page.reload();await expect(page.locator('html')).toHaveAttribute('lang','fil');await expect(page.locator('html')).toHaveAttribute('data-theme','night');await expect(page.locator('[data-other-city]')).toHaveCount(16);expect(errors).toEqual([]);});

test('the separate model demo works offline after public shell warming without loading a map engine',async({page,context})=>{const engines:string[]=[];page.on('request',r=>{if(/MapProvider|maplibre|pmtiles|openfreemap/.test(r.url()))engines.push(r.url());});await goto(page,'/');await expect(page.locator('[data-manila-prediction]')).toBeVisible();await page.evaluate(async()=>{await navigator.serviceWorker.ready;if(!navigator.serviceWorker.controller)await new Promise<void>(resolve=>navigator.serviceWorker.addEventListener('controllerchange',()=>resolve(),{once:true}));});await context.setOffline(true);await goto(page,'/our-model');await expect(page.locator('.model-example')).toBeVisible();await page.getByLabel('NCR area',{exact:true}).selectOption('PASIG CITY');await expect(page.locator('.model-example')).toHaveAttribute('data-model-city','PASIG CITY');expect(engines).toEqual([]);});

test('expanded count evidence works offline without cached staff or hosted inputs',async({page,context})=>{
 await goto(page,'/');await expect(page.locator('[data-manila-prediction]')).toBeVisible();
 await page.evaluate(async()=>{await navigator.serviceWorker.ready;if(!navigator.serviceWorker.controller)await new Promise<void>(resolve=>navigator.serviceWorker.addEventListener('controllerchange',()=>resolve(),{once:true}));});
 await context.setOffline(true);await goto(page,'/expanded-model');
 await expect(page.getByRole('heading',{name:'Every raw file, with its own role',exact:true})).toBeVisible();
 await expect(page.getByRole('heading',{name:'What happened on the test data?',exact:true})).toBeVisible();
 await expect(page.locator('[data-expanded-horizon]')).toHaveCount(0);
});

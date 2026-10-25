import {goto,activeView} from '../support/active-view';
import { test, expect } from "@playwright/test";
test("production PWA isolates map caching, serves offline PMTiles ranges, and keeps reports map-free",async({page,context})=>{
 test.setTimeout(90000);const violations:string[]=[];await page.exposeFunction('recordOfflinePolicy',(directive:string)=>violations.push(directive));await page.addInitScript(()=>document.addEventListener('securitypolicyviolation',e=>{void (window as any).recordOfflinePolicy(e.violatedDirective);}));const mapRequests:string[]=[];page.on('request',r=>{if(/MapProvider|maplibre|\.pmtiles|openfreemap|ncr-cities\.geojson/.test(r.url()))mapRequests.push(r.url());});
 await page.route('https://tiles.openfreemap.org/**',r=>r.abort());await goto(page,'/');await expect(page.locator('.top-city-list li')).toHaveCount(3);
 await page.evaluate(async()=>{await navigator.serviceWorker.ready;if(!navigator.serviceWorker.controller)await new Promise<void>(r=>navigator.serviceWorker.addEventListener('controllerchange',()=>r(),{once:true}));});
 const cachePaths=()=>page.evaluate(async()=>(await Promise.all((await caches.keys()).filter(n=>n.startsWith('dw-research-')).map(async n=>(await(await caches.open(n)).keys()).map(r=>new URL(r.url).pathname)))).flat());
 let paths=await cachePaths();expect(paths.some(p=>p.includes('MapProvider')||p.endsWith('.pmtiles')||p.includes('ncr-cities'))).toBe(false);expect(mapRequests).toEqual([]);
 await goto(page,'/report');await expect(page.getByRole('heading',{level:1})).toBeVisible();expect(mapRequests).toEqual([]);
 await goto(page,'/risk-map');await expect(page.locator('.city-picker button')).toHaveCount(17);await page.waitForFunction(()=>{const m=(document.querySelector('.city-map-canvas') as HTMLElement&{cityMap:any})?.cityMap;return m?.getLayer('ncr-fill')&&m.queryRenderedFeatures({layers:['ncr-fill']}).length>0;});
 await expect.poll(async()=>(await cachePaths()).includes('/basemap/metro-manila.pmtiles')).toBe(true);
 await context.setOffline(true);await page.reload();await expect(page.locator('.city-picker button')).toHaveCount(17);await expect(page.locator('.basemap-indicator')).toContainText('offline');await page.waitForFunction(()=>{const m=(document.querySelector('.city-map-canvas') as HTMLElement&{cityMap:any})?.cityMap;return m?.getLayer('ncr-fill')&&m.queryRenderedFeatures({layers:['ncr-fill']}).length>0;});
 const range=await page.evaluate(async()=>{const r=await fetch('/basemap/metro-manila.pmtiles',{headers:{Range:'bytes=0-126'}});return {status:r.status,bytes:(await r.arrayBuffer()).byteLength,range:r.headers.get('Content-Range')};});expect(range).toEqual({status:206,bytes:127,range:'bytes 0-126/6712783'});
 mapRequests.length=0;await goto(page,'/report');await page.getByRole('checkbox').check();await expect(page.getByRole('button',{name:'Continue to report',exact:true})).toBeDisabled();expect(mapRequests).toEqual([]);
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
  for (const route of ["/dev", "/design-preview", "/dev/legacy-report"]) {
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

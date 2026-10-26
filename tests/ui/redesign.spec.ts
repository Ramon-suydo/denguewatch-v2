import {test,expect,type Page} from '@playwright/test';
import {readFile} from 'node:fs/promises';
import AxeBuilder from '@axe-core/playwright';
import {goto,activeView} from '../support/active-view';
import {mockPublicApi} from '../fixtures/public-fixtures';
const read=async(path:string)=>JSON.parse(await readFile(path,'utf8'));
async function openArchive(page:Page,path='/about?drawer=methods&section=dashboard'){await mockPublicApi(page,{open:false});const loaded=page.waitForResponse(async response=>new URL(response.url()).pathname==='/api/v2/manila.json'&&response.status()===200&&(await response.finished())===null);await goto(page,path);await loaded;}


test('three navigation destinations, footer attribution, empty owner fields and old-route drawers',async({page})=>{
 test.setTimeout(120000);
 for(const width of [360,1280])for(const path of ['/','/risk-map','/report','/about']){
  await page.setViewportSize({width,height:1000});await goto(page,path);
  if(width===360)await page.getByRole('button',{name:'Menu',exact:true}).click();
  const nav=page.getByRole('navigation',{name:'Main navigation'});
  await expect(nav.getByRole('link')).toHaveText(['Dashboard','Risk Map','Community Report']);
  await expect(nav.getByRole('link',{name:'About & Credits'})).toHaveCount(0);
  await expect(page.getByRole('contentinfo').getByRole('link',{name:'About & Credits'})).toHaveAttribute('href','/about');
  await expect(page.getByRole('contentinfo')).toContainText('Background photograph by Sumarie Slabber');
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  expect((await new AxeBuilder({page}).analyze()).violations.filter(v=>['critical','serious'].includes(v.impact??''))).toEqual([]);
 }
 await goto(page,'/about');await expect(page.locator('#team')).toHaveCount(0);
 await expect(page.locator('#image-credit')).toContainText('Background photograph by Sumarie Slabber');
 await expect(page.locator('#image-credit a')).toHaveCount(0);
 const software=await read('src/content/software-credits.json');
 await page.locator('#software summary').click();await expect(page.locator('#software tbody tr')).toHaveCount(software.length);
 await goto(page,'/');await page.getByRole('contentinfo').getByRole('button',{name:'About the data & methods',exact:true}).click();await activeView(page).getByRole('link',{name:'About & Credits',exact:true}).click();await expect(page).toHaveURL(/\/about$/);await expect(page.locator('dialog[open]')).toHaveCount(0);
 for(const old of ['/trends','/methodology','/data-sources','/prevention','/map','/privacy']){
  await goto(page,old);await expect(page).not.toHaveURL(new RegExp(old+'$'));
  await expect(page.locator('dialog[open]')).toBeVisible();
  await activeView(page).getByRole('button',{name:'Close dialog'}).click();
  await expect(page.locator('dialog[open]')).toHaveCount(0);
 }
});

test('city map uses all 17 explicit matches and exact saved probabilities, without national or weather data',async({page})=>{
 await mockPublicApi(page,{open:false});await page.route('https://tiles.openfreemap.org/**',r=>r.abort());
 const forbidden:string[]=[];page.on('request',r=>{if(/open-meteo|power\.larc|philippines\.geojson|outlook\.json/.test(r.url()))forbidden.push(r.url());});
 await goto(page,'/risk-map');const geo=await read('public/geo/ncr-cities.geojson'),crosswalk=await read('data/geo/ncr-ml-crosswalk.json'),saved=await read('public/ml/replay.json');
 expect(geo.features).toHaveLength(17);expect(crosswalk.rows).toHaveLength(17);expect(crosswalk.unmatched).toEqual([]);expect(new Set(crosswalk.rows.map((r:any)=>r.doh_name)).size).toBe(17);
 await expect(page.locator('.city-picker button')).toHaveCount(17);await expect(page.locator('.forecast-mode')).toContainText('Replay');await expect(page.getByRole('button',{name:'Live',exact:true})).toBeDisabled();
 await page.waitForFunction(()=>{const host=document.querySelector('.city-map-canvas') as HTMLElement&{cityMap?:{getSource:(id:string)=>{serialize:()=>{data:{features:unknown[]}}}|undefined;getLayer:(id:string)=>unknown;queryRenderedFeatures:(query:unknown)=>unknown[]}}|null;const map=host?.cityMap;return map?.getSource('ncr-risk')?.serialize().data.features.length===17&&map.getLayer('ncr-fill')&&map.queryRenderedFeatures({layers:['ncr-fill']}).length>0;});
 await page.getByRole('button',{name:'Show data table',exact:true}).click();const table=page.getByRole('region',{name:'City prediction data'});await expect(table.locator('tbody tr')).toHaveCount(17);
 const expected=saved.rows.filter((r:any)=>r.target===saved.weeks[0]);for(const r of expected)await expect(table.locator(`tr[data-city-row="${r.city}"]`)).toHaveAttribute('data-probability',String(r.probability));
 await page.getByLabel('Find a city',{exact:true}).fill('Manila');await expect(table.locator('tbody tr')).toHaveCount(1);await expect(table).toContainText('Manila');await expect(page.locator('.traffic-legend')).toContainText('Resolution: city.');expect(forbidden).toEqual([]);
});

test('Dashboard and Manila map panel expose saved MAEs and backtest values, with bilingual core pages and privacy',async({page})=>{
 const data=await read('public/api/v2/manila.json');
 for(const path of ['/about?drawer=methods&section=dashboard']){
  await openArchive(page,path);await expect(activeView(page).getByRole('heading',{name:'Current risk unavailable'})).toBeVisible();
  for(const h of [1,2]){const expected=data.summaries.find((r:any)=>r.scenario==='M'&&r.fold==='test-2018-2023'&&r.model==='naive'&&r.horizon===h).mae;await expect(page.locator(`[data-panel-horizon="${h}"]`)).toHaveAttribute('data-panel-mae',String(expected));}
 }
 for(const [path,heading] of [['/','Mga dapat bantayan'],['/risk-map','Mapa ng Panganib'],['/report','Unawain at pumayag']]){
  await goto(page,path);await page.getByRole('button',{name:'Filipino',exact:true}).click();await expect(page.getByRole('heading',{name:heading,exact:true})).toBeVisible();await expect(page.locator('html')).toHaveAttribute('lang','fil');
  await page.getByRole('button',{name:'English',exact:true}).click();
 }
 await page.getByRole('contentinfo').getByRole('button',{name:'Privacy notice',exact:true}).click();await expect(activeView(page)).toContainText('RA 10173');
 await expect(activeView(page)).toContainText('No system can promise perfect anonymity');
});


test('Dashboard numeric analytics reproduce published series, exact backtest rows and forecast values',async({page})=>{
 await openArchive(page);const data=await read('public/api/v2/manila.json'),backtest=await read('public/api/v2/dashboard.json');
 const format=(v:number,digits=1)=>v.toLocaleString('en-PH',{maximumFractionDigits:digits});
 for(const scenario of ['M','Z']){
  await page.getByLabel('Absent-day scenario',{exact:true}).selectOption(scenario);
  const snapshot=data.snapshots.find((r:any)=>r.scenario===scenario);
  const forecasts=page.locator('.forecast-pair article');await expect(forecasts).toHaveCount(2);
  for(let i=0;i<2;i++){const f=snapshot.forecasts[i];await expect(forecasts.nth(i)).toContainText(format(f.predicted));await expect(forecasts.nth(i)).toContainText(f.target);if(f.low80!==null)await expect(forecasts.nth(i)).toContainText(format(f.low80)+'–'+format(f.high80));}
  const years=page.getByRole('region',{name:'Year comparison'}).locator('tbody tr');await expect(years).toHaveCount(snapshot.year_comparison.length);
  for(let i=0;i<snapshot.year_comparison.length;i++){const r=snapshot.year_comparison[i];await expect(years.nth(i)).toContainText(format(r.scorable_cases,0));await expect(years.nth(i)).toContainText(r.observed_week_count+' / '+r.calendar_week_count);}
  for(let m=1;m<=12;m++){const observed=data.series[scenario].filter((r:any)=>r.cases!==null&&Number(r.week_ending.slice(5,7))===m),mean=observed.reduce((s:number,r:any)=>s+r.cases,0)/observed.length;await expect(page.locator('.season-bars>div').nth(m-1).locator('span').last()).toHaveText(format(mean));}
  const detail=page.locator('details').filter({has:page.getByText('Backtest data table',{exact:true})});if((await detail.getAttribute('open'))===null)await detail.locator('summary').click();
  await expect(detail.locator('table')).toBeVisible();
  const expected=backtest.rows.filter((r:any)=>r.scenario===scenario);await expect(detail.locator('tbody tr')).toHaveCount(expected.length);
  for(let i=0;i<expected.length;i++){const r=expected[i];await expect(detail.locator('tbody tr').nth(i).locator('th,td')).toHaveText([r.origin,r.target,String(r.actual),String(r.predicted)]);}
 }
});


test('every Replay calendar week and all 17 table rows match saved predictions and missing-data flags',async({page})=>{
 test.setTimeout(120000);await mockPublicApi(page,{open:false});await page.route('https://tiles.openfreemap.org/**',r=>r.abort());await goto(page,'/risk-map');const data=await read('public/ml/replay.json');await page.getByRole('button',{name:'Show data table',exact:true}).click();const slider=page.getByLabel('Choose an example week',{exact:true});await slider.focus();const table=page.getByRole('region',{name:'City prediction data'});let unavailable=0;
 for(let i=0;i<data.weeks.length;i++){
  if(i)await slider.press('ArrowRight');await expect(page.locator('.replay-controls output')).toHaveText(data.weeks[i]);
  const expected=data.rows.filter((r:any)=>r.target===data.weeks[i]);expect(expected).toHaveLength(17);
  const actual=await table.locator('tbody tr').evaluateAll(rows=>rows.map(row=>({city:row.getAttribute('data-city-row'),probability:row.getAttribute('data-probability'),level:row.querySelector('[data-risk-level]')?.getAttribute('data-risk-level')})));
  expect(actual).toEqual(expected.map((r:any)=>({city:r.city,probability:r.probability===null?'missing':String(r.probability),level:r.probability===null?'no-data':String(data.bands.filter((cut:number)=>r.probability>=cut).length)})));unavailable+=expected.filter((r:any)=>r.probability===null).length;
 }
 expect(unavailable).toBe(119);await expect(table).toContainText('No estimate');await expect(page.locator('.city-detail')).toContainText('Some source weeks are missing');
});

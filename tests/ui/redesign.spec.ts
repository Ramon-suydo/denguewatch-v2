import {test,expect} from '@playwright/test';
import {readFile} from 'node:fs/promises';
import AxeBuilder from '@axe-core/playwright';
import {goto,activeView} from '../support/active-view';
import {outlookRows,type Outlook} from '../../src/redesign/outlook';
const read=async(path:string)=>JSON.parse(await readFile(path,'utf8'));

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

test('national map uses every explicit match, no guessed areas, exact saved metrics and real calendar windows',async({page})=>{
 await page.clock.setFixedTime(new Date('2026-10-20T04:00:00Z'));
 await page.route('**/api/v2/outlook-weather.json',route=>route.fulfill({status:503,body:'Unavailable'}));
 const external:string[]=[];page.on('request',r=>{if(/open-meteo|power\.larc|tile\./.test(r.url()))external.push(r.url());});
 await goto(page,'/risk-map');const geo=await read('public/geo/philippines.geojson'),data=await read('public/api/v2/outlook.json') as Outlook;
 const polygons=page.locator('.national-map [data-boundary-id]');await expect(polygons).toHaveCount(geo.features.length);
 await expect(page.locator('.national-map [data-no-data="true"]')).toHaveCount(8);
 expect(geo.features.filter((f:any)=>f.properties.case_name)).toHaveLength(96);
 await expect(page.locator('.province-detail')).toContainText('Weather forecast unavailable. Seasonal outlook retained.');
 const detail=page.locator('.province-detail');await expect(detail).not.toContainText('estimated cases');
 await expect(page.locator('.national-map [data-case-unit]:not([data-case-unit=""])')).toHaveCount(96);
 const manila=page.locator('.national-map [data-case-unit="MANILA CITY"]');await manila.focus();await page.keyboard.press('Enter');await expect(manila).toHaveAttribute('aria-pressed','true');
 const expected=(date:string)=>outlookRows(data,date).find(r=>r.name==='MANILA CITY')!.index!.toLocaleString('en-US',{maximumFractionDigits:1});
 for(const [label,date] of [['Today','2026-10-20'],['+3 days','2026-10-23'],['+7 days','2026-10-27']]){
  await page.getByRole('button',{name:label,exact:true}).click();await expect(detail.locator('[data-outlook-index]')).toHaveText(expected(date));
 }
 const transform=await page.locator('.national-map>g').getAttribute('transform');await page.getByRole('button',{name:'Zoom in',exact:true}).click();expect(await page.locator('.national-map>g').getAttribute('transform')).not.toBe(transform);
 await page.getByRole('button',{name:'Reset',exact:true}).click();
 const table=page.getByRole('region',{name:'Outlook Index data table'});await page.getByText('Data table: all reporting units and unmatched areas',{exact:true}).click();
 await expect(table.locator('tbody tr')).toHaveCount(134);
 for(const row of outlookRows(data,'2026-10-27')){
  const tr=table.locator('tbody tr').filter({has:page.getByRole('button',{name:row.name,exact:true})});
  const matched=geo.features.some((f:any)=>f.properties.case_name===row.name);
  await expect(tr.locator('td').first()).toHaveText(matched?row.index!.toLocaleString('en-US',{maximumFractionDigits:1}):'No data');
 }
 const metricRows=page.getByRole('region',{name:'National map validation metrics'}).locator('tbody tr');await expect(metricRows).toHaveCount(data.models.length);
 for(let i=0;i<data.models.length;i++){const r=data.models[i];await expect(metricRows.nth(i).locator('td')).toHaveText([r.model,String(r.weeks),String(r.min_units),...[r.spearman!,r.top10_hit_rate,r.normalized_rank_error].map(v=>v.toLocaleString('en-PH',{maximumFractionDigits:3}))]);}
 await page.getByLabel('Search province / city').fill('DAVAO DE ORO');await expect(table.locator('tbody tr')).toHaveCount(1);await expect(table).toContainText('Unmatched: no data');
 await table.getByRole('button',{name:'DAVAO DE ORO',exact:true}).click();await expect(detail).toContainText('No data: no explicit polygon/reporting-unit match.');
 await page.getByLabel('Map layer',{exact:true}).selectOption('history');await expect(page.getByLabel('Historical year')).toHaveValue('2020');
 await page.getByLabel('Historical source week').selectOption('2020-01-05');expect(external).toEqual([]);
});

test('Dashboard and Manila map panel expose saved MAEs and backtest values, with bilingual core pages and privacy',async({page})=>{
 const data=await read('public/api/v2/manila.json');
 for(const path of ['/','/risk-map']){
  await goto(page,path);await expect(page.getByRole('heading',{name:'Current risk unavailable'})).toBeVisible();
  for(const h of [1,2]){const expected=data.summaries.find((r:any)=>r.scenario==='M'&&r.fold==='test-2018-2023'&&r.model==='naive'&&r.horizon===h).mae;await expect(page.locator(`[data-panel-horizon="${h}"]`)).toHaveAttribute('data-panel-mae',String(expected));}
 }
 for(const [path,heading] of [['/','Hindi alam ang panganib ngayon'],['/risk-map','MGA PATTERN, HINDI HULA.'],['/report','Unawain at pumayag']]){
  await goto(page,path);await page.getByRole('button',{name:'Filipino',exact:true}).click();await expect(page.getByRole('heading',{name:heading,exact:true})).toBeVisible();await expect(page.locator('html')).toHaveAttribute('lang','fil');
  await page.getByRole('button',{name:'English',exact:true}).click();
 }
 await page.getByRole('contentinfo').getByRole('button',{name:'Privacy notice',exact:true}).click();await expect(activeView(page)).toContainText('RA 10173');
 await expect(activeView(page)).toContainText('No system can promise perfect anonymity');
});


test('Dashboard numeric analytics reproduce published series, exact backtest rows and forecast values',async({page})=>{
 await goto(page,'/');const data=await read('public/api/v2/manila.json'),backtest=await read('public/api/v2/dashboard.json');
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

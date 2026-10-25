import {goto,activeView} from '../support/active-view';
import { test,expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { reportingHarness } from '../support/reporting-harness';
test('local seeded MFA staff reviews real SQL reports; threshold, delay, PII, raw denial and withdrawal hold',async({page,context})=>{
 test.setTimeout(180000);const local=await reportingHarness();
 try{
 expect(local.dataset).toBe('LOCAL TEST DATA ONLY');await local.attach(page);
 const today=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Manila',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
 const codes:string[]=[];
 for(const symptom of ['Fever','Headache','Nausea']){
  await goto(page, '/report');await activeView(page).getByRole('checkbox').check();await expect(activeView(page).getByRole('button',{name:'Continue to report'})).toBeEnabled();await activeView(page).getByRole('button',{name:'Continue to report'}).click();
  await activeView(page).getByLabel('Report type',{exact:true}).selectOption('cluster');await activeView(page).getByLabel('People affected (approximate range)',{exact:true}).selectOption('2-4');
  await activeView(page).getByLabel('Symptom-onset date (required)').fill(today);await activeView(page).getByRole('checkbox',{name:symptom,exact:true}).check();
  await activeView(page).getByLabel('Short note (optional, 250 characters)').fill('LOCAL TEST DATA ONLY <img src=x onerror="window.__xss=1"> contact test@local.invalid +63 912 345 6789');
  await activeView(page).getByRole('button',{name:'Submit community report'}).click();await expect(activeView(page).getByRole('heading',{name:'Report received for review'})).toBeVisible({timeout:90000});
  const code=await page.locator('.tracking-code code').innerText();expect(code).toMatch(/^DW2-[A-F0-9]{32}$/);codes.push(code);
 }
 const stored=(await local.db.query<{note_text:string}>('select note_text from public.community_signals')).rows;
 expect(stored).toHaveLength(3);for(const row of stored){expect(row.note_text).not.toMatch(/@|\+63|<img|onerror/);}
 let releaseStaff!:()=>void;const staffReady=new Promise<void>(resolve=>{releaseStaff=resolve;});
 await page.route('**/rest/v1/rpc/staff_signal_queue',async route=>{await staffReady;await route.fallback();});
 await goto(page, '/admin');await activeView(page).getByLabel('Staff email').fill(local.email);await activeView(page).getByLabel('Password',{exact:true}).fill(local.password);await activeView(page).getByRole('button',{name:'Sign in',exact:true}).click();await expect(activeView(page).getByRole('heading',{name:'Verify staff authenticator'})).toBeVisible();await expect(activeView(page).getByRole('button',{name:'Cancel staff sign in'})).toBeDisabled();releaseStaff();await expect(activeView(page).getByRole('heading',{name:'Moderation queue'})).toBeVisible();
 await expect(page.locator('.staff-report')).toHaveCount(3);
 const accessibility=await new AxeBuilder({page}).analyze();expect(accessibility.violations.filter(v=>['critical','serious'].includes(v.impact??''))).toEqual([]);expect(await page.evaluate(()=>Reflect.get(window,'__xss'))).toBeUndefined();
 const publicPage=await context.newPage();await local.attach(publicPage);
 async function groups(){await publicPage.goto('/community');return publicPage.getByRole('region',{name:'Unverified community aggregates'});}
 await groups();await expect(publicPage.getByText('No publishable groups.',{exact:false})).toBeVisible();
 for(let i=0;i<2;i++){await activeView(page).getByRole('button',{name:'Approve',exact:true}).nth(i).click();await expect(page.locator('.staff-report').nth(i)).toContainText('approved');}
 await local.ageReports();await groups();await expect(publicPage.getByText('No publishable groups.',{exact:false})).toBeVisible();
 await activeView(page).getByRole('button',{name:'Approve',exact:true}).nth(2).click();await expect(page.locator('.staff-report').nth(2)).toContainText('approved');
 await expect(await groups()).toBeVisible();await expect(publicPage.getByRole('region',{name:'Unverified community aggregates'}).locator('tbody tr')).toHaveCount(1);
 const publicData=(await local.db.query<Record<string,unknown>>('select * from public.community_signal_aggregates()')).rows;
 expect(Object.keys(publicData[0]).sort()).toEqual(['area_label','report_count','week_start']);expect(Number(publicData[0].report_count)).toBe(3);
 for(const resource of ['community_signals','community_reports']){
  const result=await publicPage.evaluate(async resource=>{const response=await fetch('https://denguewatch-tests.invalid/rest/v1/'+resource+'?select=*');return {status:response.status,text:await response.text()};},resource);
  expect(result.status).toBe(403);expect(result.text).not.toMatch(/note_text|contact_value|code_hash|onset_date|ip_address/);
 }
 await publicPage.goto('/privacy');await publicPage.getByLabel('Reference code').fill(codes[0]);await publicPage.getByRole('button',{name:'Request withdrawal',exact:true}).click();await expect(publicPage.getByText('Request processed.',{exact:false})).toBeVisible();
 await groups();await expect(publicPage.getByText('No publishable groups.',{exact:false})).toBeVisible();await publicPage.close();
 }finally{await local.close();}
});

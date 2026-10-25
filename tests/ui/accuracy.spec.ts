import { test,expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';
const evaluation=JSON.parse(await readFile('data/processed/evaluation.json','utf8'));
test('visible accuracy MAEs match every selected saved evaluation value exactly',async({page})=>{
 await page.goto('/methodology');await expect(page.getByRole('heading',{name:'How accurate is this?'})).toBeVisible();
 const table=page.getByRole('region',{name:'Forecast accuracy from saved evaluation'});
 for(const scenario of ['M','Z']){
  await page.getByLabel('Absent-day scenario',{exact:true}).selectOption(scenario);
  const rows=evaluation.summaries.filter((r:any)=>r.scenario===scenario && r.fold==='test-2018-2023' && ['naive','ridge-cases','ridge-weather'].includes(r.model)&&[1,2,4].includes(r.horizon));
  expect(rows).toHaveLength(9);await expect(table.locator('tbody tr')).toHaveCount(rows.length);
  for(const r of rows){const cell=table.locator(`tr[data-model="${r.model}"][data-horizon="${r.horizon}"] [data-mae]`);await expect(cell).toHaveAttribute('data-mae',String(r.mae??'unavailable'));await expect(cell).toHaveText(r.mae==null?'Unavailable':r.mae.toFixed(2));}
 }
 await expect(page.getByText("The public chart starts with Scenario M",{exact:false})).toBeVisible();
});

import {test,expect} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import {readFileSync} from 'node:fs';
import {mockPublicApi} from '../fixtures/public-fixtures';
const research=JSON.parse(readFileSync('public/research/manila-expanded.json','utf8'));
for(const width of [360,1280])test(`expanded Manila research at ${width}px shows real evaluation and provisional counts`,async({page})=>{
 await page.clock.setFixedTime(new Date('2026-10-28T04:00:00Z'));await mockPublicApi(page,{open:false});
 await page.setViewportSize({width,height:1000});await page.goto('/expanded-model');
 await expect(page.getByRole('heading',{name:'Do more factors improve the forecast?',exact:true})).toBeVisible();
 for(const h of research.horizons)await expect(page.locator(`[data-expanded-horizon="${h.horizon}"]`)).toHaveText(h.forecast.predicted.toFixed(0));
 await expect(page.getByText('Experimental · improvement is not established',{exact:true})).toBeVisible();
 await page.getByText('Compare all twelve candidates',{exact:true}).first().click();
 await expect(page.getByRole('region',{name:'1-week model comparisons'}).locator('tbody tr')).toHaveCount(12);
 const overflow=await page.evaluate(()=>[...document.querySelectorAll('body *')].filter(el=>!el.closest('.table-scroll')).map(el=>({tag:el.tagName,cls:el.className,right:el.getBoundingClientRect().right,width:el.getBoundingClientRect().width})).filter(el=>el.right>innerWidth+1&&el.width>100).slice(0,12));
 const scroll=await page.locator('.expanded-research .table-scroll').first().evaluate(el=>({overflow:getComputedStyle(el).overflowX,width:el.getBoundingClientRect().width,parent:el.parentElement?.getBoundingClientRect().width}));
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),JSON.stringify({overflow,scroll,root:await page.evaluate(()=>({scroll:document.documentElement.scrollWidth,inner:innerWidth}))})).toBe(true);
 expect((await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa','wcag22aa']).analyze()).violations).toEqual([]);
 await page.getByRole('heading',{name:'Experimental recent counts',exact:true}).scrollIntoViewIfNeeded();
 await page.screenshot({path:`.artifacts/expanded-manila/research-${width}.png`});
});
test('expanded counts hide after expiry or source changes; historical evidence stays visible',async({page})=>{
 await page.clock.setFixedTime(new Date('2026-11-09T04:00:00Z'));await mockPublicApi(page,{open:false});await page.goto('/expanded-model');
 await expect(page.getByText('2023 mean absolute error:',{exact:false}).first()).toBeVisible();
 await expect(page.locator('[data-expanded-horizon]')).toHaveCount(0);
 await page.clock.setFixedTime(new Date('2026-10-28T04:00:00Z'));
 const live=JSON.parse(readFileSync('public/live-manila/weekly.json','utf8'));live.rows.pop();
 await page.route('**/live-manila/weekly.json',r=>r.fulfill({json:live}));await page.reload();
 await expect(page.locator('[data-expanded-horizon]')).toHaveCount(0);
 await expect(page.getByText('Recent model counts are hidden',{exact:false})).toBeVisible();
});
test('expanded data failure offers retry and preserves navigation',async({page})=>{
 await mockPublicApi(page,{open:false});await page.route('**/research/manila-expanded.json',r=>r.fulfill({status:503,body:'Unavailable'}));await page.goto('/expanded-model');
 await expect(page.getByRole('alert')).toContainText('The expanded research could not load.');
 await page.unroute('**/research/manila-expanded.json');await page.getByRole('button',{name:'Retry',exact:true}).click();
 await expect(page.getByRole('heading',{name:'Every raw file, with its own role',exact:true})).toBeVisible();
});

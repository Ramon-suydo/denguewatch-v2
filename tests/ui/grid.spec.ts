import {test,expect} from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import {readFile} from "node:fs/promises";
const area=JSON.parse(await readFile("public/geo/tondo.json","utf8"));
test("offline Tondo areas, weighted heat, locked cases, keyboard, comparison and accessible table",async({page,context})=>{
 test.setTimeout(120000);const issues:string[]=[],external:string[]=[];
 page.on('pageerror',error=>issues.push(error.message));page.on('console',message=>{if(['error','warning'].includes(message.type()))issues.push(message.text());});
 await page.addInitScript(()=>Object.defineProperty(navigator,'onLine',{get:()=>false}));
 await context.route('**/*',route=>{const host=new URL(route.request().url()).hostname;if(['127.0.0.1','localhost'].includes(host))return route.continue();external.push(route.request().url());return route.abort();});
 await page.setViewportSize({width:390,height:900});await page.goto('/map?area=tondo&b=202');
 await expect(page.getByRole('button',{name:'Areas',exact:true})).toHaveAttribute('aria-pressed','true');
 await expect(page.locator('.barangay-svg path[role="button"]')).toHaveCount(area.metadata.mapped);
 await expect(page.getByRole('complementary',{name:'Barangay 202 information'})).toContainText(area.rows.find((row:{number:number})=>row.number===202).population.toLocaleString('en-PH'));
 await page.getByRole('button',{name:'Pin to compare'}).click();const path=page.locator('[data-barangay="202"]');await path.focus();await page.keyboard.press('+');await expect(page.locator('.barangay-svg > g')).toHaveAttribute('transform',/scale\(1.25\)/);await page.keyboard.press('0');await expect(page.locator('.barangay-svg > g')).toHaveAttribute('transform',/scale\(1\)/);await page.keyboard.press('ArrowRight');await expect(page.getByRole('complementary',{name:'Barangay 203 information'})).toBeVisible();await page.getByRole('button',{name:'Pin to compare'}).click();await expect(page.getByLabel('Pinned comparison')).toContainText('Barangay 202');await expect(page.getByLabel('Pinned comparison')).toContainText('Barangay 203');
 await page.getByRole('button',{name:'Close barangay information'}).click();
 await page.getByRole('button',{name:'Heat',exact:true}).click();await expect(page.locator('.map-context')).toContainText('Smoothed view. Boundaries show where the data applies.');await expect(page.locator('g[filter="url(#heat-blur)"] circle')).toHaveCount(area.metadata.mapped);
 await page.getByRole('button',{name:'Crowding',exact:true}).click();await expect(page.locator('.map-context')).toContainText('not disease risk');
 await page.getByRole('button',{name:'Dengue cases · locked'}).click();await expect(page.locator('.map-locked')).toContainText('Waiting for barangay-level data from the Manila Health Department');await expect(page.locator('g[filter="url(#heat-blur)"] circle')).toHaveCount(0);
 await page.getByRole('button',{name:'Population',exact:true}).click();await page.locator('.map-coverage > summary').click();await expect(page.locator('.map-drawer')).toContainText('1,213');await expect(page.locator('.missing-boundary')).toHaveCount(area.metadata.requested-area.metadata.mapped);
 await page.getByRole('button',{name:'Tondo II East',exact:true}).click();await page.locator('.map-coverage > summary').click();await page.getByRole('button',{name:'Table',exact:true}).click();await page.getByLabel('Search barangay').fill('Barangay 202');await expect(page.locator('.map-table tbody tr')).toHaveCount(1);
 await page.getByLabel('Search barangay').fill('unmatched');await expect(page.locator('.map-legend')).toContainText('No data');await expect(page.locator('.map-table tbody tr')).toHaveCount(0);await page.getByLabel('Search barangay').fill('');for(const width of [320,390,768,1280]){await page.setViewportSize({width,height:900});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);expect((await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze()).violations).toEqual([]);}
 expect(issues).toEqual([]);expect(external).toEqual([]);
});

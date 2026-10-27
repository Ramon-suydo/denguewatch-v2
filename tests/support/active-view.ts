import {expect,type Page} from '@playwright/test';
// Native modal backgrounds remain in the DOM but are inert. Interact only with the active view.
export const activeView=(page:Page)=>page.locator('body:has(dialog[open]) dialog[open], body:not(:has(dialog[open]))');
const drawerRoutes=/^\/(trends|metro-manila|map|methodology|prevention|privacy|terms|legal|data-sources|community|city)(\/|$|[?#])/;
export async function ready(page:Page,path:string){
 if(drawerRoutes.test(path)||path.includes('drawer='))await expect(page.locator('dialog[open]')).toBeVisible();
 else await expect(page.locator('dialog[open]')).toHaveCount(0);
 await expect(activeView(page).getByRole('heading',{level:1})).toBeVisible();
}
export async function goto(page:Page,path:string){await page.goto(path);await ready(page,path);}

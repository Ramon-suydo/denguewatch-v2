import {test,expect} from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import {readFile} from "node:fs/promises";
const snapshot=JSON.parse(await readFile("public/demo-snapshot.json","utf8"));
test("confidence leads with checked Manila work and retains closed disclosures and footer",async({page})=>{
 await page.addInitScript(()=>Object.defineProperty(navigator,"onLine",{get:()=>false}));
 await page.goto("/data-sources");await expect(page.getByRole("heading",{name:"Data confidence",exact:true})).toBeVisible();
 const id=snapshot.cities.find((c:{name:string})=>c.name==="MANILA CITY").id;
 await expect(page.locator(".stat-value").first()).toHaveText(snapshot.history.filter((r:{lgu_id:string})=>r.lgu_id===id).length.toLocaleString("en-PH"));
 await expect(page.locator(".coverage-present").first()).not.toHaveCSS("background-color","rgba(0, 0, 0, 0)");
 const notes=page.locator("details.data-notes");await expect(notes).not.toHaveAttribute("open");
 await notes.locator("summary").click();for(const text of ["Historical, not live.","Missing is not zero.","Deaths excluded from forecasts.","Community reports are unverified.","Jan 10, 2021","Dec 2, 2023"])await expect(notes).toContainText(text);
 await expect(page.locator("main")).not.toContainText("QUEZON CITY");await expect(page.locator("main")).not.toContainText("Pateros");
 await expect(page.getByRole("contentinfo")).toContainText("Community reports are unverified");await expect(page.getByRole("contentinfo")).toContainText("not medical advice");
 for(const width of [320,390,768,1280]){await page.setViewportSize({width,height:900});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);expect((await new AxeBuilder({page}).withTags(["wcag2a","wcag2aa","wcag21aa"]).analyze()).violations).toEqual([]);}
});

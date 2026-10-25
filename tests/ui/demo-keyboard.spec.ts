import { test, expect } from "@playwright/test";
import { mockPublicApi } from "../fixtures/public-fixtures";
test("keyboard skip link, visible focus and reduced motion", async ({ page }) => {
  await mockPublicApi(page, { open: false });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await page.evaluate(() => { document.body.tabIndex = -1; document.body.focus(); });
  await page.keyboard.press("Tab");
  const skip = page.getByRole("link", { name: "Skip to content" });
  await expect(skip).toBeFocused();
  expect(await skip.evaluate(e => e.getBoundingClientRect().top)).toBeGreaterThanOrEqual(0);
  expect(await skip.evaluate(e => getComputedStyle(e).outlineStyle)).not.toBe("none");
  await page.keyboard.press("Enter");
  await expect(page.locator("#main")).toBeFocused();
  expect(await page.evaluate(() => [...document.querySelectorAll("*")].every(e => {
    const style = getComputedStyle(e);
    return style.animationName === "none" && style.transitionDuration === "0s";
  }))).toBeTruthy();
  await page.goto('/risk-map');
  const zoom=page.getByRole('button',{name:'Zoom in',exact:true});await expect(zoom).toBeVisible();await page.keyboard.press('Tab');await zoom.focus();
  function contrast(a:string,b:string){const luminance=(color:string)=>{const rgb=color.match(/[0-9.]+/g)!.slice(0,3).map(Number).map(v=>v/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4);return .2126*rgb[0]+.7152*rgb[1]+.0722*rgb[2];};const x=luminance(a),y=luminance(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05);}
  const ring=await zoom.evaluate(element=>{const s=getComputedStyle(element),background=getComputedStyle(element.closest('.ui-card')!).backgroundColor;return {outline:s.outlineStyle==='none'?null:s.outlineColor,shadow:s.boxShadow.match(/rgba?\([^)]+\)/)?.[0]??null,background};});
  expect(Math.max(...[ring.outline,ring.shadow].filter((c):c is string=>c!==null).map(c=>contrast(c,ring.background))),'Actual keyboard indicator on a light map card').toBeGreaterThanOrEqual(3);
  const province=page.locator('.national-map [data-case-unit="MANILA CITY"]');await expect(province).toBeVisible();await province.focus();await expect(province).toBeFocused();
  const path=await province.evaluate(element=>{const s=getComputedStyle(element);return {fill:s.fill,stroke:s.stroke,outline:s.outlineStyle==='none'?null:s.outlineColor};});
  expect(Math.max(...[path.stroke,path.outline].filter((c):c is string=>c!==null).map(c=>contrast(c,path.fill))),'Actual province focus on a dark choropleth class').toBeGreaterThanOrEqual(3);

});

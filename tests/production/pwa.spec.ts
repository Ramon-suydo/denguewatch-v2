import {goto,activeView} from '../support/active-view';
import { test, expect } from "@playwright/test";
test("production PWA installs public cache, survives offline reload, and never caches staff/report requests", async ({
  page,
  context,
}) => {
  test.setTimeout(60000);
  await goto(page, "/");
  await expect(
    activeView(page).getByRole("heading", { name: "Current risk unavailable" }),
  ).toBeVisible();
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
    if (!navigator.serviceWorker.controller)
      await new Promise<void>((r) =>
        navigator.serviceWorker.addEventListener(
          "controllerchange",
          () => r(),
          { once: true },
        ),
      );
  });
  const cache = await page.evaluate(async () => {
    const names = await caches.keys();
    const requests = (
      await Promise.all(
        names
          .filter((n) => n.startsWith("dw-research-"))
          .map(async (n) =>
            (await (await caches.open(n)).keys()).map((r) => r.url),
          ),
      )
    ).flat();
    return { names, requests };
  });
  expect(cache.names.some((n) => n.startsWith("dw-research-"))).toBe(true);
  expect(
    cache.requests.some(
      (url) =>
        url.includes("supabase.co") ||
        new URL(url).pathname.startsWith("/admin"),
    ),
  ).toBe(false);
  expect(cache.requests.some(url=>new URL(url).pathname.startsWith('/img/source/'))).toBe(false);
  expect(cache.requests.some(url=>['/api/v2/weather.json','/api/v2/outlook-weather.json'].includes(new URL(url).pathname))).toBe(false);
  await context.setOffline(true);
  await goto(page, "/trends");
  await expect(
    activeView(page).getByRole("heading", { name: "Weekly recorded cases" }),
  ).toBeVisible();
  await expect(
    page.locator("main>.evidence-banner"),
  ).toBeVisible();
  await goto(page, "/metro-manila");
  await expect(page.locator(".ncr-city-map path")).toHaveCount(17);
  await expect(
    page.getByText("Data ends January 2021.", { exact: true }),
  ).toBeVisible();
  await goto(page,'/risk-map');await expect(page.locator('.national-map [data-boundary-id]')).toHaveCount(104);await expect(page.locator('.national-map [data-no-data="true"]')).toHaveCount(8);
  await expect(page.locator('.province-detail')).toContainText('Weather forecast unavailable. Seasonal outlook retained.');
  await goto(page,'/report');await page.getByRole('checkbox').check();await expect(page.getByRole('button',{name:'Continue to report',exact:true})).toBeDisabled();
  await goto(page,'/about');await expect(page.locator('#image-credit')).toContainText('Background photograph by Sumarie Slabber');

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

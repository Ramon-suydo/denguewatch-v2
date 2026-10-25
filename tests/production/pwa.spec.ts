import { test, expect } from "@playwright/test";
test("production PWA installs public cache, survives offline reload, and never caches staff/report requests", async ({
  page,
  context,
}) => {
  test.setTimeout(60000);
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Current risk unavailable" }),
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
  await context.setOffline(true);
  await page.goto("/trends");
  await expect(
    page.getByRole("heading", { name: "Weekly recorded cases" }),
  ).toBeVisible();
  await expect(
    page.getByText(
      "Offline · showing previously loaded historical research data.",
      { exact: false },
    ),
  ).toBeVisible();
  await page.goto("/metro-manila");
  await expect(page.locator(".ncr-city-map path")).toHaveCount(17);
  await expect(
    page.getByText("Data ends January 2021.", { exact: true }),
  ).toBeVisible();
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
    await page.goto(route);
    await expect(
      page.getByRole("heading", { name: "Page not found" }),
    ).toBeVisible();
  }
});

test("production styles and public research charts comply with the strict CSP",async({page})=>{
 const violations:string[]=[];
 await page.exposeFunction('recordPolicyViolation',(directive:string)=>violations.push(directive));
 await page.addInitScript(()=>document.addEventListener('securitypolicyviolation',event=>{void (window as any).recordPolicyViolation(event.violatedDirective);}));
 for(const path of ['/','/trends','/methodology','/data-sources']){
  await page.goto(path);await expect(page.getByRole('heading',{level:1})).toBeVisible();
  if(path==='/methodology')await expect(page.getByRole('heading',{name:'How accurate is this?'})).toBeVisible();
  if(path==='/data-sources')await expect(page.locator('.coverage-present').first()).not.toHaveCSS('background-color','rgba(0, 0, 0, 0)');
 }
 expect(violations).toEqual([]);
});

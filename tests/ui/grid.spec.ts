import {goto,activeView} from '../support/active-view';
import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
test("historical NCR map is offline, keyboard accessible and never assigns district case counts", async ({
  page,
  context,
}) => {
  const external: string[] = [];
  await context.route("**/*", (r) => {
    if (
      ["localhost", "127.0.0.1"].includes(new URL(r.request().url()).hostname)
    )
      return r.continue();
    external.push(r.request().url());
    return r.abort();
  });
  await goto(page, "/map");
  await expect(page.locator(".ncr-city-map path")).toHaveCount(17);
  const path = page.locator(".ncr-city-map path").first();
  await path.focus();
  await page.keyboard.press("Enter");
  await expect(path).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator(".evidence-selection")).toContainText(
    "MANILA CITY",
  );
  await activeView(page).getByLabel("Comparison period").selectOption("week");
  await activeView(page).getByLabel("Week label").selectOption("2019-09-08");
  await expect(
    activeView(page).getByRole("region", { name: "Historical NCR city ranking" })
      .locator("tbody tr"),
  ).toHaveCount(17);
  expect(external).toEqual([]);
});
test("all 17 city shapes and selected-city details clear navigation at four widths", async ({
  page,
}) => {
  for (const width of [320, 390, 768, 1280]) {
    await page.setViewportSize({ width, height: 1000 });
    await goto(page, "/map");
    await expect(page.locator(".ncr-city-map path")).toHaveCount(17);
    expect(
      await page.evaluate(() => ({
        overflow: document.documentElement.scrollWidth > innerWidth,
        titleClear:
          document.querySelector("dialog[open] h1")!.getBoundingClientRect().top >=
          document.querySelector("dialog[open] .section-heading")!.getBoundingClientRect().bottom,
      })),
    ).toEqual({ overflow: false, titleClear: true });
    expect(
      (await new AxeBuilder({ page }).analyze()).violations.filter((v) =>
        ["critical", "serious"].includes(v.impact ?? ""),
      ),
    ).toEqual([]);
    await page.screenshot({
      path: `.artifacts/evidence-ui/ncr-${width}.png`,
      fullPage: true,
    });
  }
});

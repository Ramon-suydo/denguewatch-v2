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
});

import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { mkdir } from "node:fs/promises";

test("preview interactions, consent, focus restoration and desktop accessibility", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.setViewportSize({ width: 1440, height: 1100 });
  await page.goto("/dev");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
  await expect(page.locator("body")).toHaveCSS("font-family", /Roboto/);
  await expect(page.locator("h1")).toHaveCSS("font-family", /Montserrat/);
  await expect(page.locator(".recharts-surface").first()).toBeVisible();
  await expect(page.locator(".stat-value").first()).toHaveText("138");
  await page.getByLabel("Reporting period").selectOption("4");
  await expect(page.locator(".stat-value").first()).toHaveText("65");
  await page.getByText("View chart data", { exact: true }).click();
  await expect(page.locator(".chart-table tbody tr")).toHaveCount(4);
  await page.getByLabel("Find a sample area").fill("area B");
  await expect(page.locator(".area-table tbody tr")).toHaveCount(1);
  await page.getByLabel("Find a sample area").fill("unknown");
  await expect(page.locator(".area-table").getByRole("status")).toContainText(
    "No sample areas",
  );
  await page.getByLabel("Find a sample area").fill("");
  await page.getByLabel("Reporting period").selectOption("8");
  await page.getByText("View chart data", { exact: true }).click();
  const trigger = page.getByRole("button", { name: "Try report flow" });
  await trigger.click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Continue preview" }),
  ).toBeDisabled();
  for (let i = 0; i < 6; i++) {
    await page.keyboard.press("Tab");
    expect(
      await dialog.evaluate((element) =>
        element.contains(document.activeElement),
      ),
    ).toBeTruthy();
  }
  expect(
    (
      await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
        .analyze()
    ).violations,
  ).toEqual([]);
  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();
  await expect(trigger).toBeFocused();
  await trigger.click();
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Continue preview" }).click();
  await expect(page.locator(".toast-region")).toContainText(
    "No report or consent was saved",
  );
  await page.getByRole("button", { name: "Dismiss notification" }).click();
  await trigger.click();
  await expect(page.getByRole("checkbox")).not.toBeChecked();
  await page.getByRole("button", { name: "Cancel", exact: true }).click();
  expect(
    (
      await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
        .analyze()
    ).violations,
  ).toEqual([]);
  expect(errors).toEqual([]);
  await mkdir(".artifacts/design-system", { recursive: true });
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({
    path: ".artifacts/design-system/desktop.png",
    fullPage: true,
  });
  await page.screenshot({
    path: ".artifacts/design-system/desktop-overview.png",
  });
});

test("responsive layout, mobile menu and mobile accessibility", async ({
  page,
}) => {
  for (const width of [320, 390, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 844 });
    await page.goto("/dev");
    await expect(page.locator(".recharts-surface").first()).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBeTruthy();
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("button", { name: "Menu" }).click();
  await expect(
    page.getByRole("navigation", { name: "Main navigation" }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Area snapshot", exact: true }).click();
  await expect(page.getByRole("button", { name: "Menu" })).toHaveAttribute(
    "aria-expanded",
    "false",
  );
  expect(
    (
      await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
        .analyze()
    ).violations,
  ).toEqual([]);
  await page.evaluate(() => {
    window.scrollTo(0, 0);
    return document.fonts.ready;
  });
  await mkdir(".artifacts/design-system", { recursive: true });
  await page.screenshot({
    path: ".artifacts/design-system/mobile.png",
    fullPage: true,
  });
});

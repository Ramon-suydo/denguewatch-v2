import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
test("legal notices, closed consent, no sensitive browser storage and print-friendly public evidence", async ({
  page,
  context,
}) => {
  await page.addInitScript(() =>
    Object.defineProperty(navigator, "onLine", { get: () => false }),
  );
  await context.route("**/*", (r) =>
    ["localhost", "127.0.0.1"].includes(new URL(r.request().url()).hostname)
      ? r.continue()
      : r.abort(),
  );
  await page.goto("/legal");
  await expect(
    page.getByRole("heading", { name: "Legal and privacy notices" }),
  ).toBeVisible();
  for (const name of [
    "Privacy Notice",
    "Terms of Use",
    "Forecast & Medical Disclaimer",
    "Data Sources & Attribution",
    "Model Transparency",
    "Cookie/Storage Notice",
  ])
    await expect(
      page.getByRole("heading", { name, exact: true }),
    ).toBeVisible();
  await page.goto("/report");
  await expect(page.getByRole("checkbox")).not.toBeChecked();
  await page.getByRole("checkbox").check();
  await expect(
    page.getByRole("button", { name: "Continue to report" }),
  ).toBeDisabled();
  await page.goto("/methodology");
  await expect(
    page.getByRole("heading", { name: "Forecast comparison" }),
  ).toBeVisible();
  await page.emulateMedia({ media: "print" });
  await expect(
    page.getByRole("heading", {
      name: "What was tested. What remains uncertain.",
    }),
  ).toBeVisible();
  expect(
    (await new AxeBuilder({ page }).analyze()).violations.filter((v) =>
      ["critical", "serious"].includes(v.impact ?? ""),
    ),
  ).toEqual([]);
  const storage = await page.evaluate(() => ({
    local: JSON.stringify(localStorage),
    session: JSON.stringify(sessionStorage),
    cookie: document.cookie,
  }));
  expect(storage.local + storage.session).not.toContain("DW-");
  expect(storage.cookie).toBe("");
});

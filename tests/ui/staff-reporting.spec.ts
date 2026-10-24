import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
test("unauthenticated staff paths expose only sign-in and no public navigation or queue", async ({
  page,
}) => {
  let queueReads = 0;
  await page.route("**/rest/v1/rpc/staff_signal_queue**", (r) => {
    queueReads++;
    return r.fulfill({ status: 403, body: "denied" });
  });
  for (const path of ["/admin", "/admin/moderation", "/admin/uploads"]) {
    await page.goto(path);
    await expect(
      page.getByRole("heading", { name: "Staff sign in" }),
    ).toBeVisible();
    await expect(page.getByLabel("Staff email")).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Moderation queue" }),
    ).toHaveCount(0);
    await expect(
      page.getByRole("navigation", { name: "Main navigation" }),
    ).toHaveCount(0);
  }
  expect(queueReads).toBe(0);
  await page.setViewportSize({ width: 360, height: 900 });
  expect(
    (await new AxeBuilder({ page }).analyze()).violations.filter((v) =>
      ["critical", "serious"].includes(v.impact ?? ""),
    ),
  ).toEqual([]);
});
test("v2 reporting is closed by default, opt-in and bilingual without storing health fields", async ({
  page,
}) => {
  await page.route("**/rest/v1/reporting_v2_policy**", (r) =>
    r.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ enabled: false, consent_version: "community-v2" }),
    }),
  );
  await page.goto("/report");
  await expect(
    page.getByText("New submissions are not open yet.", { exact: false }),
  ).toBeVisible();
  await expect(page.getByRole("checkbox")).not.toBeChecked();
  await page.getByRole("checkbox").check();
  await expect(
    page.getByRole("button", { name: "Continue to report" }),
  ).toBeDisabled();
  await page.getByRole("button", { name: "Filipino", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Unawain at pumayag" }),
  ).toBeVisible();
  await expect(page.locator("html")).toHaveAttribute("lang", "fil");
  expect(await page.evaluate(() => JSON.stringify(localStorage))).not.toContain(
    "DW2-",
  );
});
test("v2 open-policy preview collects coarse fields only and strips identifying note patterns", async ({
  page,
}) => {
  await page.route("**/rest/v1/reporting_v2_policy**", (r) =>
    r.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ enabled: true, consent_version: "community-v2" }),
    }),
  );
  await page.goto("/report");
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Continue to report" }).click();
  await expect(page.getByLabel("Barangay (coarse area only)")).toBeVisible();
  await expect(page.getByLabel("Symptom-onset date (required)")).toBeVisible();
  await page
    .getByLabel("Short note (optional, 250 characters)")
    .fill("Reach test@example.test or +63 912 345 6789");
  await expect(
    page.getByText("Sanitized note:", { exact: false }),
  ).not.toContainText("test@example.test");
  await expect(
    page.getByText("Sanitized note:", { exact: false }),
  ).toContainText("[email removed]");
  await expect(page.getByLabel("Email address or phone number")).toHaveCount(0);
  await expect(page.getByLabel("Full name")).toHaveCount(0);
  await page.setViewportSize({ width: 360, height: 900 });
  expect(
    (await new AxeBuilder({ page }).analyze()).violations.filter((v) =>
      ["critical", "serious"].includes(v.impact ?? ""),
    ),
  ).toEqual([]);
});

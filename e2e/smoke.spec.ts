import { expect, test } from "@playwright/test";

test("demo → filter failover → open drawer → see candidates", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("Demo data, synthetic")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Router decisions" })).toBeVisible();

  await page.getByRole("link", { name: "Decisions" }).click();
  await expect(page.getByRole("heading", { name: "Decisions" })).toBeVisible();

  await page.getByRole("button", { name: "Failover", exact: true }).click();
  await expect(page.getByText(/of \d+ rows/)).toBeVisible();

  const row = page
    .getByRole("region", { name: "Decisions table" })
    .getByRole("button")
    .filter({ hasText: /failover/i })
    .first();
  await expect(row).toBeVisible();
  await row.click();

  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page.getByText("Candidates")).toBeVisible();
  await expect(
    page.getByText(/Weave exports only the chosen model's score/),
  ).toBeVisible();
  await expect(
    page.getByText(/Router's own note \(verbatim, format may change\)/),
  ).toBeVisible();
});

import { test, expect } from "@playwright/test";

test.describe("Public Pages", () => {
  test("Home page loads and contains title", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("text=Server Wiki").first()).toBeVisible();
    await expect(page.locator("text=Das offizielle Wiki").first()).toBeVisible();
  });

  test("Navigation links work", async ({ page }) => {
    await page.goto("/");
    // Click on 'items' link
    await page.click("text=Items");
    await expect(page).toHaveURL(/.*\/items/);
    await expect(page.locator("h1").filter({ hasText: /Items/i })).toBeVisible();
  });

  test("Dark mode toggle works", async ({ page }) => {
    await page.goto("/");
    const html = page.locator("html");
    const isDarkInitially = await html.evaluate((node) => node.classList.contains("dark"));

    // Find toggle button - title is "Dark Mode umschalten"
    await page.click('button[title="Dark Mode umschalten"]');

    const isDarkAfter = await html.evaluate((node) => node.classList.contains("dark"));
    expect(isDarkAfter).not.toBe(isDarkInitially);
  });
});

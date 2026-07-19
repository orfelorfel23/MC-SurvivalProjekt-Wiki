import { test, expect } from "@playwright/test";

test.describe("Authentication and Access Control", () => {
  test("Login page loads", async ({ page }) => {
    await page.goto("/auth");
    await expect(page.locator("text=Willkommen zurück").first()).toBeVisible();
  });

  test("Unauthenticated user cannot access editor", async ({ page }) => {
    await page.goto("/editor");
    // Header component should show 'Kein Zugriff' message
    await expect(page.locator("text=Kein Zugriff").first()).toBeVisible();
  });
});

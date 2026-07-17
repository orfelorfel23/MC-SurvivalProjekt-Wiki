import { test, expect } from '@playwright/test';

test.describe('Search functionality', () => {
  test('Search page loads and allows input', async ({ page }) => {
    await page.goto('/search');
    await expect(page.locator('h1').filter({ hasText: /Erweiterte Suche/i })).toBeVisible();
    
    // Fill search input
    await page.fill('input[placeholder="Suchbegriff..."]', 'Sword');
    // Wait for debounce
    await page.waitForTimeout(500);
    
    // URL should update
    await expect(page).toHaveURL(/.*q=Sword/);
  });
});

# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: auth.spec.ts >> Authentication and Access Control >> Login page loads
- Location: tests\auth.spec.ts:4:3

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: page.goto: net::ERR_ABORTED; maybe frame was detached?
Call log:
  - navigating to "https://mc-survival-wiki.orfel.de/auth", waiting until "load"

```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test.describe('Authentication and Access Control', () => {
  4  |   test('Login page loads', async ({ page }) => {
> 5  |     await page.goto('/auth');
     |                ^ Error: page.goto: net::ERR_ABORTED; maybe frame was detached?
  6  |     await expect(page.locator('text=Willkommen zurück').first()).toBeVisible();
  7  |   });
  8  | 
  9  |   test('Unauthenticated user cannot access editor', async ({ page }) => {
  10 |     await page.goto('/editor');
  11 |     // Header component should show 'Kein Zugriff' message
  12 |     await expect(page.locator('text=Kein Zugriff').first()).toBeVisible();
  13 |   });
  14 | });
  15 | 
```
import { test, expect } from '@playwright/test';

test('items page loads', async ({ page }) => {
  await page.goto('http://localhost:5173/items');
  await expect(page).toHaveTitle(/Items/i);
});
import { test, expect } from '@playwright/test';

test('landing page loads with hero section', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/Duta/);
  await expect(page.getByText('Viralkan Kontenmu', { exact: true })).toBeVisible();
  await expect(page.locator('text=Mulai Sekarang')).toBeVisible();
});

test('landing page has all sections', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('text=Dipercaya oleh kreator dari')).toBeVisible();
  await expect(page.locator('text=Semua yang Kamu Butuhkan')).toBeVisible();
  await expect(page.locator('text=Cara Kerja')).toBeVisible();
  await expect(page.locator('text=Siap Memviralkan Kontenmu')).toBeVisible();
});

test('footer shows copyright', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('text=© 2026 Duta')).toBeVisible();
});

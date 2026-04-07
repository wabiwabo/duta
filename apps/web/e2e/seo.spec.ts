import { test, expect } from '@playwright/test';

test('robots.txt is accessible', async ({ page }) => {
  const response = await page.goto('/robots.txt');
  expect(response?.status()).toBe(200);
  const text = await response?.text();
  expect(text).toContain('Sitemap:');
  expect(text).toContain('Disallow: /dashboard');
});

test('sitemap.xml is accessible', async ({ page }) => {
  const response = await page.goto('/sitemap.xml');
  expect(response?.status()).toBe(200);
  const text = await response?.text();
  expect(text).toContain('<urlset');
  expect(text).toContain('duta.val.id');
});

test('page has OpenGraph meta tags', async ({ page }) => {
  await page.goto('/');
  const ogTitle = await page.getAttribute('meta[property="og:title"]', 'content');
  expect(ogTitle).toContain('Duta');
});

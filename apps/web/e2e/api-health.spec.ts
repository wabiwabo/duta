import { test, expect } from '@playwright/test';

test('API health endpoint returns 200', async ({ request }) => {
  const response = await request.get('https://api.duta.val.id/api/health');
  expect(response.status()).toBe(200);
});

test('API docs are accessible', async ({ request }) => {
  const response = await request.get('https://api.duta.val.id/api/docs');
  expect(response.status()).toBe(200);
});

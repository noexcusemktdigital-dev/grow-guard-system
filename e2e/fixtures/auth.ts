import { Page } from '@playwright/test';
import { E2EUser } from './users';

export async function login(page: Page, user: E2EUser) {
  await page.goto('/auth');
  await page.fill('input[type="email"]', user.email);
  await page.fill('input[type="password"]', user.password);
  await page.click('button[type="submit"]');
  await page.waitForURL((url) => !url.pathname.startsWith('/auth'), { timeout: 10000 });
}

export async function logout(page: Page) {
  await page.goto('/');
  await page.click('[aria-label="logout"], [data-testid="logout"]').catch(() => {
    // Fallback: clear storage
    return page.evaluate(() => { localStorage.clear(); sessionStorage.clear(); });
  });
}

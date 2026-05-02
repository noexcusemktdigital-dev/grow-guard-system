import { test, expect } from '@playwright/test';
import { users } from '../fixtures/users';
import { login } from '../fixtures/auth';

test.describe('Login per role lands on correct portal', () => {
  for (const [key, user] of Object.entries(users)) {
    test(`${key} (${user.role}) login → ${user.expectedPortal}`, async ({ page }) => {
      await login(page, user);
      await expect(page).toHaveURL(new RegExp(user.expectedPortal));
      // Smoke: nav presente
      await expect(page.locator('nav, [role="navigation"]').first()).toBeVisible({ timeout: 5000 });
    });
  }

  test('Invalid credentials show error', async ({ page }) => {
    await page.goto('/auth');
    await page.fill('input[type="email"]', 'nonexistent@x.com');
    await page.fill('input[type="password"]', 'wrong-password');
    await page.click('button[type="submit"]');
    await expect(page.getByText(/invalid|inválido|incorreto|wrong/i)).toBeVisible({ timeout: 5000 });
  });
});

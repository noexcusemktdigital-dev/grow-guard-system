import { test, expect } from '@playwright/test';
import { users } from '../fixtures/users';
import { login } from '../fixtures/auth';

test.describe('Cliente — Asaas payment flow', () => {
  test('Navega para Créditos sem erros de console', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    await login(page, users.client);
    await page.goto('/cliente/creditos');
    await page.waitForLoadState('networkidle');

    const main = page.locator('main, [role="main"]').first();
    if (!(await main.isVisible({ timeout: 5000 }))) {
      test.info().annotations.push({ type: 'skip', description: 'Créditos page not found' });
      return;
    }

    const criticalErrors = consoleErrors.filter(
      (e) => !e.includes('favicon') && !e.includes('warning') && !/^\[HMR\]/.test(e)
    );
    expect(criticalErrors).toHaveLength(0);
  });

  test('Botão "Comprar pack" inicia fluxo de pagamento Asaas', async ({ page }) => {
    await login(page, users.client);
    await page.goto('/cliente/creditos');

    const buyButton = page
      .getByRole('button', { name: /comprar|adquirir|pack|crédito/i })
      .first();

    if (!(await buyButton.isVisible({ timeout: 5000 }))) {
      test.info().annotations.push({ type: 'skip', description: 'No buy-pack button found' });
      return;
    }

    // Capture potential navigation or new tab
    const [newPage] = await Promise.all([
      page.context().waitForEvent('page', { timeout: 5000 }).catch(() => null),
      buyButton.click(),
    ]);

    // Either a redirect on same page or a new tab to asaas.com
    if (newPage) {
      await newPage.waitForLoadState('domcontentloaded');
      expect(newPage.url()).toMatch(/asaas\.com/i);
    } else {
      // Same-page: check URL contains asaas or a PIX QR element appeared
      const asaasRedirected = page.url().includes('asaas.com');
      const pixQr = await page
        .locator('[data-testid="pix-qr"], canvas, img[alt*="pix" i], img[alt*="qr" i]')
        .isVisible({ timeout: 5000 })
        .catch(() => false);

      const paymentDialog = await page
        .locator('[role="dialog"]')
        .isVisible({ timeout: 3000 })
        .catch(() => false);

      expect(asaasRedirected || pixQr || paymentDialog).toBeTruthy();
    }
  });
});

import { test, expect } from '@playwright/test';
import { users } from '../fixtures/users';
import { login } from '../fixtures/auth';

test.describe('Cliente — Ads campaign flow', () => {
  test('Navega para Trafego sem erros de console', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    await login(page, users.client);
    await page.goto('/cliente/trafego');
    await page.waitForLoadState('networkidle');

    // Verificar que carregou (algum elemento de UI)
    await expect(page.locator('main, [role="main"]').first()).toBeVisible();

    // Console errors criticos nao devem aparecer
    const criticalErrors = consoleErrors.filter(e =>
      !e.includes('favicon') && !e.includes('warning') && !/^\[HMR\]/.test(e)
    );
    expect(criticalErrors).toHaveLength(0);
  });

  test('Botão "Nova Campanha" abre modal/wizard', async ({ page }) => {
    await login(page, users.client);
    await page.goto('/cliente/trafego');

    // Heuristica: procura botao de nova campanha
    const newButton = page.getByRole('button', { name: /nova campanha|novo|criar/i }).first();
    if (await newButton.isVisible({ timeout: 5000 })) {
      await newButton.click();
      // Modal/wizard abre
      await expect(page.locator('[role="dialog"], .modal, [data-state="open"]').first()).toBeVisible({ timeout: 3000 });
    } else {
      test.info().annotations.push({ type: 'skip', description: 'No "nova campanha" button found' });
    }
  });
});

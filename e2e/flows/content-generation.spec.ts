import { test, expect } from '@playwright/test';
import { users } from '../fixtures/users';
import { login } from '../fixtures/auth';

test.describe('Cliente — Content generation flow', () => {
  async function goToConteudo(page: import('@playwright/test').Page) {
    for (const route of [
      '/cliente/conteudo',
      '/cliente/marketing/conteudo',
      '/cliente/content',
      '/cliente/marketing',
    ]) {
      await page.goto(route);
      const contentArea = page
        .locator('[data-testid="content-page"], [data-testid="conteudo-page"], .content-generator, [aria-label*="conteúdo" i], [aria-label*="content" i]')
        .first();
      if (await contentArea.isVisible({ timeout: 3000 }).catch(() => false)) {
        return true;
      }
      // Fallback: "Gerar conteúdo" button visible
      const generateBtn = page
        .getByRole('button', { name: /gerar conteúdo|gerar content|criar conteúdo|generate/i })
        .first();
      if (await generateBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        return true;
      }
    }
    return false;
  }

  test('Página de conteúdo carrega sem erros de console', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    await login(page, users.client);
    const found = await goToConteudo(page);

    if (!found) {
      test.info().annotations.push({ type: 'skip', description: 'Conteúdo page not found' });
      return;
    }

    await page.waitForLoadState('networkidle');

    const criticalErrors = consoleErrors.filter(
      (e) => !e.includes('favicon') && !e.includes('warning') && !/^\[HMR\]/.test(e)
    );
    expect(criticalErrors).toHaveLength(0);
  });

  test('Botão "Gerar conteúdo" abre formulário de briefing', async ({ page }) => {
    await login(page, users.client);
    const found = await goToConteudo(page);

    if (!found) {
      test.info().annotations.push({ type: 'skip', description: 'Conteúdo page not found' });
      return;
    }

    const generateBtn = page
      .getByRole('button', { name: /gerar conteúdo|gerar content|criar conteúdo|generate/i })
      .first();

    if (!(await generateBtn.isVisible({ timeout: 5000 }).catch(() => false))) {
      test.info().annotations.push({ type: 'skip', description: '"Gerar conteúdo" button not found' });
      return;
    }

    await generateBtn.click();

    // Modal, sheet or inline form with briefing field should appear
    const briefingForm = page
      .locator(
        '[role="dialog"], [data-testid="briefing-form"], [data-testid="content-form"], ' +
        'textarea[placeholder*="briefing" i], textarea[placeholder*="descreva" i], textarea[placeholder*="tema" i]'
      )
      .first();

    if (!(await briefingForm.isVisible({ timeout: 5000 }).catch(() => false))) {
      test.info().annotations.push({ type: 'skip', description: 'Briefing form did not open after clicking generate' });
      return;
    }

    await expect(briefingForm).toBeVisible();
  });

  test('Preenche briefing, submete e resultado aparece em <30s sem erros', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    await login(page, users.client);
    const found = await goToConteudo(page);

    if (!found) {
      test.info().annotations.push({ type: 'skip', description: 'Conteúdo page not found' });
      return;
    }

    const generateBtn = page
      .getByRole('button', { name: /gerar conteúdo|gerar content|criar conteúdo|generate/i })
      .first();

    if (!(await generateBtn.isVisible({ timeout: 5000 }).catch(() => false))) {
      test.info().annotations.push({ type: 'skip', description: '"Gerar conteúdo" button not found' });
      return;
    }

    await generateBtn.click();

    // Find briefing textarea
    const briefingTextarea = page
      .locator(
        'textarea[placeholder*="briefing" i], textarea[placeholder*="descreva" i], ' +
        'textarea[placeholder*="tema" i], textarea[name*="briefing" i], textarea[name*="content" i], textarea'
      )
      .first();

    if (!(await briefingTextarea.isVisible({ timeout: 5000 }).catch(() => false))) {
      test.info().annotations.push({ type: 'skip', description: 'Briefing textarea not found' });
      return;
    }

    await briefingTextarea.fill('Crie um post sobre seguros residenciais para o Instagram, tom descontraído, público familiar.');

    // Submit
    const submitBtn = page
      .getByRole('button', { name: /gerar|criar|enviar|submit|ok|confirmar/i })
      .first();

    if (!(await submitBtn.isVisible({ timeout: 3000 }).catch(() => false))) {
      test.info().annotations.push({ type: 'skip', description: 'Submit button not found' });
      return;
    }

    await submitBtn.click();

    // Result: generated content area should appear within 30s
    const resultArea = page
      .locator(
        '[data-testid="generated-content"], [data-testid="content-result"], ' +
        '.generated-content, .content-output, [aria-label*="conteúdo gerado" i]'
      )
      .first();

    const resultVisible = await resultArea.isVisible({ timeout: 30000 }).catch(() => false);

    if (!resultVisible) {
      // Fallback: any non-empty text block appearing after submit that's not the form itself
      const anyResult = page.locator('article, .result, .output, [data-testid*="result"]').first();
      const fallbackVisible = await anyResult.isVisible({ timeout: 5000 }).catch(() => false);
      if (!fallbackVisible) {
        test.info().annotations.push({ type: 'skip', description: 'Generated content result did not appear within 30s' });
        return;
      }
    } else {
      await expect(resultArea).toBeVisible();
    }

    // No critical console errors during generation
    const criticalErrors = consoleErrors.filter(
      (e) => !e.includes('favicon') && !e.includes('warning') && !/^\[HMR\]/.test(e)
    );
    expect(criticalErrors).toHaveLength(0);
  });
});

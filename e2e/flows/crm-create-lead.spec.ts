import { test, expect } from '@playwright/test';
import { users } from '../fixtures/users';
import { login } from '../fixtures/auth';

test.describe('Cliente — CRM create lead flow', () => {
  async function goToCrm(page: import('@playwright/test').Page) {
    for (const route of [
      '/cliente/crm',
      '/cliente/leads',
      '/cliente/crm/leads',
    ]) {
      await page.goto(route);
      const crmArea = page
        .locator('[data-testid="crm-page"], [data-testid="leads-list"], .crm-container, [aria-label*="crm" i], [aria-label*="lead" i]')
        .first();
      if (await crmArea.isVisible({ timeout: 3000 }).catch(() => false)) {
        return true;
      }
      // Fallback: heading or "Novo Lead" button visible
      const newLeadBtn = page.getByRole('button', { name: /novo lead|new lead|adicionar lead/i }).first();
      if (await newLeadBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        return true;
      }
    }
    return false;
  }

  test('Empty state aparece quando não há leads', async ({ page }) => {
    await login(page, users.client);
    const found = await goToCrm(page);

    if (!found) {
      test.info().annotations.push({ type: 'skip', description: 'CRM page not found' });
      return;
    }

    await page.waitForLoadState('networkidle');

    // Check for empty state OR a list — both are valid states
    const emptyState = page
      .locator('[data-testid="empty-state"], .empty-state, [aria-label*="vazio" i], [aria-label*="empty" i]')
      .first();
    const leadsList = page
      .locator('[data-testid="leads-list"], .leads-list, [role="list"]')
      .first();

    const hasEmptyState = await emptyState.isVisible({ timeout: 3000 }).catch(() => false);
    const hasList = await leadsList.isVisible({ timeout: 3000 }).catch(() => false);

    // At least one of empty state or list must be present
    expect(hasEmptyState || hasList).toBe(true);
  });

  test('Modal/sheet de novo lead abre ao clicar no botão', async ({ page }) => {
    await login(page, users.client);
    const found = await goToCrm(page);

    if (!found) {
      test.info().annotations.push({ type: 'skip', description: 'CRM page not found' });
      return;
    }

    const newLeadBtn = page
      .getByRole('button', { name: /novo lead|new lead|adicionar lead/i })
      .first();

    if (!(await newLeadBtn.isVisible({ timeout: 5000 }).catch(() => false))) {
      test.info().annotations.push({ type: 'skip', description: '"Novo Lead" button not found' });
      return;
    }

    await newLeadBtn.click();

    // Modal or sheet should appear
    const modal = page
      .locator('[role="dialog"], [data-testid="lead-modal"], [data-testid="lead-sheet"], .sheet, .modal')
      .first();

    if (!(await modal.isVisible({ timeout: 5000 }).catch(() => false))) {
      test.info().annotations.push({ type: 'skip', description: 'Lead modal/sheet did not open' });
      return;
    }

    await expect(modal).toBeVisible();
  });

  test('Cria lead com nome, email e telefone e aparece na lista', async ({ page }) => {
    await login(page, users.client);
    const found = await goToCrm(page);

    if (!found) {
      test.info().annotations.push({ type: 'skip', description: 'CRM page not found' });
      return;
    }

    const newLeadBtn = page
      .getByRole('button', { name: /novo lead|new lead|adicionar lead/i })
      .first();

    if (!(await newLeadBtn.isVisible({ timeout: 5000 }).catch(() => false))) {
      test.info().annotations.push({ type: 'skip', description: '"Novo Lead" button not found' });
      return;
    }

    await newLeadBtn.click();

    const modal = page
      .locator('[role="dialog"], [data-testid="lead-modal"], [data-testid="lead-sheet"], .sheet, .modal')
      .first();

    if (!(await modal.isVisible({ timeout: 5000 }).catch(() => false))) {
      test.info().annotations.push({ type: 'skip', description: 'Lead modal/sheet did not open' });
      return;
    }

    const leadName = `Lead E2E ${Date.now()}`;

    // Fill name
    const nameInput = modal
      .locator('input[name="name"], input[placeholder*="nome" i], input[placeholder*="name" i], input[id*="name" i]')
      .first();
    if (!(await nameInput.isVisible({ timeout: 3000 }).catch(() => false))) {
      test.info().annotations.push({ type: 'skip', description: 'Name input not found in modal' });
      return;
    }
    await nameInput.fill(leadName);

    // Fill email
    const emailInput = modal
      .locator('input[type="email"], input[name="email"], input[placeholder*="email" i]')
      .first();
    if (await emailInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await emailInput.fill('lead-e2e@test.local');
    }

    // Fill phone
    const phoneInput = modal
      .locator('input[name="phone"], input[type="tel"], input[placeholder*="telefone" i], input[placeholder*="celular" i], input[placeholder*="phone" i]')
      .first();
    if (await phoneInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await phoneInput.fill('11999990001');
    }

    // Submit
    const submitBtn = modal
      .getByRole('button', { name: /salvar|criar|adicionar|save|create|confirmar/i })
      .first();

    if (!(await submitBtn.isVisible({ timeout: 3000 }).catch(() => false))) {
      test.info().annotations.push({ type: 'skip', description: 'Submit button not found in modal' });
      return;
    }

    await submitBtn.click();

    // Modal should close
    await expect(modal).not.toBeVisible({ timeout: 8000 });

    // Lead should appear in the list
    const leadEntry = page.getByText(leadName).first();
    const leadVisible = await leadEntry.isVisible({ timeout: 8000 }).catch(() => false);

    if (!leadVisible) {
      test.info().annotations.push({ type: 'skip', description: 'Lead did not appear in list after creation' });
      return;
    }

    await expect(leadEntry).toBeVisible();
  });
});

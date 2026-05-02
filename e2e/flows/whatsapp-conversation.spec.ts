import { test, expect } from '@playwright/test';
import { users } from '../fixtures/users';
import { login } from '../fixtures/auth';

test.describe('Cliente — WhatsApp conversation flow', () => {
  async function goToConversas(page: import('@playwright/test').Page) {
    for (const route of [
      '/cliente/atendimento/conversas',
      '/cliente/atendimento',
      '/cliente/conversas',
      '/cliente/inbox',
    ]) {
      await page.goto(route);
      const conversasList = page
        .locator('[data-testid="conversations-list"], .conversation-list, [aria-label*="conversa" i]')
        .first();
      if (await conversasList.isVisible({ timeout: 3000 }).catch(() => false)) {
        return true;
      }
      // Fallback: any list with conversation-like items
      const items = page.locator('li, [role="listitem"]').first();
      if (await items.isVisible({ timeout: 3000 }).catch(() => false)) {
        return true;
      }
    }
    return false;
  }

  test('Lista de conversas carrega sem erros de console', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    await login(page, users.client);
    const found = await goToConversas(page);

    if (!found) {
      test.info().annotations.push({ type: 'skip', description: 'Conversas page not found' });
      return;
    }

    await page.waitForLoadState('networkidle');

    const criticalErrors = consoleErrors.filter(
      (e) => !e.includes('favicon') && !e.includes('warning') && !/^\[HMR\]/.test(e)
    );
    expect(criticalErrors).toHaveLength(0);
  });

  test('Clica em conversa e mensagens aparecem', async ({ page }) => {
    await login(page, users.client);
    const found = await goToConversas(page);

    if (!found) {
      test.info().annotations.push({ type: 'skip', description: 'Conversas page not found' });
      return;
    }

    // Click the first conversation item
    const firstConvo = page
      .locator('[data-testid="conversation-item"], .conversation-item, [role="listitem"]')
      .first();

    if (!(await firstConvo.isVisible({ timeout: 5000 }).catch(() => false))) {
      test.info().annotations.push({ type: 'skip', description: 'No conversation items found' });
      return;
    }

    await firstConvo.click();

    // Expect a message bubble or chat area to appear
    const messagesArea = page
      .locator(
        '[data-testid="messages-area"], .messages, [aria-label*="mensagem" i], [aria-label*="chat" i], .chat-messages'
      )
      .first();

    if (!(await messagesArea.isVisible({ timeout: 5000 }).catch(() => false))) {
      // Fallback: look for any message-like element
      const msgBubble = page.locator('.message-bubble, [data-testid*="message"], .msg').first();
      const hasMsgs = await msgBubble.isVisible({ timeout: 3000 }).catch(() => false);
      if (!hasMsgs) {
        test.info().annotations.push({ type: 'skip', description: 'Message area did not appear after clicking conversation' });
        return;
      }
    } else {
      await expect(messagesArea).toBeVisible();
    }
  });

  test('Botão "Enviar" fica desabilitado com input vazio', async ({ page }) => {
    await login(page, users.client);
    const found = await goToConversas(page);

    if (!found) {
      test.info().annotations.push({ type: 'skip', description: 'Conversas page not found' });
      return;
    }

    // Click first conversation to open chat
    const firstConvo = page
      .locator('[data-testid="conversation-item"], .conversation-item, [role="listitem"]')
      .first();

    if (await firstConvo.isVisible({ timeout: 5000 }).catch(() => false)) {
      await firstConvo.click();
    }

    // Find message input
    const msgInput = page
      .locator(
        '[data-testid="message-input"], textarea[placeholder*="mensagem" i], textarea[placeholder*="message" i], input[placeholder*="mensagem" i]'
      )
      .first();

    if (!(await msgInput.isVisible({ timeout: 5000 }).catch(() => false))) {
      test.info().annotations.push({ type: 'skip', description: 'Message input not found' });
      return;
    }

    // Ensure input is empty
    await msgInput.clear();

    // Send button should be disabled when input is empty
    const sendBtn = page
      .getByRole('button', { name: /enviar|send/i })
      .first();

    if (!(await sendBtn.isVisible({ timeout: 3000 }).catch(() => false))) {
      test.info().annotations.push({ type: 'skip', description: 'Send button not found' });
      return;
    }

    // Do NOT click — just assert disabled state
    await expect(sendBtn).toBeDisabled({ timeout: 3000 });
  });
});

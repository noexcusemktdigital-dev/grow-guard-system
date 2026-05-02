import { test, expect } from '@playwright/test';
import { users } from '../fixtures/users';
import { login, logout } from '../fixtures/auth';

test.describe('Cross-tenant isolation', () => {
  test('client A cannot access client B resources via direct URL', async ({ page, context }) => {
    // Login como client A, capturar org_id
    await login(page, users.client);
    await page.waitForURL(/\/cliente/);
    const clientAOrgId = await page.evaluate(() => {
      // Heuristica: pegar de localStorage ou body data attribute
      return localStorage.getItem('current_org_id') ?? 'unknown';
    });

    await logout(page);

    // Login como client B
    await login(page, users.otherClient);
    await page.waitForURL(/\/cliente/);

    // Tentar acessar URL de A diretamente — deve falhar (404, 403 ou redirect)
    if (clientAOrgId !== 'unknown') {
      const response = await page.goto(`/cliente/organizations/${clientAOrgId}/dashboard`);
      // Aceita: 404, 403, ou redirect pra /cliente raiz (nao ve dados)
      const url = page.url();
      expect(url).not.toContain(clientAOrgId);
    }
    // Verificar que nao ha vazamento obvio
    await expect(page.getByText(/access denied|não autorizado|forbidden/i)).toBeVisible({ timeout: 3000 }).catch(() => {
      // Se nao exibir mensagem, deve ter redirecionado
      expect(page.url()).toMatch(/\/cliente\/?$/);
    });
  });

  test('Direct API call with wrong org_id returns 403', async ({ page, request }) => {
    await login(page, users.client);
    // Pegar JWT do localStorage
    const token = await page.evaluate(() => {
      const keys = Object.keys(localStorage);
      for (const k of keys) {
        if (k.includes('supabase.auth.token')) {
          const v = localStorage.getItem(k);
          try { return JSON.parse(v ?? '{}').access_token; } catch { return null; }
        }
      }
      return null;
    });

    if (!token) {
      test.skip();
      return;
    }

    // Tentar criar charge com org_id aleatorio (nao pertence ao user)
    const fakeOrgId = '00000000-0000-0000-0000-000000000000';
    const response = await request.post(`${process.env.BASE_URL}/functions/v1/asaas-create-charge`, {
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      data: { organization_id: fakeOrgId, value: 10, description: 'test', due_date: '2030-01-01' },
    });

    expect([403, 404, 401]).toContain(response.status());
  });
});

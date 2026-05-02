// Credenciais por role — lidas de env (CI_E2E_USER_*) ou defaults locais para staging.
//
// CI workflow define secrets:
//   CI_E2E_SUPER_ADMIN_EMAIL / CI_E2E_SUPER_ADMIN_PASSWORD
//   CI_E2E_ADMIN_EMAIL / CI_E2E_ADMIN_PASSWORD
//   CI_E2E_FRANQUEADO_EMAIL / CI_E2E_FRANQUEADO_PASSWORD
//   CI_E2E_CLIENT_EMAIL / CI_E2E_CLIENT_PASSWORD
//   CI_E2E_OTHER_CLIENT_EMAIL / CI_E2E_OTHER_CLIENT_PASSWORD
//
// Em local: copiar para .env e usar staging credentials (NUNCA prod).

export interface E2EUser {
  email: string;
  password: string;
  role: 'super_admin' | 'admin' | 'franqueado' | 'cliente_admin' | 'cliente_user';
  expectedPortal: '/franqueadora' | '/franqueado' | '/cliente';
}

export const users: Record<string, E2EUser> = {
  superAdmin: {
    email: process.env.CI_E2E_SUPER_ADMIN_EMAIL ?? 'super@noexcuse-test.local',
    password: process.env.CI_E2E_SUPER_ADMIN_PASSWORD ?? 'change-me',
    role: 'super_admin',
    expectedPortal: '/franqueadora',
  },
  admin: {
    email: process.env.CI_E2E_ADMIN_EMAIL ?? 'admin@noexcuse-test.local',
    password: process.env.CI_E2E_ADMIN_PASSWORD ?? 'change-me',
    role: 'admin',
    expectedPortal: '/franqueadora',
  },
  franqueado: {
    email: process.env.CI_E2E_FRANQUEADO_EMAIL ?? 'franqueado@noexcuse-test.local',
    password: process.env.CI_E2E_FRANQUEADO_PASSWORD ?? 'change-me',
    role: 'franqueado',
    expectedPortal: '/franqueado',
  },
  client: {
    email: process.env.CI_E2E_CLIENT_EMAIL ?? 'client@noexcuse-test.local',
    password: process.env.CI_E2E_CLIENT_PASSWORD ?? 'change-me',
    role: 'cliente_admin',
    expectedPortal: '/cliente',
  },
  otherClient: {
    email: process.env.CI_E2E_OTHER_CLIENT_EMAIL ?? 'client2@noexcuse-test.local',
    password: process.env.CI_E2E_OTHER_CLIENT_PASSWORD ?? 'change-me',
    role: 'cliente_admin',
    expectedPortal: '/cliente',
  },
};

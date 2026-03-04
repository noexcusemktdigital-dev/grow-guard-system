## ✅ Prioridade 10 — CONCLUÍDA

30 testes passando: ProtectedRoute (7), Auth (6), SaasAuth (7), CrmNewLeadDialog (4), OnboardingEtapas (5), example (1).

# Prioridade 10: Testes Automatizados — Login, Leads, Onboarding

## Escopo

Criar testes unitarios/integracao com Vitest + React Testing Library para os 3 fluxos criticos, cobrindo os 3 portais. Os testes validam renderizacao, interacao de formularios e chamadas ao backend (mockado).

## Estrategia

Todos os testes usam **mocks do Supabase** (vi.mock) — nenhuma chamada real ao backend. Isso garante velocidade e determinismo. Cada teste valida:
- Renderizacao correta dos elementos do formulario
- Validacao de campos obrigatorios
- Chamada correta ao Supabase com os dados esperados
- Feedback visual (toasts, navegacao, estados de loading)

## Arquivos a Criar

| Arquivo | Cobertura |
|---------|-----------|
| `src/test/helpers.tsx` | Wrapper com providers (QueryClient, Router, AuthContext) para reutilizar nos testes |
| `src/pages/__tests__/Auth.test.tsx` | Login franqueadora/franqueado: renderiza form, submete credenciais, trata erro |
| `src/pages/__tests__/SaasAuth.test.tsx` | Login + Signup SaaS: tabs, validacao de senha, aceite de termos, signup provisions |
| `src/components/crm/__tests__/CrmNewLeadDialog.test.tsx` | Criacao de leads: valida campos, chama createLead, funciona igual nos 3 portais |
| `src/components/onboarding/__tests__/OnboardingEtapas.test.tsx` | Toggle checklist, progresso por fase |
| `src/contexts/__tests__/AuthContext.test.tsx` | Role resolution, signOut, fetchProfileAndRole |
| `src/components/__tests__/ProtectedRoute.test.tsx` | Redirect por role, loading state, acesso negado |

## Detalhes por Teste

### 1. Test Helper (`src/test/helpers.tsx`)
- `renderWithProviders(ui, { route, authOverrides })` — wrappa com `BrowserRouter`, `QueryClientProvider`, `AuthContext.Provider`
- Permite injetar `user`, `role`, `profile` para simular cada portal

### 2. Auth.test.tsx (Franqueadora/Franqueado login)
- Renderiza campos email/senha e botao "Entrar"
- Submissao chama `supabase.auth.signInWithPassword`
- Erro mostra toast "Credenciais invalidas"
- Sucesso navega para "/"
- Modo "Esqueci minha senha" renderiza form de recuperacao

### 3. SaasAuth.test.tsx (SaaS/Cliente)
- Tab "Entrar" renderiza login form
- Tab "Criar conta" renderiza signup form com nome, empresa, termos
- Senha < 6 chars mostra erro
- Termos nao aceitos desabilita botao
- Signup chama `signUp` + `invoke("signup-saas")`
- Apos signup mostra tela "Verifique seu email"

### 4. CrmNewLeadDialog.test.tsx
- Renderiza dialog com campos Nome, Telefone, Email, Empresa, Valor, Origem
- Submit sem nome mostra toast de erro
- Submit com dados validos chama `createLead.mutate` com os campos corretos
- Funciona identicamente nos 3 portais (mesmo componente)

### 5. OnboardingEtapas.test.tsx
- Renderiza 4 fases collapsiveis
- Toggle de checkbox chama onChange com item atualizado
- Fase completa mostra badge "Completa"

### 6. ProtectedRoute.test.tsx
- Sem user → redirect para `/acessofranquia`
- User admin sem role permitida → redirect para `/franqueadora/dashboard`
- User franqueado acessando rota de admin → redirect para `/franqueado/dashboard`
- User com role permitida → renderiza children

## Ordem de Execucao

1. Criar `src/test/helpers.tsx`
2. `ProtectedRoute.test.tsx` (mais simples, valida infra de testes)
3. `Auth.test.tsx`
4. `SaasAuth.test.tsx`
5. `CrmNewLeadDialog.test.tsx`
6. `OnboardingEtapas.test.tsx`
7. Rodar testes para validar


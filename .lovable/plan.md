

# Prioridade 10b: Teste do Wizard de Onboarding de Unidade

## Situacao Atual

Os testes existentes (30 testes, 6 suites) ja cobrem:
- Login franqueadora/franqueado (Auth.test.tsx — 6 testes)
- Login/signup SaaS (SaasAuth.test.tsx — 6 testes)
- Criacao de leads (CrmNewLeadDialog.test.tsx — 4 testes)
- Checklist de onboarding (OnboardingEtapas.test.tsx — 5 testes)
- Rotas protegidas (ProtectedRoute.test.tsx — 7 testes)

**Falta**: O wizard de provisionamento de unidade em `Unidades.tsx` — o fluxo de 3 etapas (Dados da Unidade, Dados do Responsavel, Config Financeira) que chama `provision-unit`.

## Plano

Criar `src/pages/__tests__/Unidades.test.tsx` com os seguintes cenarios:

| Teste | O que valida |
|-------|-------------|
| Renderiza lista vazia com botao "Nova Unidade" | Estado inicial sem unidades |
| Abre wizard no passo 1 ao clicar "Nova Unidade" | Dialog aparece com campos de dados da unidade |
| Valida nome obrigatorio no passo 1 | Toast de erro se nome vazio ao clicar "Proximo" |
| Avanca para passo 2 com nome preenchido | Campos de responsavel aparecem |
| Valida nome e email obrigatorios no passo 2 | Toast de erro se vazios ao clicar "Proximo" |
| Avanca para passo 3 com dados preenchidos | Campos financeiros aparecem |
| Chama provision-unit ao finalizar | `supabase.functions.invoke` recebe payload correto |
| Mostra tela de sucesso (passo 4) | Credenciais temporarias exibidas |

### Mocks necessarios

- `useUnits` — retorna lista vazia
- `useUserOrgId` — retorna org-id fixo
- `supabase.functions.invoke` — retorna `{ temp_password: "abc123" }`
- `useToast` — captura toasts de validacao
- `useQueryClient` — mock do invalidateQueries

### Arquivo

`src/pages/__tests__/Unidades.test.tsx` — ~8 testes cobrindo o wizard completo de provisionamento de unidade.


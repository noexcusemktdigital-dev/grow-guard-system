

# Bloco 6 — Migrar Sidebar e FeatureGate + Limpar componentes filhos

## Situacao atual

Blocos 1-5 estao completos: todas as **paginas** (Franqueadora, Franqueado, Cliente) foram migradas para hooks reais. Porem, ainda restam:

1. **`ClienteSidebar.tsx`** e **`FeatureGateContext.tsx`** — importam `mockSubscription`, `mockWallet`, `getTrialDaysRemaining` de `clienteData`
2. **~60 componentes filhos** — importam **tipos e constantes** de `@/data/*` (ex: `CrmKanban`, `CrmLeadDetail`, `AcademyAdmin`, `AtendimentoKanban`, etc.)

## O que sera feito

### 1. Migrar FeatureGateContext.tsx
- Remover import de `mockSubscription` e `mockWallet`
- Usar `useClienteSubscription` e `useClienteWallet` para obter dados reais
- Manter os toggles de demo (`simulateTrialExpired`, `simulateNoCredits`)

### 2. Migrar ClienteSidebar.tsx
- Remover import de `clienteData`
- Usar `useClienteSubscription` e `useClienteWallet` para trial banner e creditos
- Calcular `trialDays` a partir de `subscription.trial_end` real

### 3. Limpar componentes filhos (tipos e constantes)
Os componentes filhos importam principalmente **tipos TypeScript** e **constantes de configuracao** (cores, stages de funil, icones). Estrategia:

- Mover tipos compartilhados para `src/types/` (ex: `crm.ts`, `academy.ts`, `atendimento.ts`)
- Mover constantes de UI (cores, labels) para os proprios componentes ou para `src/constants/`
- Remover funcoes de mock data dos arquivos `@/data/*`

Principais componentes afetados:
- `CrmKanban`, `CrmList`, `CrmLeadDetail`, `CrmConfig`, `CrmAlerts` — tipos e constantes de CRM
- `AcademyAdmin`, `AcademyQuiz`, `AcademyJourney`, `AcademyModuleDetail`, `AcademyReports` — tipos de Academy
- `AtendimentoKanban`, `AtendimentoList`, `AtendimentoDetail`, `AtendimentoConfig` — tipos de Atendimento
- `AgendaSidebar`, `AgendaCalendar`, `AgendaEventForm` — tipos de Agenda
- `ComunicadosList`, `ComunicadoForm`, `ComunicadoDetail` — constantes de cores
- `OnboardingIndicadores`, `OnboardingList`, `OnboardingEtapas` — tipos de Onboarding
- `UnidadesList`, `UnidadeDocumentos`, `UnidadeUsuarios`, `UnidadeFinanceiro` — tipos de Unidades
- `MatrizSpecialPermissions`, `MatrizUserList`, `MatrizProfiles` — tipos de Matriz
- `ContratosRepositorio` — constantes de contratos
- `MetasCampaigns`, `MetasGoals`, `MetasRankingView`, `MetasDashboard`, `MetasConfig` — tipos de Metas

### 4. Resultado final
- Nenhum componente importando de `@/data/*` para dados mock
- Arquivos `@/data/*` podem ser deletados ou mantidos apenas como referencia de tipos (se necessario)

## Detalhes tecnicos

- `FeatureGateContext` passara a receber `subscription` e `wallet` como props ou usara hooks internamente
- `ClienteSidebar` mostrara skeleton enquanto carrega dados de subscription/wallet
- Tipos serao extraidos dos arquivos `@/data/*` para `src/types/*.ts` mantendo compatibilidade com os componentes existentes
- Constantes de UI (cores de status, labels) irao para `src/constants/*.ts`

## Ordem de execucao
1. Criar arquivos de tipos em `src/types/`
2. Criar arquivos de constantes em `src/constants/`
3. Atualizar FeatureGateContext e ClienteSidebar
4. Atualizar componentes filhos (em lotes por dominio)
5. Verificar build limpo


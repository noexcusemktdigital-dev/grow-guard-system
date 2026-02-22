# Plan — Estado Atual e Proximos Blocos

## Blocos Concluidos (1-7)

- **Bloco 1-3**: Paginas da Franqueadora migradas para hooks reais (`useFinance`, `useContracts`, `useUnits`, `useGoals`, `useMarketing`, `usePermissions`, `useOnboarding`, `useSupportTickets`, `useAnnouncements`, `useCrmLeads`, `useCrmFunnels`, `useCrmActivities`, `useCrmTasks`, `useCalendar`, `useAcademy`, `useDailyMessages`)
- **Bloco 4**: Paginas do Franqueado migradas para hooks reais
- **Bloco 5**: Paginas do Cliente migradas para hooks reais (`useClienteSubscription`, `useClienteWallet`, `useClienteContent`, `useClienteCrm`, `useClienteDispatches`, `useClienteScripts`)
- **Bloco 6**: `FeatureGateContext.tsx` e `ClienteSidebar.tsx` migrados para hooks reais; tipos movidos para `src/types/`
- **Bloco 7**: Diretorio `src/data/` eliminado; todos os imports migrados para `src/mocks/`; 11 mocks nao usados deletados

## Estado Atual

- 25 hooks em `src/hooks/` conectados ao banco de dados
- 14 tipos em `src/types/`
- 14 arquivos mock restantes em `src/mocks/` (usados por 35 componentes)
- 0 imports de `@/data/`
- Helpers em `src/lib/helpers/` (agenda, academy, crm)

## Proximos Blocos

### Bloco 8 — Migrar componentes filhos para dados reais (por dominio)

Substituir imports de `@/mocks/*` por hooks reais nos ~35 componentes restantes. Execucao em lotes:

- **Lote 1**: CRM (CrmLeadDetail, CrmKanban, CrmList, CrmAlerts, CrmConfig) — usar `useCrmLeads`, `useCrmActivities`, `useCrmTasks`, `useCrmFunnels`
- **Lote 2**: Academy (AcademyAdmin, AcademyLesson, AcademyModuleDetail, AcademyCertificates, AcademyQuiz, AcademyReports, AcademyJourney, AcademyModules) — usar `useAcademy`
- **Lote 3**: Agenda (AgendaCalendar, AgendaEventForm, AgendaEventDetail, AgendaListView, AgendaSidebar, AgendaConfig) — usar `useCalendar`
- **Lote 4**: Atendimento (AtendimentoKanban, AtendimentoList, AtendimentoDetail, AtendimentoConfig) — usar `useSupportTickets`
- **Lote 5**: Comunicados, Home, Metas, Marketing, Onboarding, Unidades, Matriz — usar hooks existentes
- **Lote 6**: Limpar helpers em `src/lib/helpers/` que dependem de mocks

### Bloco 9 — Deletar todos os mocks restantes

Apos Bloco 8, os 14 arquivos em `src/mocks/` poderao ser deletados.

### Bloco 10 — Revisao de Seguranca (RLS)

Revisar todas as tabelas do banco para garantir que RLS esta ativo e as policies estao corretas.

### Bloco 11 — Testes End-to-End

Testar fluxos principais em cada perfil (Franqueadora, Franqueado, Cliente) para garantir que dados reais carregam corretamente.

## Detalhes Tecnicos

Para o Bloco 8, cada componente que hoje faz:
```
import { mockLeads } from "@/mocks/crmData";
```
Passara a receber dados via props (do pai que ja usa hook) ou usara o hook diretamente:
```
const { leads } = useCrmLeads();
```

Constantes de UI (cores, labels, icones) permanecerao nos tipos (`src/types/`) ou inline nos componentes — nao precisam de banco de dados.

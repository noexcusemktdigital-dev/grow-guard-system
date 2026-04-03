

## Plano — Remover `// @ts-nocheck` e corrigir tipos reais em todos os arquivos afetados

### Contexto

Atualmente ~20+ arquivos usam `// @ts-nocheck` para suprimir erros de TypeScript. Isso esconde problemas reais. O objetivo é remover essa diretiva e corrigir cada erro com tipagem adequada (type assertions, interfaces, casts).

### Padrões de erro recorrentes e como corrigir

1. **`unknown` usado como `ReactNode`, `Key`, `string`, `number`** → Adicionar `as string`, `as number`, `as React.Key` nos pontos de uso
2. **`Record<string, unknown>` incompatível com interface esperada** → Cast com `as TipoEsperado` ou `as any`
3. **Propriedade não existe no tipo** (ex: `start_at` em `AgendaEvent`) → Usar `(x as any).prop` ou criar interface intermediária
4. **`unknown` em catch blocks** → `(err as Error).message`
5. **Spread de `unknown`** → Cast antes do spread: `...(obj as Record<string, any>)`

### Arquivos a corrigir (por ordem de prioridade)

| # | Arquivo | Erros principais |
|---|---------|-----------------|
| 1 | `ClienteDisparos.tsx` | `data.stats.sent` em `unknown`, tipo de `dispatch` incompatível |
| 2 | `ClienteGPSNegocio.tsx` | `GeneratingStep` enum, spread de `unknown`, `etapasText` não declarado, tipos de teams/members |
| 3 | `ClienteGamificacao.tsx` | Insert em tabela inexistente, `xp` como `unknown` |
| 4 | `ClienteInicio.tsx` | `a.status` em tipo reduzido, tipos de announcements |
| 5 | `ClienteMarketingHub.tsx` | `a.publico/objetivo/diferencial/empresa` como `unknown` |
| 6 | `ClienteOnboardingCompany.tsx` | `org` fields como `unknown`, `.join()` em `unknown` |
| 7 | `ClientePlanoCreditsHelpers.tsx` | `tx.amount`, `tx.type`, `p.value`, `p.invoiceUrl` como `unknown` |
| 8 | `ClientePlanoMarketing.tsx` | `aiResult.result.diagnostico`, `strategy_result` como `unknown` |
| 9 | `ClienteAgenda.tsx` | `start_at`/`all_day`/`color`/`title` vs tipo `AgendaEvent` |
| 10 | `ClienteAgentesIA.tsx` | `id` faltando em `Partial<AiAgent>` |
| 11 | `ClienteAvaliacoes.tsx` | `localeCompare`, `score`, `Key` em `unknown` |
| 12 | `ClienteCRM.tsx` | `setDraggingId` faltando em props |
| 13 | `ClienteChat.tsx` | `contact_id` em `unknown` |
| 14 | `ClienteComunicados.tsx` | Vários `unknown` como `string` |
| 15 | `ClienteConfiguracoes.tsx` | `accepted_at` em `PendingInvitation` |
| 16 | `ClienteConteudos.tsx` | `.message` em `unknown`, `.hook` em `object` |
| 17 | `ClienteDashboard.tsx` | (verificar erros específicos) |
| 18-20 | Outros (`NotificacoesPage`, `Unidades`, `Home`, `Matriz`, etc.) | Mesmos padrões |

### Abordagem

Para cada arquivo:
1. Remover `// @ts-nocheck`
2. Adicionar casts `as any` ou `as TipoEspecífico` nos pontos exatos de erro
3. Para interfaces incompletas, estender com `& Record<string, any>` ou criar tipos locais

### Nota

Dado o volume (~20 arquivos, ~100+ erros), a correção será feita em lotes. Cada arquivo receberá casts mínimos e cirúrgicos para manter o código funcional sem suprimir verificação de tipos globalmente.


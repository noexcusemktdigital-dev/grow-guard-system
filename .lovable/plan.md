

## Plano: Corrigir seletor de mês na criação de metas

### Problema
O campo `<Input type="month">` (linha 457) não é suportado em todos os navegadores — Safari e alguns mobile browsers não renderizam o seletor de mês nativo, mostrando apenas um campo de texto vazio.

### Solução
Substituir o `<Input type="month">` por **dois Selects lado a lado**: um para o **mês** (Janeiro–Dezembro) e outro para o **ano** (atual e próximos 2 anos). Isso garante compatibilidade total.

### Alterações em `src/pages/MetasRanking.tsx`

1. **State**: Trocar `period_month` (string "YYYY-MM") por dois campos no `goalForm`: `period_month_num` (1-12) e `period_year` (2025, 2026, 2027)

2. **UI** (linhas 455-458): Substituir o Input por dois Selects:
   - Select "Mês" com opções Janeiro a Dezembro
   - Select "Ano" com o ano atual e +2

3. **handleSaveGoal** (linhas 95-98): Construir `period_start` e `period_end` a partir dos dois campos numéricos

4. **openEditGoal** (linhas 75-76): Extrair mês e ano do `period_start` existente para preencher os Selects

### Arquivo
| Arquivo | Ação |
|---------|------|
| `src/pages/MetasRanking.tsx` | Substituir Input type="month" por dois Selects (mês + ano) |


# Consolidar isenção pré-GPS no helper compartilhado

## Diagnóstico

As três funções **já isentam corretamente** o débito de créditos enquanto o GPS não está aprovado. Cada uma faz inline a mesma query em `marketing_strategies` (status=`approved`) antes de chamar `debit_credits`. Ou seja, o comportamento da regra de Trial pré-GPS já está em produção e funcionando.

O que ainda falta é **padronização**: usar o helper `debitIfGPSDone` de `supabase/functions/_shared/credits.ts` em vez de manter três cópias inline. Isso evita drift futuro (ex.: se a regra de "GPS concluído" mudar — passar a aceitar `published`, considerar org pai, etc.).

## Mudanças (refactor — sem mudança funcional)

### 1. `supabase/functions/ai-agent-reply/index.ts`
- Importar `debitIfGPSDone` de `../_shared/credits.ts`.
- Substituir o corpo de `debitCredits()` (linhas 87–112) por uma chamada ao helper, mantendo o try/catch externo e a constante `FIXED_CREDIT_COST = 2`.

### 2. `supabase/functions/generate-daily-checklist/index.ts`
- Importar `debitIfGPSDone`.
- Substituir o bloco de débito (linhas 306–326) por uma única chamada ao helper. Mantém `_source: "generate-daily-checklist"` e `_description: "Checklist diário gerado por IA"`.

### 3. `supabase/functions/generate-daily-tasks/index.ts`
- Importar `debitIfGPSDone`.
- Substituir o bloco de débito (linhas 290–310) por uma única chamada ao helper. Mantém `_source: "generate-daily-tasks"` e `_description: "Tarefas diárias geradas por IA"`.

## O que NÃO muda
- Nenhuma alteração de schema, RPC ou políticas RLS.
- Custo de créditos, mensagens de log e fluxo de sucesso/erro permanecem idênticos.
- Comportamento observável para usuários em Trial: continua sem débito até o primeiro GPS aprovado.

## Deploy
- Deploy das 3 edge functions após as mudanças.

## Observação importante
Como o efeito funcional já está implementado, **se você só quer garantir a regra (e não a refatoração)**, não há trabalho a fazer. Confirme se quer apenas a consolidação técnica para reduzir duplicação.



## Plano: Corrigir criação de novos usuários via convite

### Problema
A Edge Function `invite-user` consulta a tabela `client_subscriptions` (que não existe) para verificar o limite de usuários do plano. Como não encontra nada, assume `maxUsers = 2`. Com o admin já contando como 1 membro, o limite é atingido rapidamente e o convite falha.

### Correção

**Arquivo:** `supabase/functions/invite-user/index.ts`

1. **Trocar `client_subscriptions` por `subscriptions`** (linhas 60-64):
   - Mudar a query de `.from("client_subscriptions")` para `.from("subscriptions")`
   
2. **Atualizar os limites de plano** para refletir os planos reais do sistema:
   - Trocar `{ starter: 2, growth: 5, scale: 15 }` por `{ starter: 10, pro: 20, enterprise: 9999, trial: 2 }`
   - Esses valores correspondem ao `UNIFIED_PLANS` e `TRIAL_PLAN` em `src/constants/plans.ts`

3. **Deploy** da edge function para aplicar a correção imediatamente.

### Resultado
- O admin poderá convidar novos usuários respeitando o limite real do plano
- Trial: até 2 usuários | Starter: 10 | Pro: 20 | Enterprise: ilimitado


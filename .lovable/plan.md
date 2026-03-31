

## Plano — Adicionar 150 créditos aos usuários trial + corrigir erro runtime

### 1. Adicionar 150 créditos a todos os usuários trial

Executar uma query SQL que identifica todas as organizações com subscription `status = 'trial'` e incrementa o saldo da `credit_wallets` em 150. Também registrar a transação na `credit_transactions`.

```sql
-- Incrementar 150 créditos nas wallets de orgs trial
UPDATE credit_wallets cw
SET balance = balance + 150, updated_at = now()
FROM subscriptions s
WHERE s.organization_id = cw.organization_id
  AND s.status = 'trial';

-- Registrar transação
INSERT INTO credit_transactions (organization_id, type, amount, balance_after, description, metadata)
SELECT cw.organization_id, 'purchase', 150, cw.balance,
  'Compensação trial — créditos pré-GPS', '{"source": "trial_compensation"}'::jsonb
FROM credit_wallets cw
JOIN subscriptions s ON s.organization_id = cw.organization_id
WHERE s.status = 'trial';
```

### 2. Corrigir erro "useFeatureGate must be inside FeatureGateProvider"

O `ClienteSidebar` (componente exportado) renderiza `ClienteSidebarContent` que usa `useFeatureGate`, mas o `ClienteSidebar` pode ser montado fora do `FeatureGateProvider` em algum contexto. A correção é envolver o conteúdo do `ClienteSidebar` com `FeatureGateProvider` internamente, ou adicionar um fallback no hook para não lançar erro quando fora do provider.

**Correção**: No `useFeatureGate`, retornar valores default em vez de lançar erro quando fora do provider.

### Arquivos a modificar

| Arquivo | Ação |
|---------|------|
| SQL via insert tool | Adicionar 150 créditos + transação para todas as orgs trial |
| `src/contexts/FeatureGateContext.tsx` | Retornar defaults em vez de throw quando fora do provider |




## Plano — Corrigir compensação de 150 créditos para usuários trial

### Problema

A query SQL anterior usou `s.status = 'trial'` para filtrar usuários trial, mas na realidade o campo correto é `s.plan = 'trial'` (o status de todas as subscriptions é `'active'`). Por isso, nenhum usuário trial recebeu os 150 créditos.

### Dados atuais (orgs com `plan = 'trial'`)

| Org | Balance atual |
|-----|--------------|
| 9a3bb183... | 150 |
| 0058d2e2... | 200 |
| 6c6ec1cf... | 95 |
| 3f6c5bf4... | 200 |
| fc36ee3b... | 200 |
| d1e0bc87... | 3140 |
| 91f29ed9... | 200 |
| 6f409ecb... | 500 |
| 49b32047... | 1000 |

### Correção

Executar via insert tool:

```sql
-- Incrementar 150 créditos nas wallets de orgs trial
UPDATE credit_wallets cw
SET balance = balance + 150, updated_at = now()
FROM subscriptions s
WHERE s.organization_id = cw.organization_id
  AND s.plan = 'trial'
  AND s.status = 'active';

-- Registrar transação
INSERT INTO credit_transactions (organization_id, type, amount, balance_after, description, metadata)
SELECT cw.organization_id, 'purchase', 150, cw.balance,
  'Compensação trial — créditos pré-GPS', '{"source": "trial_compensation"}'::jsonb
FROM credit_wallets cw
JOIN subscriptions s ON s.organization_id = cw.organization_id
WHERE s.plan = 'trial' AND s.status = 'active';
```

### Arquivos a modificar

Nenhum arquivo de código — apenas execução de SQL de dados via insert tool.


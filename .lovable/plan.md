

## Plano: Restaurar Créditos de Todos os Usuários de Teste

### Diagnóstico

Consultei o banco de dados e encontrei o seguinte:

| Organização | Plano | Saldo Atual | Total Drenado (bug) | Saldo Correto |
|------------|-------|-------------|---------------------|---------------|
| NOEXCUSE | Pro (1000cr) | 1.000 | **-69.149** (tokens brutos + custos inflados) | **1.000** |
| Micaella Costa Arquitetura | Trial (500cr) | 500 | -150 (custo inflado script) | **500** |
| Rafael Marutaka | Trial | 1.000 | — | Sem alteração |
| Unidade Teste | Scale | 50.000 | — | Sem alteração |

A NOEXCUSE foi a mais afetada: 69.149 créditos drenados pelo bug do agente IA (debitando tokens brutos ao invés de 2 créditos fixos) + custos inflados das Edge Functions. O saldo já mostra 1.000, mas precisa de um registro de ajuste formal para manter o histórico limpo.

A Micaella Costa já foi restaurada na última correção.

### Solução

Executar uma migração SQL que:

1. **Confirma o saldo da NOEXCUSE** em 1.000 créditos (plano Pro)
2. **Confirma o saldo da Micaella Costa** em 500 créditos (plano Trial/Starter)
3. **Registra transações de ajuste** no histórico para rastreabilidade

### SQL da migração

```sql
-- NOEXCUSE: garantir saldo = 1000 (Pro)
UPDATE credit_wallets SET balance = 1000, updated_at = now()
WHERE organization_id = 'adb09618-e9f3-4dbd-a89c-29e3eb1bec9f';

INSERT INTO credit_transactions (organization_id, type, amount, balance_after, description, metadata)
VALUES ('adb09618-e9f3-4dbd-a89c-29e3eb1bec9f', 'adjustment', 1000, 1000,
  'Restauração — correção bug débito tokens brutos + custos inflados',
  '{"source":"admin_fix","reason":"token_drain_bug"}'::jsonb);

-- Micaella Costa: confirmar saldo = 500 (Starter/Trial)
UPDATE credit_wallets SET balance = 500, updated_at = now()
WHERE organization_id = '6f409ecb-94a5-4a90-af33-23b1fd69cd62';
```

### Arquivo impactado

| Arquivo | Ação |
|---------|------|
| Nova migração SQL | Restaurar créditos das 2 organizações afetadas |


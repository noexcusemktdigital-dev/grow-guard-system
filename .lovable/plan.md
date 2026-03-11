

## Recarregar Créditos — NOEXCUSE

### Situação Atual
A organização **NOEXCUSE** (`adb09618-e9f3-4dbd-a89c-29e3eb1bec9f`) está com **0 créditos**. O agente de IA não responde por causa disso.

### Ação
Executar duas operações no banco de dados:

1. **Atualizar saldo da carteira** para 1.000 créditos
2. **Registrar a transação** na tabela `credit_transactions` para manter o histórico

```sql
UPDATE credit_wallets SET balance = 1000, updated_at = now()
WHERE organization_id = 'adb09618-e9f3-4dbd-a89c-29e3eb1bec9f';

INSERT INTO credit_transactions (organization_id, type, amount, balance_after, description, metadata)
VALUES ('adb09618-e9f3-4dbd-a89c-29e3eb1bec9f', 'purchase', 1000, 1000, 'Recarga manual — 1000 créditos Pro', '{"source": "manual_recharge"}');
```

Nenhum arquivo de código será alterado.


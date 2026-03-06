

## Diagnóstico

A org **NOEXCUSE** (`adb09618-e9f3-4dbd-a89c-29e3eb1bec9f`) está no plano **Starter** que permite apenas **8 conteúdos/mês** — e já gerou exatamente 8 este mês, por isso o bloqueio aparece. Os créditos mostram 9.900/5.000 porque o saldo é 9.900 mas o cap do plano Starter é 5.000 (a barra ultrapassa 100%).

Isso é o comportamento esperado do sistema. Para desbloquear, há duas opções:

### Opção A — Fazer upgrade do plano para Scale
Atualizar a subscription de `starter` para `scale` (maxContents: 20, credits: 50.000):

1. **UPDATE na tabela subscriptions**: mudar `plan` para `scale`, `modules` para `combo`, estender `expires_at` +30 dias
2. **UPDATE na credit_wallets**: ajustar balance para 50.000

### Opção B — Apenas resetar a quota de conteúdos
Se quiser manter o plano Starter mas liberar a geração novamente:

1. **DELETE** dos 8 registros de `client_content` deste mês (ou marcar como de outro período)

**Recomendo a Opção A** para testes completos. Posso executar ao aprovar.


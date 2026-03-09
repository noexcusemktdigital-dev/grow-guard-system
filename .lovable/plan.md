

## Plano: Auditoria e Correção da Integração Financeira Asaas do SaaS

### Problemas Identificados

**1. `asaas-buy-credits` não está no `config.toml`**
A edge function existe mas não tem `verify_jwt = false` configurado no `config.toml`. Isso pode causar falhas de JWT ao chamar diretamente.

**2. Inconsistência no `externalReference` entre criação e webhook**
- **Criação** (`asaas-create-subscription`): gera `{orgId}|sub|{sales_plan}|{marketing_plan}|{modulesValue}` (5 partes)
  - Ex: `abc123|sub|professional|starter|combo`
- **Webhook**: parseia `refParts[2]` como `planSlug` e `refParts[3]` como `modules`
  - Resultado: `planSlug = "professional"` (correto para vendas), mas o mapa de créditos usa `starter/growth/scale` — **o plano `professional` e `enterprise` não estão mapeados**, então os créditos na renovação ficam `undefined` e não são creditados.

**3. Mapa de créditos incorreto no webhook**
O webhook usa:
```
{ starter: 5000, growth: 20000, scale: 50000 }
```
Mas os planos reais são `starter/professional/enterprise` com créditos de `3000+2000/15000+10000/40000+30000`. O mapa precisa refletir os planos reais e considerar que pode ter vendas + marketing separados.

**4. UI de créditos usa `asaas-create-charge` em vez de `asaas-buy-credits`**
O componente `CreditPackDialog` chama `asaas-create-charge` com `charge_type: "credits"`. Isso funciona, mas é uma edge function separada de `asaas-buy-credits`. Há duplicação — duas funções fazem a mesma coisa. A `asaas-buy-credits` tem a lógica de split (comissão franqueado) que a `asaas-create-charge` não tem.

### Correções

**Arquivo: `supabase/config.toml`**
- Adicionar `[functions.asaas-buy-credits]` com `verify_jwt = false`

**Arquivo: `supabase/functions/asaas-webhook/index.ts`**
1. Corrigir o mapa de créditos na renovação de assinatura:
   - Atualizar para `{ starter: 5000, professional: 25000, enterprise: 70000 }` (soma vendas + marketing)
   - OU calcular créditos dinamicamente a partir de `sales_plan` (refParts[2]) e `marketing_plan` (refParts[3]) usando os mapas corretos
2. Ajustar o parsing do `externalReference` para ler corretamente os 5 campos: `orgId|sub|salesPlan|marketingPlan|modules`
3. Usar `sales_plan` e `marketing_plan` para calcular créditos separadamente:
   - `SALES_CREDITS = { starter: 3000, professional: 15000, enterprise: 40000 }`
   - `MARKETING_CREDITS = { starter: 2000, professional: 10000, enterprise: 30000 }`
   - Total = soma dos dois que não sejam "none"

**Arquivo: `src/pages/cliente/ClientePlanoCreditos.tsx`**
- Trocar a chamada de `asaas-create-charge` para `asaas-buy-credits` no `CreditPackDialog`, que já tem a lógica correta de split para franqueados

**Teste: Executar `asaas-test-connection`**
- Validar que a conexão com o Asaas está funcionando antes de testar os fluxos de pagamento

### Fluxos de Pagamento a Validar

```text
1. Assinatura de plano (Vendas e/ou Marketing)
   UI → asaas-create-subscription → Asaas → webhook PAYMENT_CONFIRMED → renova + credita

2. Compra de créditos avulsos
   UI → asaas-buy-credits → Asaas → webhook PAYMENT_CONFIRMED → credita wallet

3. Taxa de sistema (franqueado)
   UI → asaas-charge-system-fee → Asaas → webhook → marca como pago

4. Cobrança de cliente (franqueado)
   UI → asaas-charge-client → Asaas → webhook → marca como pago + receita

5. Cancelamento de assinatura
   UI → asaas-cancel-subscription → Asaas DELETE → local status cancelled
```

### Resultado Esperado

Todos os 5 fluxos de pagamento do SaaS estarão corretamente integrados com o Asaas, com créditos sendo creditados/debitados nas quantidades certas na renovação.


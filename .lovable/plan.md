

# Plano: Split de Pagamentos Asaas + Correcao de Build Errors

## Contexto

O split do Asaas permite dividir automaticamente o valor de uma cobranca entre carteiras (contas Asaas). Requer o `walletId` de cada conta destino. Atualmente o sistema cobra clientes via `asaas-charge-client` e calcula `franchisee_share` (20%) apenas como registro local, sem split real no Asaas.

Alem disso, existem **build errors** em todos os arquivos de teste por incompatibilidade de imports do `@testing-library/react` v16 que precisam ser corrigidos.

---

## Bloco 1: Corrigir Build Errors nos Testes

Os testes importam `screen`, `fireEvent`, `waitFor` de `@testing-library/react`, mas a v16 mudou as exports. Correcao: usar imports corretos ou adicionar `@testing-library/dom` como dependencia explícita.

| Arquivo | Correcao |
|---------|----------|
| `src/components/__tests__/ProtectedRoute.test.tsx` | Ajustar imports |
| `src/components/crm/__tests__/CrmNewLeadDialog.test.tsx` | Ajustar imports |
| `src/components/onboarding/__tests__/OnboardingEtapas.test.tsx` | Ajustar imports |
| `src/pages/__tests__/Auth.test.tsx` | Ajustar imports |
| `src/pages/__tests__/SaasAuth.test.tsx` | Ajustar imports |
| `src/pages/__tests__/Unidades.test.tsx` | Ajustar imports |

---

## Bloco 2: Adicionar `asaas_wallet_id` na tabela `organizations`

O split exige o `walletId` da conta Asaas destino. Cada franqueado precisa ter sua propria conta Asaas (subconta) com um `walletId` associado.

**Migracao SQL:**
- Adicionar coluna `asaas_wallet_id TEXT` na tabela `organizations`

---

## Bloco 3: Criar Edge Function `asaas-get-wallet-id`

Funcao para recuperar o `walletId` de uma conta Asaas via `GET /v3/wallets/` usando a API key da conta. Como o franqueado pode nao ter API key propria, a alternativa e armazenar o `walletId` manualmente ou no momento da criacao da subconta.

Na pratica, o fluxo sera:
1. Admin cadastra o `walletId` do franqueado no painel de unidades
2. Ou, se o sistema criar subcontas Asaas, capturar o `walletId` automaticamente

---

## Bloco 4: Implementar Split no `asaas-charge-client`

Quando a cobranca e gerada para um cliente de um franqueado, adicionar o campo `split` no payload do `POST /payments`:

```text
POST /v3/payments
{
  customer: "cus_xxx",
  billingType: "PIX",
  value: 1000,
  dueDate: "2026-04-10",
  split: [
    {
      walletId: "wallet_franqueadora_xxx",
      percentualValue: 80  // franqueadora recebe 80%
    }
  ]
  // franqueado (emissor) fica com os 20% restantes automaticamente
}
```

Pela regra de negocio: franqueado recebe 20% do valor base. O split envia 80% para a carteira da franqueadora. O Asaas calcula sobre o valor liquido (apos taxas).

**Logica condicional:**
- Se a cobranca e emitida pelo franqueado → split 80% para franqueadora
- Se a cobranca e emitida pela matriz → split 20% para franqueado, 80% fica na matriz

| Arquivo | Acao |
|---------|------|
| `supabase/functions/asaas-charge-client/index.ts` | Adicionar array `split` ao payload do pagamento, usando `walletId` da org destino |
| `supabase/functions/_shared/asaas-customer.ts` | Adicionar helper `getOrgWalletId()` para buscar `asaas_wallet_id` da org |

---

## Bloco 5: Tratar Split no Webhook

Adicionar handlers para os eventos de split:
- `PAYMENT_SPLIT_DIVERGENCE_BLOCK` — notificar admin sobre bloqueio
- `PAYMENT_SPLIT_DIVERGENCE_BLOCK_FINISHED` — notificar desbloqueio

| Arquivo | Acao |
|---------|------|
| `supabase/functions/asaas-webhook/index.ts` | Adicionar handlers para eventos de split e registrar logs |

---

## Bloco 6: UI para configurar `walletId` do franqueado

Adicionar campo "Wallet ID Asaas" na aba de dados da unidade (`UnidadeDadosEdit.tsx`) para que o admin da franqueadora possa informar o `walletId` de cada franqueado.

| Arquivo | Acao |
|---------|------|
| `src/components/unidades/UnidadeDadosEdit.tsx` | Adicionar campo `asaas_wallet_id` no formulario |

---

## Ordem de Execucao

1. Corrigir build errors nos testes (Bloco 1)
2. Migracao: adicionar `asaas_wallet_id` (Bloco 2)
3. Implementar split no `asaas-charge-client` (Bloco 4)
4. Tratar eventos de split no webhook (Bloco 5)
5. UI para configurar walletId (Bloco 6)


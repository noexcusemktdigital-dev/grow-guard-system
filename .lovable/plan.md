

## Plano: Sistema Completo de Hierarquia Matriz ↔ Franqueado ↔ Cliente com Referral e Financeiro Integrado

### Resumo Executivo

Criar um sistema real onde: (1) Franqueados geram links personalizados que vinculam clientes SaaS automaticamente com 5% de desconto; (2) A Matriz também vende diretamente SaaS + serviços; (3) Todo financeiro (planos, recargas, comissões) flui pelo Asaas com split automático e comissão configurável por unidade; (4) A Matriz tem visão consolidada de tudo.

---

### Fase 1 — Referral: Link Personalizado do Franqueado

**1.1 Schema: Adicionar `referral_code` à tabela `organizations`**
- Coluna `referral_code text UNIQUE` na tabela `organizations`
- Gerado automaticamente no provisionamento da unidade (ex: `allure`, `noe-curitiba`)
- Franqueado pode editar o código nas Configurações

**1.2 Tabela `referral_discounts`**
```
referral_discounts (
  id uuid PK,
  organization_id uuid FK → organizations,  -- franqueado
  discount_percent numeric DEFAULT 5,
  is_active boolean DEFAULT true,
  uses_count int DEFAULT 0,
  created_at timestamptz
)
```

**1.3 Rota de Referral no SaaS Auth**
- Rota `/app?ref=allure` — detecta o código, preenche contexto de desconto
- `SaasAuth.tsx` captura `ref` da URL → armazena no state
- No signup, envia `referral_code` para `signup-saas`

**1.4 Edge Function `signup-saas` atualizada**
- Recebe `referral_code` (opcional)
- Busca organização pelo `referral_code` → define `parent_org_id` automaticamente
- Registra uso do referral (`uses_count++`)

**1.5 Frontend do Franqueado**
- Em Configurações: card "Link de Indicação" com campo editável do código e botão copiar
- Exibe `https://grow-guard-system.lovable.app/app?ref={code}`
- Contador de usos

---

### Fase 2 — Desconto de 5% nos Pagamentos via Asaas

**2.1 Edge Function `asaas-create-subscription` atualizada**
- Ao criar assinatura, verifica se org tem `parent_org_id` (veio via referral)
- Busca `referral_discounts` do franqueado vinculado
- Aplica desconto de 5% no `value` enviado ao Asaas
- Armazena `discount_applied` na tabela `subscriptions`

**2.2 Recargas de créditos**
- Criar Edge Function `asaas-buy-credits` para que o cliente compre pacotes via Asaas (PIX/Boleto/Cartão)
- Webhook já processa via `externalReference` pattern `{orgId}|credits|{packId}`

---

### Fase 3 — Comissão Configurável do Franqueado sobre SaaS

**3.1 Schema: `saas_commission_percent` na tabela `units` ou `organizations`**
- Adicionar coluna `saas_commission_percent numeric DEFAULT 20` na `organizations` (tipo franqueado)
- Matriz configura na aba Financeiro de cada Unidade

**3.2 Split automático no Asaas para assinaturas SaaS**
- Quando o cliente vinculado a um franqueado paga o plano:
  - Asaas split: X% franqueado (via `asaas_wallet_id` da unidade), resto para a matriz
  - Registra `saas_commission_payments` para rastreio

**3.3 Webhook atualizado**
- No `PAYMENT_CONFIRMED` de subscriptions, registra receita na Matriz E na unidade franqueada
- Gera lançamento em `finance_revenues` de ambos os lados

---

### Fase 4 — Matriz como Vendedora Direta (SaaS + Serviços)

**4.1 Clientes internos da Matriz**
- Quando a Matriz vende diretamente (sem franqueado), `parent_org_id` do cliente aponta para a própria Franqueadora
- Não há split — 100% vai para a Matriz
- Os mesmos contratos, propostas e calculadora que o franqueado usa ficam disponíveis no portal da Matriz

**4.2 Processo Comercial Interno**
- Reutilizar CRM, Propostas e Contratos que já existem no portal da Franqueadora
- Adicionar atalho "Novo Cliente SaaS" no dashboard da Matriz (gera link de referral da Matriz)

---

### Fase 5 — Financeiro Consolidado

**5.1 Visão do Cliente Final**
- Página `ClientePlanoCreditos.tsx` já funciona
- Adicionar: compra de créditos via Asaas (self-service)
- Exibir desconto de 5% quando aplicável

**5.2 Visão do Franqueado (`FranqueadoFinanceiro.tsx`)**
- Aba existente "Contratos" — já funciona
- **Nova aba "Clientes SaaS"** — lista clientes vinculados com: plano, valor, comissão, status do pagamento
- **Nova aba "Comissões"** — histórico de comissões recebidas de assinaturas SaaS
- Pagamento do sistema (R$ 250) — já funciona

**5.3 Visão da Matriz (`FinanceiroDashboard.tsx`)**
- Consolidar: receitas de contratos da rede + receitas SaaS diretas + receitas SaaS via franqueados
- KPIs: MRR Total (rede + SaaS), Comissões Pagas, Resultado Líquido
- Listagem de todos os pagamentos SaaS (diretos e via franqueados)

---

### Arquivos a criar/alterar

| Arquivo | Ação |
|---------|------|
| **Migration SQL** | `referral_code` em organizations, tabela `referral_discounts`, `saas_commission_percent` |
| **`signup-saas/index.ts`** | Aceitar `referral_code`, vincular via `parent_org_id`, registrar uso |
| **`asaas-create-subscription/index.ts`** | Aplicar desconto 5%, configurar split SaaS |
| **`asaas-webhook/index.ts`** | Registrar comissões SaaS no financeiro de ambos os lados |
| **`asaas-buy-credits/index.ts`** | **Novo** — compra self-service de pacotes de créditos |
| **`SaasAuth.tsx`** | Capturar `?ref=` da URL e passar ao signup |
| **`FranqueadoConfiguracoes.tsx`** | Card "Link de Indicação" |
| **`FranqueadoFinanceiro.tsx`** | Abas "Clientes SaaS" e "Comissões" |
| **`FinanceiroDashboard.tsx`** | KPIs consolidados SaaS + rede |
| **`UnidadeFinanceiroReal.tsx`** | Campo `saas_commission_percent` editável |
| **`ClientePlanoCreditos.tsx`** | Compra de créditos via Asaas |
| **`provision-unit/index.ts`** | Gerar `referral_code` automático |

### Ordem de execução recomendada

1. **Migration** (schema + dados) — base de tudo
2. **Referral** (signup-saas + SaasAuth + link do franqueado)
3. **Desconto + Split** (asaas-create-subscription + webhook)
4. **Compra de créditos** (nova edge function)
5. **Financeiro do Franqueado** (abas SaaS + Comissões)
6. **Financeiro da Matriz** (consolidação)
7. **Correção de dados** (vincular orgs existentes, limpar duplicatas)


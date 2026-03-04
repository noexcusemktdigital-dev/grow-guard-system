

# Prioridade 11: Correcao da Integracao Asaas — Conformidade com a API Oficial

## Problemas Identificados

### 1. Criacao de clientes duplicados (CRITICO)
A documentacao Asaas diz explicitamente: **"O sistema permite a criacao de clientes duplicados. Portanto, se voce nao quiser permitir e necessario implementar a validacao antes de realizar a criacao do cliente."**

**Onde acontece:**
- `asaas-charge-client`: cria customer novo a cada cobranca sem verificar se ja existe. A logica de fallback (linha 129-144) tenta extrair ID de erro via regex — fragil e nao-documentado.
- `asaas-charge-system-fee`: cria customer sem verificar duplicata.
- `asaas-create-subscription`: cria customer sem verificar duplicata.
- `asaas-create-charge`: cria customer sem verificar duplicata.

**Correcao:** Criar helper `getOrCreateAsaasCustomer()` que:
1. Verifica `asaas_customer_id` na tabela `organizations`
2. Se nao tem, busca no Asaas por `externalReference` (org.id) via `GET /customers?externalReference={orgId}`
3. Se nao encontra, cria o customer
4. Salva `asaas_customer_id` na org

### 2. cpfCnpj com fallback "00000000000" (CRITICO)
Asaas valida CPF/CNPJ. Enviar `"00000000000"` gera erro `400` ou cria customer com documento invalido. Acontece em:
- `asaas-charge-system-fee` (linha 117)
- `asaas-charge-client` (linha 115)

**Correcao:** Se nao tiver cpfCnpj, retornar erro claro pedindo cadastro do documento antes de cobrar.

### 3. Webhook valida token DEPOIS de parsear o body (RISCO DE SEGURANCA)
Em `asaas-webhook` (linhas 20-35), o body e parseado (`req.json()`) antes de validar o token. Se o token for invalido, o payload ja foi consumido. Alem disso, o header correto do Asaas e `asaas-access-token` — o codigo aceita `x-asaas-token` como alternativa mas isso nao e documentado.

**Correcao:** Mover validacao do token para ANTES do parse do body.

### 4. Webhook nao trata `PAYMENT_CHARGEBACK_REQUESTED` 
A documentacao lista chargebacks como eventos importantes. O webhook atual ignora completamente chargebacks, o que pode causar perda financeira silenciosa.

**Correcao:** Adicionar handler para `PAYMENT_CHARGEBACK_REQUESTED` que notifica admins e registra na tabela.

### 5. Webhook nao trata `externalReference` para pagamentos de creditos/packs
A funcao `asaas-create-charge` usa `externalReference: ${org.id}|credits|${pack_id}`, mas o webhook nao faz parse desse formato. Ele cai no fallback `valueToCreditAmount()` que e fragil (mapeamento por faixa de valor).

**Correcao:** Parsear `externalReference` no webhook para determinar exatamente quantos creditos adicionar com base no `pack_id`.

### 6. Auth inconsistente entre edge functions
- `asaas-charge-system-fee` usa `getUser()` (fetch de rede)
- `asaas-charge-client` usa `getClaims()` (local, mais rapido)
- `asaas-list-payments` usa `getUser()` 

**Correcao:** Padronizar tudo com `getClaims()`.

### 7. PIX QR Code pode falhar silenciosamente
Em todos os endpoints de cobranca, se o PIX QR code falha, retorna `null` sem avisar o frontend. O usuario ve uma cobranca "gerada" sem forma de pagar.

**Correcao:** Tentar ate 2x com delay de 1s (o Asaas precisa de tempo para gerar o QR apos a criacao do pagamento).

---

## Plano de Execucao

### Bloco 1 — Shared helper `getOrCreateAsaasCustomer`

| Arquivo | Acao |
|---------|------|
| `supabase/functions/_shared/asaas-customer.ts` | Criar helper que: (1) checa `asaas_customer_id` na org, (2) busca por `externalReference` no Asaas, (3) cria se nao existe, (4) salva na org. Recusa cobranca se `cpfCnpj` estiver vazio. |

### Bloco 2 — Refatorar todas as edge functions de cobranca

| Arquivo | Acao |
|---------|------|
| `asaas-charge-client/index.ts` | Usar `getOrCreateAsaasCustomer` para o cliente do contrato. Remover logica duplicada de criacao/busca. |
| `asaas-charge-system-fee/index.ts` | Usar `getOrCreateAsaasCustomer` para a org. Trocar `getUser()` por `getClaims()`. |
| `asaas-create-subscription/index.ts` | Usar `getOrCreateAsaasCustomer`. |
| `asaas-create-charge/index.ts` | Usar `getOrCreateAsaasCustomer`. |
| `asaas-list-payments/index.ts` | Trocar `getUser()` por `getClaims()`. |

### Bloco 3 — Corrigir webhook

| Arquivo | Acao |
|---------|------|
| `asaas-webhook/index.ts` | (1) Mover validacao de token antes do parse do body. (2) Parsear `externalReference` para creditos/packs em vez de usar `valueToCreditAmount`. (3) Adicionar handler para `PAYMENT_CHARGEBACK_REQUESTED`. (4) Adicionar retry para atualizacao de status no caso de race condition. |

### Bloco 4 — PIX QR Code retry

Embutir no helper: apos criar pagamento PIX, tentar buscar QR code com retry (1s delay) se a primeira tentativa retornar erro.

### Bloco 5 — Plan update

| Arquivo | Acao |
|---------|------|
| `.lovable/plan.md` | Registrar P11 |

---

## Detalhes Tecnicos

### Helper `getOrCreateAsaasCustomer`

```text
getOrCreateAsaasCustomer(adminClient, asaasApiKey, {
  orgId, name, cpfCnpj, email?, phone?
}) => { customerId: string }

Flow:
  1. SELECT asaas_customer_id FROM organizations WHERE id = orgId
  2. If found → return
  3. GET /customers?externalReference={orgId}
  4. If found → save to org, return
  5. If !cpfCnpj → throw "CPF/CNPJ obrigatorio"
  6. POST /customers { name, cpfCnpj, email, externalReference: orgId }
  7. Save to org, return
```

### Webhook externalReference parsing

```text
Format: "{type}|{orgId}|{extra...}"
  - "system_fee|{orgId}|{month}" → system fee
  - "client_payment|{orgId}|{contractId}|{month}" → client payment
  - "franchisee_charge|{orgId}|{franchiseeOrgId}|{month}" → franchisee
  - "{orgId}|sub|{planId}|{modules}" → subscription
  - "{orgId}|credits|{packId}" → credit pack (NEW parse)
  - "{orgId}|extra_user|" → extra user charge (NEW parse)
```


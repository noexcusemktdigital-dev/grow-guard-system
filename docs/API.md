# API Reference — Sistema Noé (Edge Functions)

> Documento de referência para as Edge Functions Deno hospedadas no Supabase (projeto `gxrhdpbbxfipeopdyygn`).
> Deploy contínuo via Lovable Cloud. Atualizado em 2026-05-02.
> Ver também: [ARCHITECTURE.md](ARCHITECTURE.md) para visão de arquitetura e helpers compartilhados.

---

## Índice

1. [Visão Geral](#1-visão-geral)
2. [Autenticação](#2-autenticação)
3. [Padrão de Resposta](#3-padrão-de-resposta)
4. [Helpers Compartilhados](#4-helpers-compartilhados)
5. [Endpoints Documentados](#5-endpoints-documentados)
   - [Autenticação e Usuários](#51-autenticação-e-usuários)
   - [Financeiro — Asaas](#52-financeiro--asaas)
   - [LGPD / DSR](#53-lgpd--dsr)
   - [Geração IA](#54-geração-ia)
   - [Webhooks Externos](#55-webhooks-externos)
   - [CRM](#56-crm)
   - [WhatsApp](#57-whatsapp)
   - [Cron / Scheduler](#58-cron--scheduler)
6. [Códigos de Erro](#6-códigos-de-erro)
7. [Versionamento](#7-versionamento)
8. [OpenAPI / Spec](#8-openapi--spec)

---

## 1. Visão Geral

O backend do Sistema Noé é composto por **~104 Edge Functions Deno** hospedadas no Supabase, organizadas nas seguintes categorias:

| Categoria | Quantidade | Exemplos |
|-----------|-----------|---------|
| Geração IA (`generate-*`) | 16 | `generate-content`, `generate-strategy` |
| WhatsApp | 9 | `whatsapp-send`, `whatsapp-cloud-webhook` |
| Financeiro Asaas | 12 | `asaas-create-charge`, `asaas-webhook` |
| Social Media / Ads | 14 | `social-publish`, `meta-leadgen-webhook` |
| Operações / Provisionamento | 10 | `signup-saas`, `provision-unit` |
| Agente de IA | 3 | `ai-agent-reply`, `ai-agent-simulate` |
| LGPD / DSR | 2 | `dsr-export-data`, `dsr-delete-account` |
| Cron / Scheduler | 5 | `agent-followup-cron`, `billing-reminder-check` |
| Comunicação | 4 | `send-transactional-email`, `send-campaign-email` |
| Utilitários | ~29 | `get-inicio-data`, `transcribe-audio` |

**Base URL:**

```
https://gxrhdpbbxfipeopdyygn.supabase.co/functions/v1/{nome-da-funcao}
```

**Runtime:** Deno (Supabase managed). Todas as funções são invocadas via HTTP POST (exceto webhooks que aceitam POST/GET conforme o provider).

**Deploy:** Lovable Cloud — push em `main` dispara deploy automático. Não há ambientes de staging separados; todo teste deve ser feito em branch isolada antes do merge.

---

## 2. Autenticação

### 2.1 JWT Bearer (usuário autenticado)

A grande maioria das funções requer um JWT válido emitido pelo Supabase Auth. Todas as funções têm `verify_jwt = false` no `config.toml` — a validação é feita internamente pelo helper `requireAuth()` em `_shared/auth.ts`.

```
Authorization: Bearer <supabase-jwt>
```

O JWT é obtido via `supabase.auth.getSession()` no frontend. Expiração padrão: 1 hora (renovado automaticamente pelo cliente Supabase).

Após validar o JWT, funções que operam sobre dados de uma organização chamam `assertOrgMember()` para garantir que o usuário pertence à `organization_id` informada no payload (proteção anti-IDOR/BOLA).

### 2.2 Cron Secret (funções agendadas)

Funções invocadas pelo `pg_cron` ou scheduler externo usam Bearer com segredo fixo:

```
Authorization: Bearer <CRON_SECRET>
```

`CRON_SECRET` é um secret Supabase configurado no ambiente. Verificação via comparação constant-time em `_shared/cron-auth.ts` para prevenir timing attacks.

### 2.3 HMAC-SHA256 (webhooks externos)

Webhooks provenientes da Meta Platform (Leadgen, WhatsApp Cloud) são validados via assinatura HMAC-SHA256 no header `x-hub-signature-256`. Implementação em `_shared/hmac.ts` com `timingSafeEqual`.

Webhooks Asaas não usam HMAC — são validados por IP allowlist configurado no painel Asaas.

### 2.4 Headers Auxiliares

| Header | Obrigatório | Descrição |
|--------|-------------|-----------|
| `Idempotency-Key` | Recomendado (mutações financeiras) | UUID gerado pelo cliente. Dedup via SHA-256 do payload. Janela de 24h. |
| `x-request-id` | Opcional | UUID de rastreamento propagado em logs (gerado automaticamente se ausente). |
| `Content-Type` | Sim | `application/json` para todas as funções (exceto uploads multipart) |

---

## 3. Padrão de Resposta

### Sucesso

```json
HTTP 200 OK
Content-Type: application/json

{
  "data": { ... },
  "message": "Descrição opcional do sucesso"
}
```

Algumas funções retornam o objeto diretamente (sem envelope `data`). Consultar a seção de cada endpoint.

### Erro de Validação (422)

```json
HTTP 422 Unprocessable Entity

{
  "error": "Validation error",
  "code": "VALIDATION_ERROR",
  "issues": [
    { "path": "organization_id", "message": "Invalid uuid" },
    { "path": "amount", "message": "Number must be positive" }
  ]
}
```

### Erro Geral

```json
HTTP 4xx / 5xx

{
  "error": "Descrição do erro",
  "code": "SNAKE_CASE_CODE"
}
```

### Headers de Resposta

| Header | Presença | Valor |
|--------|----------|-------|
| `Content-Type` | Sempre | `application/json` |
| `x-request-id` | Sempre | UUID de correlação (ecoado do request ou gerado) |
| `Access-Control-Allow-Origin` | Sempre | Baseado em whitelist de origens (`_shared/cors.ts`) |

---

## 4. Helpers Compartilhados

Todos os helpers ficam em `supabase/functions/_shared/`. Detalhamento completo em [ARCHITECTURE.md — Seção 6](ARCHITECTURE.md#6-helpers-compartilhados-_shared).

| Helper | Função principal |
|--------|----------------|
| `auth.ts` | `requireAuth(req)` → valida JWT + retorna `{ user, supabase, admin }` |
| `auth.ts` | `assertOrgMember(admin, userId, orgId)` → anti-BOLA |
| `schemas.ts` | Schemas Zod reutilizáveis: `UUID`, `Email`, `PositiveBRL`, `PhoneBR`, `CPF`, `CNPJ` |
| `schemas.ts` | `parseOrThrow(schema, data)` → lança `ValidationError` |
| `schemas.ts` | `validationErrorResponse(err, corsHeaders)` → converte em HTTP 422 |
| `idempotency.ts` | `getCachedResponse(key, fn, hash)` + `saveResponse(...)` → dedup financeiro |
| `rate-limit.ts` | `checkRateLimit(userId, orgId, fnName, config)` → 30 req/60s default |
| `hmac.ts` | `verifyHmacSignature(payload, signature, secret)` → webhooks Meta |
| `cron-auth.ts` | `checkCronSecret(req)` → autenticação de schedulers |
| `correlation.ts` | `getCorrelationId(req)` + `newRequestContext()` → tracing |
| `redact.ts` | `redactPii(obj)` → mascara `email`, `cpf`, `cnpj`, `phone` em logs |
| `job-failures.ts` | `logJobFailure(fn, error, payload)` → tabela `job_failures` |

---

## 5. Endpoints Documentados

> Convenção de status nos campos abaixo:
> - **Auth required:** `JWT` = Bearer JWT do usuário | `CRON` = Bearer CRON_SECRET | `HMAC` = assinatura do provider | `Public` = sem autenticação

---

### 5.1 Autenticação e Usuários

---

#### `signup-saas`

Cria conta SaaS (usuário + organização). Ponto de entrada do onboarding.

| Campo | Valor |
|-------|-------|
| Método | `POST` |
| Path | `/functions/v1/signup-saas` |
| Auth required | `Public` |
| Idempotency | Não |
| Rate limit | Não (controle via Supabase Auth captcha) |

**Body:**

```json
{
  "email": "usuario@empresa.com",
  "password": "minimo6chars",
  "full_name": "Nome Completo",
  "company_name": "Nome da Empresa",
  "referral_code": "CODIGO123"
}
```

**Response 200:**

```json
{ "message": "Account created. Check your email for confirmation." }
```

**Status codes:** `200` criado | `400` email já cadastrado | `422` validação | `500` erro interno

**Notas:** Envia email de confirmação via Resend. Suporta modo `resend_only: true` para reenvio de confirmação.

---

#### `invite-user`

Convida um novo membro para uma organização existente.

| Campo | Valor |
|-------|-------|
| Método | `POST` |
| Path | `/functions/v1/invite-user` |
| Auth required | `JWT` (role `admin` ou superior) |
| Schema | `MemberSchemas.Invite` (`_shared/schemas.ts`) |

**Body:**

```json
{
  "organization_id": "uuid",
  "email": "novo@empresa.com",
  "role": "franqueado",
  "full_name": "Nome Opcional",
  "team_ids": ["uuid-equipe"]
}
```

Roles válidos: `admin`, `franqueado`, `cliente_admin`, `cliente_user`.

**Response 200:**

```json
{ "message": "Invitation sent", "user_id": "uuid" }
```

**Status codes:** `200` convite enviado | `401` não autenticado | `403` sem permissão de admin | `409` email já membro | `422` validação

---

#### `manage-member`

Atualiza dados, role ou remove um membro da organização.

| Campo | Valor |
|-------|-------|
| Método | `POST` |
| Path | `/functions/v1/manage-member` |
| Auth required | `JWT` |
| Schema | `MemberSchemas.Update` (`_shared/schemas.ts`) |

**Body:**

```json
{
  "user_id": "uuid",
  "organization_id": "uuid",
  "action": "update",
  "role": "cliente_admin",
  "full_name": "Novo Nome",
  "job_title": "Cargo"
}
```

Actions: `update` | `remove` | `accept_invitation`.

**Status codes:** `200` sucesso | `403` BOLA (usuário não pertence à org) | `422` validação

---

#### `request-password-reset`

Solicita reset de senha via email.

| Campo | Valor |
|-------|-------|
| Método | `POST` |
| Path | `/functions/v1/request-password-reset` |
| Auth required | `Public` |

**Body:**

```json
{ "email": "usuario@empresa.com" }
```

**Response 200:** `{ "message": "Password reset email sent if account exists" }`

**Notas:** Resposta sempre `200` independente de o email existir (prevenção de user enumeration).

---

### 5.2 Financeiro — Asaas

---

#### `asaas-buy-credits`

Compra pacote de créditos do sistema via Asaas.

| Campo | Valor |
|-------|-------|
| Método | `POST` |
| Path | `/functions/v1/asaas-buy-credits` |
| Auth required | `JWT` |
| Idempotency | Sim — header `Idempotency-Key` obrigatório |
| Schema | `AsaasSchemas.BuyCredits` (`_shared/schemas.ts`) |

**Body:**

```json
{
  "organization_id": "uuid",
  "package_id": "pkg_starter",
  "amount": 99.90,
  "payment_method": "PIX"
}
```

`payment_method`: `BOLETO` | `CREDIT_CARD` | `PIX` (default: `PIX`).

**Response 200:**

```json
{
  "charge_id": "pay_xxxx",
  "status": "PENDING",
  "pix_qr_code": "00020126...",
  "boleto_url": null,
  "due_date": "2026-05-05"
}
```

**Status codes:** `200` criado | `409` `Idempotency-Key` duplicada em processamento | `422` validação | `502` Asaas indisponível

**Notas:** Idempotência com janela de 24h. Mesmo `Idempotency-Key` com payload diferente retorna `409 idempotency_key_conflict`.

---

#### `asaas-create-charge`

Cria cobrança avulsa para um cliente Asaas.

| Campo | Valor |
|-------|-------|
| Método | `POST` |
| Path | `/functions/v1/asaas-create-charge` |
| Auth required | `JWT` |
| Idempotency | Recomendado |
| Schema | `AsaasSchemas.CreateCharge` (`_shared/schemas.ts`) |

**Body:**

```json
{
  "organization_id": "uuid",
  "customer_id": "cus_xxxx",
  "value": 350.00,
  "due_date": "2026-05-30",
  "description": "Taxa de consultoria",
  "billing_type": "BOLETO"
}
```

**Response 200:**

```json
{
  "id": "pay_xxxx",
  "status": "PENDING",
  "invoiceUrl": "https://asaas.com/i/xxxx",
  "bankSlipUrl": "https://asaas.com/b/pdf/xxxx"
}
```

**Status codes:** `200` criado | `422` validação | `502` Asaas error

---

#### `recharge-credits`

Recarrega créditos de uma organização (operação interna, sem passagem pelo fluxo Asaas completo).

| Campo | Valor |
|-------|-------|
| Método | `POST` |
| Path | `/functions/v1/recharge-credits` |
| Auth required | `JWT` |
| Idempotency | Sim |
| Schema | `CreditsSchemas.Recharge` (`_shared/schemas.ts`) |

**Body:**

```json
{
  "organization_id": "uuid",
  "amount": 500.00,
  "payment_method": "PIX",
  "description": "Recarga manual via painel admin"
}
```

**Response 200:** `{ "new_balance": 1500.00, "transaction_id": "uuid" }`

**Status codes:** `200` | `403` BOLA | `422` validação

---

#### `asaas-webhook`

Recebe eventos de pagamento e assinatura do Asaas.

| Campo | Valor |
|-------|-------|
| Método | `POST` |
| Path | `/functions/v1/asaas-webhook` |
| Auth required | IP allowlist (configurado no painel Asaas) |
| Schema | `WebhookSchemas.AsaasEvent` (`_shared/schemas.ts`) |

**Payload de entrada (exemplo — pagamento confirmado):**

```json
{
  "event": "PAYMENT_RECEIVED",
  "payment": {
    "id": "pay_xxxx",
    "status": "RECEIVED",
    "value": 99.90,
    "netValue": 97.91,
    "customer": "cus_xxxx"
  }
}
```

**Eventos tratados:** `PAYMENT_RECEIVED`, `PAYMENT_OVERDUE`, `PAYMENT_DELETED`, `SUBSCRIPTION_CREATED`, `SUBSCRIPTION_RENEWED`, `SUBSCRIPTION_CANCELLED`.

**Response:** `200 { "received": true }` em todos os casos (Asaas espera 200 para não retentar).

**Notas:** Falhas são registradas via `logJobFailure()` em `job_failures`. Idempotência por `payment.id` + `event`.

---

### 5.3 LGPD / DSR

---

#### `dsr-export-data`

Exporta todos os dados pessoais de um titular conforme Art. 18 da LGPD.

| Campo | Valor |
|-------|-------|
| Método | `POST` |
| Path | `/functions/v1/dsr-export-data` |
| Auth required | `JWT` (titular autenticado) |
| Rate limit | 3 req/hora por usuário |

**Body:**

```json
{
  "organization_id": "uuid",
  "reason": "Solicitação de portabilidade"
}
```

**Response 200:**

```json
{
  "request_id": "uuid",
  "status": "processing",
  "estimated_completion_at": "2026-05-05T10:00:00Z",
  "message": "Você receberá um email com o arquivo quando o processamento for concluído."
}
```

**Status codes:** `200` solicitação registrada | `429` muitas solicitações | `403` usuário não pertence à org

**Notas:** Processamento assíncrono. O arquivo é enviado por email ao titular. Solicitação registrada na tabela `dsr_requests` com `type = 'export'`.

---

#### `dsr-delete-account`

Solicita exclusão de conta e dados pessoais conforme Art. 18 VI da LGPD.

| Campo | Valor |
|-------|-------|
| Método | `POST` |
| Path | `/functions/v1/dsr-delete-account` |
| Auth required | `JWT` (titular autenticado) |
| Rate limit | 1 req/dia por usuário |

**Body:**

```json
{
  "organization_id": "uuid",
  "confirmation": "EXCLUIR MINHA CONTA",
  "reason": "Não desejo mais usar o serviço"
}
```

`confirmation` deve ser exatamente a string `"EXCLUIR MINHA CONTA"` (validação extra anti-acidental).

**Response 200:**

```json
{
  "request_id": "uuid",
  "status": "scheduled",
  "deletion_scheduled_at": "2026-05-17T00:00:00Z",
  "message": "Sua conta será excluída em 15 dias. Você pode cancelar abrindo um chamado de suporte antes desta data."
}
```

**Status codes:** `200` agendado | `400` confirmação incorreta | `409` exclusão já solicitada

**Notas:** Período de carência de 15 dias conforme política LGPD. Soft-delete via `deleted_at` — dados não são destruídos imediatamente. Solicitação em `dsr_requests` com `type = 'delete'`.

---

### 5.4 Geração IA

O sistema possui **16 funções `generate-*`** que utilizam o **Lovable AI Gateway** (Google Gemini 1.5/2.0 Flash). Prompts centralizados em `_shared/prompts/`. Todas exigem JWT e aplicam rate limit de 20 req/min por usuário.

---

#### `generate-content`

Gera conteúdo para redes sociais (posts, legendas, copies).

| Campo | Valor |
|-------|-------|
| Método | `POST` |
| Path | `/functions/v1/generate-content` |
| Auth required | `JWT` |
| Rate limit | 20 req/60s por usuário |
| Schema | `GenerateSchemas.Content` (`_shared/schemas.ts`) |

**Body:**

```json
{
  "organization_id": "uuid",
  "topic": "Lançamento de produto de marketing digital",
  "tone": "motivacional",
  "platform": "instagram",
  "max_chars": 2200,
  "quantidade": 3
}
```

Tons: `amigável` | `formal` | `motivacional` | `consultivo` | `direto`.
Plataformas: `instagram` | `linkedin` | `facebook` | `twitter` | `tiktok`.

**Response 200:**

```json
{
  "contents": [
    { "text": "🚀 Chegou o momento...", "platform": "instagram", "chars": 218 },
    { "text": "Transforme seu negócio...", "platform": "instagram", "chars": 195 }
  ],
  "model": "gemini-1.5-flash",
  "tokens_used": 1240
}
```

**Status codes:** `200` | `429` rate limit | `503` AI Gateway indisponível

---

#### `generate-prospection`

Gera mensagem personalizada de prospecção para um lead B2B.

| Campo | Valor |
|-------|-------|
| Método | `POST` |
| Path | `/functions/v1/generate-prospection` |
| Auth required | `JWT` |
| Rate limit | 20 req/60s |
| Schema | `GenerateSchemas.Prospection` (`_shared/schemas.ts`) |

**Body:**

```json
{
  "organization_id": "uuid",
  "regiao": "São Paulo - SP",
  "nicho": "Clínicas odontológicas",
  "porte": "pequeno",
  "lead_name": "Dr. Carlos",
  "cargo_decisor": "Sócio-proprietário",
  "nivel_contato": "frio",
  "desafio": "Dificuldade em atrair pacientes novos"
}
```

**Response 200:**

```json
{
  "message": "Olá Dr. Carlos, vi que...",
  "subject": "Aumente seus pacientes em São Paulo",
  "follow_up": "Olá! Sigo em aberto para...",
  "tokens_used": 890
}
```

---

#### `generate-strategy`

Gera estratégia de marketing digital completa baseada nas respostas do GPS (questionário estratégico).

| Campo | Valor |
|-------|-------|
| Método | `POST` |
| Path | `/functions/v1/generate-strategy` |
| Auth required | `JWT` |
| Rate limit | 10 req/60s (geração mais longa) |
| Schema | `GenerateExtendedSchemas.Strategy` (`_shared/schemas.ts`) |

**Body:**

```json
{
  "organization_id": "uuid",
  "answers": { "pergunta_1": "resposta", "pergunta_2": "resposta" },
  "section": "trafego_pago"
}
```

**Response 200:** Objeto JSON com plano estratégico estruturado (seções, táticas, KPIs, timeline).

---

#### `generate-script`

Gera roteiro de vídeo ou script de vendas baseado em briefing.

| Campo | Valor |
|-------|-------|
| Método | `POST` |
| Path | `/functions/v1/generate-script` |
| Auth required | `JWT` |
| Rate limit | 20 req/60s |
| Schema | `GenerateExtendedSchemas.Script` (`_shared/schemas.ts`) |

**Body:**

```json
{
  "organization_id": "uuid",
  "stage": "awareness",
  "briefing": "Produto X resolve problema Y para público Z",
  "mode": "video_curto",
  "existingScript": "Rascunho opcional para refinar"
}
```

**Notas:** As 16 funções `generate-*` seguem o mesmo padrão de autenticação e rate limit. As demais (`generate-daily-checklist`, `generate-daily-tasks`, `generate-followup`, `generate-social-image`, `generate-social-video-frames`, `generate-support-access`, `generate-template-layout`, `generate-traffic-strategy`, `generate-video-briefing`) não estão detalhadas aqui por brevidade — consultá-las diretamente no código-fonte em `supabase/functions/generate-*/index.ts`.

---

### 5.5 Webhooks Externos

---

#### `meta-leadgen-webhook`

Recebe leads capturados via formulários Meta Leadgen (Facebook/Instagram Ads).

| Campo | Valor |
|-------|-------|
| Método | `POST` (eventos) / `GET` (verificação do hub) |
| Path | `/functions/v1/meta-leadgen-webhook` |
| Auth required | `HMAC` (`x-hub-signature-256`) |
| Schema | `WebhookSchemas.MetaLeadgen` (`_shared/schemas.ts`) |

**Verificação de hub (GET):**

```
?hub.mode=subscribe&hub.verify_token=TOKEN&hub.challenge=CHALLENGE
```

Retorna `hub.challenge` em texto plano quando o token bate.

**Payload POST (entrada):**

```json
{
  "object": "page",
  "entry": [{
    "id": "PAGE_ID",
    "changes": [{
      "field": "leadgen",
      "value": { "leadgen_id": "LEAD_ID", "form_id": "FORM_ID", "page_id": "PAGE_ID" }
    }]
  }]
}
```

**Response:** `200 { "received": true }`

**Notas:** Validação HMAC em `_shared/hmac.ts`. Ao receber o `leadgen_id`, a função chama a Graph API para buscar os dados completos do lead e cria o registro em `crm_leads`.

---

#### `whatsapp-cloud-webhook`

Recebe mensagens e status de entrega da WhatsApp Cloud API (Meta).

| Campo | Valor |
|-------|-------|
| Método | `POST` (mensagens) / `GET` (verificação) |
| Path | `/functions/v1/whatsapp-cloud-webhook` |
| Auth required | `HMAC` (`x-hub-signature-256`) |

**Response:** `200 { "received": true }` (sempre — Meta retenta em falha).

**Notas:** Valida assinatura Meta. Processa `messages` (texto, imagem, áudio, documento), `statuses` (sent, delivered, read, failed) e `errors`. Persiste em `whatsapp_messages` e dispara eventos Realtime.

---

#### `evolution-webhook`

Recebe eventos do Evolution API (WhatsApp self-hosted).

| Campo | Valor |
|-------|-------|
| Método | `POST` |
| Path | `/functions/v1/evolution-webhook` |
| Auth required | API Key no header `apikey` (configurada no Evolution) |

**Notas:** Suporta eventos `MESSAGES_UPSERT`, `CONNECTION_UPDATE`, `QRCODE_UPDATED`. Persiste em `whatsapp_messages`. Usa circuit breaker em `_shared/whatsappCircuitBreaker.ts`.

---

#### `crm-lead-webhook`

Recebe leads de fontes externas via webhook genérico (formulários de sites, landing pages).

| Campo | Valor |
|-------|-------|
| Método | `POST` |
| Path | `/functions/v1/crm-lead-webhook` |
| Auth required | `Public` (com validação de `api_key` no payload) |
| Schema | `LeadSchemas.Webhook` (`_shared/schemas.ts`) |

**Body:**

```json
{
  "api_key": "chave-do-cliente",
  "name": "João Silva",
  "email": "joao@empresa.com",
  "phone": "+5511999999999",
  "source": "landing-page-produto-x",
  "value": 5000.00,
  "tags": ["interessado", "quente"],
  "custom_fields": { "cidade": "São Paulo" }
}
```

`email` ou `phone` são obrigatórios (pelo menos um).

**Response 200:** `{ "lead_id": "uuid", "status": "created" }`

**Status codes:** `200` | `400` email e phone ausentes | `401` api_key inválida | `422` validação

---

### 5.6 CRM

---

#### `crm-run-automations`

Dispara automações CRM associadas a um lead ou evento.

| Campo | Valor |
|-------|-------|
| Método | `POST` |
| Path | `/functions/v1/crm-run-automations` |
| Auth required | `JWT` |
| Schema | `CrmSchemas.RunAutomations` (`_shared/schemas.ts`) |

**Body:**

```json
{
  "organization_id": "uuid",
  "lead_id": "uuid",
  "trigger": "stage_changed",
  "event_id": "uuid-opcional"
}
```

**Response 200:**

```json
{
  "automations_run": 3,
  "results": [
    { "automation_id": "uuid", "status": "executed", "action": "send_whatsapp" },
    { "automation_id": "uuid", "status": "skipped", "reason": "condition_not_met" }
  ]
}
```

**Status codes:** `200` | `403` BOLA | `404` lead não encontrado | `422` validação

---

### 5.7 WhatsApp

---

#### `whatsapp-send`

Envia mensagem WhatsApp para um contato (texto, mídia, template).

| Campo | Valor |
|-------|-------|
| Método | `POST` |
| Path | `/functions/v1/whatsapp-send` |
| Auth required | `JWT` |
| Schema | `WhatsAppSchemas.Send` (`_shared/schemas.ts`) |

**Body:**

```json
{
  "organization_id": "uuid",
  "instance_id": "uuid-da-instancia",
  "contactPhone": "+5511999999999",
  "message": "Olá! Seu agendamento foi confirmado.",
  "type": "text"
}
```

Para envio de mídia:

```json
{
  "organization_id": "uuid",
  "instance_id": "uuid",
  "contactId": "uuid-contato",
  "type": "image",
  "mediaUrl": "https://cdn.exemplo.com/imagem.jpg",
  "message": "Legenda opcional"
}
```

Para templates:

```json
{
  "type": "template",
  "templateName": "appointment_reminder",
  "templateLanguage": "pt_BR",
  "templateComponents": [{ "type": "body", "parameters": [{ "type": "text", "text": "João" }] }]
}
```

**Response 200:** `{ "message_id": "uuid", "status": "sent" }`

**Status codes:** `200` | `402` créditos insuficientes | `422` validação | `503` instância desconectada

**Notas:** Circuit breaker em `_shared/whatsappCircuitBreaker.ts`. Debita créditos do sistema. Persiste em `whatsapp_messages`.

---

#### `whatsapp-bulk-send`

Envia mensagem em massa para uma lista de contatos (campanha).

| Campo | Valor |
|-------|-------|
| Método | `POST` |
| Path | `/functions/v1/whatsapp-bulk-send` |
| Auth required | `JWT` |
| Schema | `WhatsAppSchemas.BulkSend` (`_shared/schemas.ts`) |

**Body:**

```json
{
  "organization_id": "uuid",
  "dispatch_id": "uuid-do-disparo"
}
```

O `dispatch_id` referencia um registro em `whatsapp_dispatches` que contém a lista de destinatários e o template configurado.

**Response 200:** `{ "queued": true, "total_recipients": 500, "estimated_duration_minutes": 25 }`

**Notas:** Envio assíncrono com delay aleatório por mensagem (anti-spam Meta). Rate limit: 1 requisição por `dispatch_id`.

---

#### `whatsapp-setup`

Configura ou reconfigura uma instância WhatsApp (Cloud API ou Evolution).

| Campo | Valor |
|-------|-------|
| Método | `POST` |
| Path | `/functions/v1/whatsapp-setup` |
| Auth required | `JWT` (role `admin`) |

**Body:**

```json
{
  "organization_id": "uuid",
  "provider": "cloud_api",
  "phone_number_id": "PHONE_NUMBER_ID",
  "waba_id": "WABA_ID",
  "access_token": "EAA...",
  "webhook_verify_token": "token-customizado"
}
```

**Response 200:** `{ "instance_id": "uuid", "status": "configured", "webhook_url": "https://..." }`

---

### 5.8 Cron / Scheduler

Funções invocadas pelo `pg_cron` ou scheduler externo. Todas requerem `Authorization: Bearer <CRON_SECRET>`.

---

#### `agent-followup-cron`

Processa follow-ups automáticos do agente de IA para leads em aberto.

| Campo | Valor |
|-------|-------|
| Método | `POST` |
| Path | `/functions/v1/agent-followup-cron` |
| Auth required | `CRON` |
| Frequência | A cada 1 hora (`pg_cron`) |

**Body:** `{}` (vazio)

**Response 200:** `{ "processed": 42, "errors": 0, "skipped": 8 }`

**Notas:** Busca leads com `next_followup_at <= now()` e estado `pending`. Usa `logJobFailure()` para registrar erros individuais sem abortar o batch.

---

#### `billing-reminder-check`

Verifica cobranças vencidas e envia lembretes de pagamento.

| Campo | Valor |
|-------|-------|
| Método | `POST` |
| Path | `/functions/v1/billing-reminder-check` |
| Auth required | `CRON` |
| Frequência | Diária às 09:00 BRT |

**Response 200:** `{ "reminders_sent": 15, "skipped": 3 }`

**Notas:** Respeita flag `reminder_sent_at` para não enviar duplicatas no mesmo dia. Usa `_shared/job-failures.ts` para DLQ.

---

## 6. Códigos de Erro

| HTTP | Código (`code`) | Situação |
|------|----------------|---------|
| `400` | `VALIDATION_ERROR` / mensagem específica | Payload inválido, campo ausente ou formato incorreto |
| `401` | `missing_authorization_header` | Header `Authorization` ausente |
| `401` | `invalid_token` | JWT expirado, revogado ou malformado |
| `401` | `invalid_token` | CRON_SECRET incorreto |
| `403` | `forbidden` | Usuário autenticado mas sem permissão (RBAC ou BOLA) |
| `404` | `not_found` | Recurso não existe ou não pertence à organização |
| `409` | `request_in_progress` | `Idempotency-Key` recebida mas resposta ainda não disponível |
| `409` | `idempotency_key_conflict` | Mesma `Idempotency-Key`, payload diferente |
| `422` | `VALIDATION_ERROR` | Validação Zod falhou — campo `issues` detalha os problemas |
| `429` | `rate_limit_exceeded` | Limite de requisições atingido — header `Retry-After` indica quando tentar novamente |
| `500` | `internal_error` | Erro não tratado no servidor |
| `502` | `upstream_error` | Provedor externo (Asaas, Meta, Evolution) retornou erro |
| `503` | `service_unavailable` | AI Gateway ou provider indisponível |

**Exemplo de resposta 429:**

```json
HTTP 429 Too Many Requests
Retry-After: 47

{
  "error": "Rate limit exceeded",
  "code": "rate_limit_exceeded",
  "reset_at": "2026-05-02T15:23:47Z",
  "retry_after_seconds": 47
}
```

**Exemplo de resposta 403 (BOLA):**

```json
HTTP 403 Forbidden

{
  "error": "Access denied",
  "code": "forbidden",
  "reason": "user_not_member_of_organization"
}
```

---

## 7. Versionamento

O sistema **não possui versionamento formal de API**. Deploy contínuo via Lovable Cloud: push em `main` → deploy automático de todas as edge functions.

**Implicações:**

- Breaking changes devem ser evitados e, quando necessários, comunicados com antecedência ao time de frontend.
- Mudanças de schema Zod em `_shared/schemas.ts` são consideradas breaking se removerem campos obrigatórios ou alterarem tipos.
- Adição de campos opcionais ao body ou response é considerada non-breaking.
- O campo `x-request-id` na resposta pode ser usado para correlacionar logs em caso de incidente.

**Convenção de branch para mudanças de API:**

```
feat/api-<nome-da-mudanca>     # nova funcionalidade
fix/api-<nome-da-correcao>     # correção sem breaking change
```

---

## 8. OpenAPI / Spec

Não implementado. A geração de um spec OpenAPI/Swagger a partir dos schemas Zod está planejada como melhoria futura.

**Alternativas atuais:**

- Schemas Zod em `supabase/functions/_shared/schemas.ts` são a fonte de verdade de tipos de request.
- Este documento (`docs/API.md`) é a referência humana.
- Tipos TypeScript do banco são gerados via `supabase gen types` (ver `scripts/`).

**Roadmap:**

- [ ] Gerar OpenAPI 3.1 a partir dos schemas Zod usando `zod-to-openapi`
- [ ] Publicar Swagger UI em rota interna (portal franqueadora)
- [ ] Adicionar validação de contrato em testes E2E (Playwright)

# Fluxos de Dados Críticos — Sistema Noé

> Gerado em 2026-05-02. Baseado em análise do código-fonte das edge functions,
> `_shared/`, ARCHITECTURE.md e runbooks.
> Para a visão de arquitetura geral, ver [ARCHITECTURE.md](ARCHITECTURE.md).

---

## Índice

1. [Visão Geral](#1-visão-geral)
2. [Onboarding de novo cliente](#2-onboarding-de-novo-cliente)
3. [Compra de créditos](#3-compra-de-créditos)
4. [Geração de conteúdo com IA](#4-geração-de-conteúdo-com-ia)
5. [Webhook Meta Leadgen](#5-webhook-meta-leadgen)
6. [Convite de membro](#6-convite-de-membro)
7. [DSR Export (LGPD)](#7-dsr-export-lgpd)
8. [Cron job](#8-cron-job)
9. [WhatsApp inbound (Evolution API)](#9-whatsapp-inbound-evolution-api)

---

## 1. Visão Geral

O Sistema Noé processa dados por meio de três canais principais:

```
┌──────────────────────────────────────────────────────────────────────┐
│  FRONTEND (React SPA — Lovable CDN)                                   │
│  Envia JWT + x-request-id em todo fetch para edge functions           │
└──────────────┬──────────────────────┬───────────────────────────────┘
               │ HTTPS/REST           │ WebSocket (Realtime)
               ▼                      ▼
┌──────────────────────────────────────────────────────────────────────┐
│  SUPABASE (gxrhdpbbxfipeopdyygn)                                      │
│  ┌──────────────────────┐   ┌──────────────────────────────────────┐ │
│  │  PostgreSQL + RLS    │   │  Edge Functions (Deno, ~104 fns)     │ │
│  │  organization_id em  │   │  _shared/: cors, auth, hmac,         │ │
│  │  toda tabela         │   │  idempotency, rate-limit, redact,    │ │
│  │  Soft-delete via     │   │  correlation, cron-auth, schemas,    │ │
│  │  deleted_at          │   │  credits, job-failures               │ │
│  └──────────────────────┘   └──────────────────────────────────────┘ │
└──────────────────┬──────────────────────────┬────────────────────────┘
                   │ HTTPS                    │ Webhooks inbound
        ┌──────────┴─────────┐      ┌─────────┴──────────────────┐
        │  Asaas (pagamentos)│      │  Meta / Evolution API       │
        │  Google / LinkedIn │      │  (leads, WhatsApp)          │
        └────────────────────┘      └────────────────────────────┘
```

**Princípios transversais:** Correlation ID (`x-request-id`) em todas as fns. RLS por `organization_id` em toda tabela. JWT via `requireAuth()`. Anti-BOLA via `assertOrgMember()`. PII via `redact()` em todos os logs. Soft-delete (`deleted_at`) para LGPD.

---

## 2. Onboarding de novo cliente

**Ponto de entrada:** Formulário público de signup no frontend.
**Funções envolvidas:** `signup-saas` → `provision-unit` → primeiro login.

```
Usuário (browser)
    │
    │  POST /functions/v1/signup-saas
    │  { email, password, full_name, company_name }
    ▼
┌──────────────────────────────────────────────────┐
│  signup-saas (edge fn)                            │
│  1. Cria auth user via supabase.auth.admin         │
│  2. Envia email de confirmação via Resend          │
│     (buildConfirmationHtml → link JWT de confirm)  │
│  3. Retorna { user_id, message: "check email" }    │
└──────────────────────────┬───────────────────────┘
                           │ usuário clica no link
                           ▼
                    Supabase Auth confirma email
                    → auth.users marcado como confirmed
                           │
                           │  POST /functions/v1/provision-unit
                           │  { unit_name, parent_org_id }
                           │  Bearer JWT do usuário admin de rede
                           ▼
┌──────────────────────────────────────────────────┐
│  provision-unit (edge fn)                         │
│  1. Valida JWT (requireAuth) + role admin_rede     │
│  2. INSERT organizations { name, referral_code }  │
│  3. INSERT organization_memberships               │
│     { user_id, organization_id, role }            │
│  4. Retorna { organization_id }                   │
└──────────────────────────┬───────────────────────┘
                           │
                           ▼
                    Primeiro login do franqueado
                    Frontend → Supabase Auth → JWT com claims
                    → RoleAccessGuard redireciona para /franqueado/*
```

**Dados persistidos:** `auth.users`, `profiles`, `organizations`, `organization_memberships`.

**Segurança:** Email de confirmação via Resend (TTL curto). `provision-unit` exige JWT + role `admin_rede` via assertOrgMember. `organization_id` sempre gerado pelo banco.

---

## 3. Compra de créditos

**Ponto de entrada:** Tela de créditos no frontend (`asaas-buy-credits`).
**Funções envolvidas:** `asaas-buy-credits` → Asaas API → `asaas-webhook`.

```
Frontend (usuário autenticado)
    │
    │  POST /functions/v1/asaas-buy-credits
    │  Authorization: Bearer <JWT>
    │  Idempotency-Key: <uuid>
    │  { organization_id, pack_id, billing_type }
    ▼
┌──────────────────────────────────────────────────────────────┐
│  asaas-buy-credits (edge fn)                                  │
│  1. Valida JWT (getUser)                                      │
│  2. withIdempotency — SHA-256 do payload, dedup em DB         │
│  3. Busca/cria customer no Asaas via getOrCreateAsaasCustomer │
│  4. Calcula split de comissão se org tem parent_org_id        │
│  5. POST /payments na API Asaas com externalReference:        │
│     "{org_id}|credits|{pack_id}"                              │
│  6. Se PIX: busca QR code via GET /payments/{id}/pixQrCode    │
│  7. Retorna { asaas_payment_id, invoice_url, pix_qr_code }    │
└────────────────────────────┬─────────────────────────────────┘
                             │ aguarda pagamento (assíncrono)
                             ▼
                      Usuário paga (boleto/cartão/Pix)
                             │
                             ▼
┌──────────────────────────────────────────────────────────────┐
│  Asaas → POST /functions/v1/asaas-webhook                     │
│  Header: asaas-access-token: <ASAAS_WEBHOOK_TOKEN>            │
│  { event: "PAYMENT_CONFIRMED", payment: { id, customer, … } } │
│                                                               │
│  1. Valida token estático (asaas-access-token header)         │
│  2. Dedup por external_event_id em webhook_events             │
│  3. Resolve org por asaas_customer_id                         │
│  4. Roteia por externalReference prefix:                      │
│     "{orgId}|credits|{packId}" → adiciona créditos            │
│  5. UPDATE credit_wallets SET balance = balance + N           │
│  6. INSERT credit_transactions { type: "purchase", amount: N }│
└──────────────────────────────────────────────────────────────┘
```

**Dados persistidos:** `webhook_events` (dedup), `credit_wallets` (saldo), `credit_transactions` (histórico), `organizations` (asaas_customer_id).

**Segurança:** Idempotência dupla: `Idempotency-Key` frontend + `external_event_id` no webhook. Token validado antes de qualquer lógica. `externalReference` estruturado evita routing baseado em dados não confiáveis do payload. Split calculado server-side.

---

## 4. Geração de conteúdo com IA

**Ponto de entrada:** Qualquer página que chama funções `generate-*`.
**Funções envolvidas:** Frontend → `invokeEdge` → `generate-content` → AI Gateway → `debit_credits`.

```
Frontend (usuário autenticado)
    │
    │  POST /functions/v1/generate-content
    │  Authorization: Bearer <JWT>
    │  x-request-id: <uuid>  ← correlation
    │  { organization_id, quantidade, formatos, tema, … }
    ▼
┌──────────────────────────────────────────────────────────────┐
│  generate-content (edge fn)                                   │
│  1. Valida JWT (getUser)                                      │
│  2. checkRateLimit por (user_id, fn_name)                     │
│     windowSeconds: 60, maxRequests: 20                        │
│  3. Valida payload com Zod (GenerateSchemas.Content)          │
│  4. assertOrgMember(admin, userId, organization_id)           │
│  5. debitIfGPSDone: só debita se GPS concluído                │
│     └─ hasCompletedGPS → marketing_strategies                 │
│     └─ rpc("debit_credits", { org_id, amount: 30 })           │
│  6. POST Lovable AI Gateway (Gemini Flash)                    │
│     com buildSystemPrompt() + buildUserPrompt()               │
│     prompts centralizados em _shared/prompts/                 │
│  7. Retorna { content: [...] }                                │
└──────────────────────────────────────────────────────────────┘
                             │
                             ▼ (dentro de debitIfGPSDone)
                    rpc("debit_credits") atômico no PostgreSQL
                    ┌─────────────────────────────────────────┐
                    │ credit_wallets: balance -= 30            │
                    │ credit_transactions: INSERT type="debit"  │
                    └─────────────────────────────────────────┘
```

**Dados persistidos:** `credit_wallets` (saldo debitado via RPC atômico), `credit_transactions` (type: "debit"), `marketing_strategies` (gate GPS), tabela interna de rate_limits.

**Segurança:** Rate limit 20 req/min por usuário. assertOrgMember previne geração para org alheia. Débito condicional: GPS não concluído → 0 créditos consumidos. Prompts em `_shared/prompts/` — nunca construídos com input direto sem sanitização.

---

## 5. Webhook Meta Leadgen

**Ponto de entrada:** Meta Platform chama a URL do webhook quando há novo lead.
**Função:** `meta-leadgen-webhook`.

```
Meta Platform (servidor externo)
    │
    │  POST /functions/v1/meta-leadgen-webhook
    │  x-hub-signature-256: sha256=<HMAC do rawBody>
    │  { object: "page", entry: [{ id, changes: [{ field: "leadgen", value }] }] }
    ▼
┌──────────────────────────────────────────────────────────────┐
│  meta-leadgen-webhook (edge fn — público, sem JWT)            │
│  1. Lê rawBody como texto (antes de JSON.parse)               │
│  2. verifyMetaWebhook(req, rawBody, META_APP_SECRET)          │
│     └─ computeMetaSignature() + timingSafeEqual()             │
│     └─ Rejeita 401 se inválido (INT-001)                      │
│  3. redact(body) antes de qualquer log (LGPD-001)             │
│  4. Itera entry.changes onde field === "leadgen"               │
│  5. Busca organização pelo page_id em meta_page_connections   │
│  6. Chama API Graph do Meta para recuperar dados do lead      │
│     GET /leadgen/{leadgen_id}?fields=…&access_token=…         │
│  7. INSERT crm_leads { organization_id, name, email, … }      │
│  8. INSERT analytics_events { event: "lead_received" }        │
└──────────────────────────────────────────────────────────────┘
```

**Dados persistidos:** `meta_page_connections` (page_id → org), `crm_leads` (dados do lead), `analytics_events` (métrica de lead recebido).

**Segurança:** HMAC-SHA256 + `timingSafeEqual` antes de qualquer processamento. Sem JWT (webhook público), mas HMAC substitui autenticação. PII do lead sempre redact-ado. `META_APP_SECRET` nunca em logs.

---

## 6. Convite de membro

**Ponto de entrada:** Admin da organização convida novo usuário via UI.
**Função:** `invite-user`.

```
Admin da organização (frontend)
    │
    │  POST /functions/v1/invite-user
    │  Authorization: Bearer <JWT do admin>
    │  { email, role, organization_id }
    ▼
┌──────────────────────────────────────────────────────────────┐
│  invite-user (edge fn)                                        │
│  1. Valida JWT do admin (requireAuth)                         │
│  2. assertOrgMember — admin deve pertencer à org alvo         │
│  3. Verifica se email já existe em auth.users                 │
│     ├─ SIM (usuário existente):                               │
│     │   INSERT organization_memberships { user_id, org_id }  │
│     │   Envia email "adicionado à organização" via Resend     │
│     │   (buildExistingUserInviteHtml → link de login)         │
│     └─ NÃO (novo usuário):                                    │
│         supabase.auth.admin.inviteUserByEmail()               │
│         Supabase gera link de convite com JWT temporário      │
│         Envia email "você foi convidado" via Resend           │
│         (buildInviteHtml → link de criação de conta)          │
└──────────────────────────────────────────────────────────────┘
                             │ novo usuário clica no link
                             ▼
                      Supabase Auth processa invite token
                      → usuário define senha
                      → auth.users criado e confirmado
                      → trigger cria profiles automaticamente
                             │
                             ▼
                      INSERT organization_memberships
                      { user_id, organization_id, role }
                      ← concluído no callback do Auth
```

**Dados persistidos:** `auth.users`, `profiles` (via trigger), `organization_memberships`.

**Segurança:** JWT admin + assertOrgMember (só admin da org pode convidar). Link de convite JWT de curta duração via Supabase Auth. Email via Resend. PII redact-ado via `maskEmail()`.

---

## 7. DSR Export (LGPD)

**Ponto de entrada:** Tela LGPD no portal do cliente (`LGPDSettings`).
**Função:** `dsr-export-data`.

```
Titular dos dados (cliente autenticado)
    │
    │  GET /functions/v1/dsr-export-data
    │  Authorization: Bearer <JWT>
    │  (opcional) ?user_id=X  ← só super_admin pode usar
    ▼
┌──────────────────────────────────────────────────────────────┐
│  dsr-export-data (edge fn)                                    │
│  1. requireAuth(req) → valida JWT, extrai user                │
│  2. Se user_id != user.id: verifica role === "super_admin"    │
│     caso contrário: 403 Forbidden                             │
│  3. Coleta todos os dados do titular:                         │
│     SELECT * FROM profiles WHERE id = target_user_id         │
│     SELECT * FROM organization_memberships WHERE user_id = X  │
│     IDs das orgs → SELECT * FROM crm_leads WHERE assigned_to  │
│     SELECT * FROM whatsapp_messages (via orgs)                │
│     SELECT * FROM audit_logs WHERE user_id = X                │
│  4. Registra DSR em dsr_requests { type: "export", user_id } │
│  5. Retorna JSON com todos os dados                           │
│     Content-Disposition: attachment; filename="data-export.json" │
└──────────────────────────────────────────────────────────────┘
                             │
                             ▼
              Frontend exibe link de download do JSON
              (arquivo gerado em memória — não salvo em Storage)
```

**Dados lidos:** `profiles`, `organization_memberships`, `crm_leads`, `whatsapp_messages`, `audit_logs`. **Persistido:** `dsr_requests` (audit trail da solicitação).

**Segurança:** Titular exporta apenas seus dados (`targetUserId === user.id`). `super_admin` pode exportar de outros. SLA LGPD: 15 dias — fn responde imediatamente. JSON não persistido em Storage (sem cópia permanente de PII).

---

## 8. Cron job

**Ponto de entrada:** `pg_cron` ou scheduler externo dispara edge fn em horário programado.
**Exemplo:** `agent-followup-cron`.

```
pg_cron (PostgreSQL interno)
    │
    │  POST /functions/v1/agent-followup-cron
    │  Authorization: Bearer <CRON_SECRET>
    ▼
┌──────────────────────────────────────────────────────────────┐
│  agent-followup-cron (edge fn)                                │
│  1. checkCronSecret(req) via _shared/cron-auth.ts             │
│     authHeader !== `Bearer ${CRON_SECRET}` → 401             │
│  2. Early-exit: COUNT active agents, skip se = 0             │
│  3. Busca agentes ativos (client_ai_agents)                   │
│  4. Para cada agente: verifica créditos disponíveis           │
│     (credit_wallets.balance > 0)                              │
│  5. Chama Lovable AI Gateway para gerar follow-up             │
│  6. INSERT whatsapp_messages ou dispara envio                 │
│     ┌─ SUCESSO: continua                                      │
│     └─ FALHA: logJobFailure(adminClient, "agent-followup",…) │
│               INSERT job_failures { fn, error, payload }     │
└──────────────────────────────────────────────────────────────┘
                   │ se falha persistente
                   ▼
            job_failures (DLQ interna)
            → monitorado por dashboard ou alerta manual
            → runbook: docs/runbooks/dlq-investigation.md
```

**Dados persistidos:** `whatsapp_messages` (follow-ups gerados), `job_failures` (DLQ interna), `audit_logs`. Lidos: `client_ai_agents`, `credit_wallets`.

**Segurança:** `CRON_SECRET` validado antes de qualquer lógica. Falhas não bloqueiam — `logJobFailure` é fire-and-forget. Créditos verificados antes do AI Gateway.

---

## 9. WhatsApp inbound (Evolution API)

**Ponto de entrada:** Evolution API (VPS externo) envia evento quando mensagem chega.
**Função:** `evolution-webhook`.

```
Evolution API (VPS externo — 129.121.44.127)
    │
    │  POST /functions/v1/evolution-webhook/{org_uuid}
    │  ou POST /functions/v1/evolution-webhook
    │  { event: "messages.upsert", instance: "nome-instancia",
    │    data: { key, message, pushName, … } }
    ▼
┌──────────────────────────────────────────────────────────────┐
│  evolution-webhook (edge fn)                                  │
│  1. resolveOrgId(req, body, adminClient):                     │
│     ├─ UUID no path → usa diretamente (trusted)               │
│     └─ Sem UUID → lookup instance_id em whatsapp_instances    │
│        (whitelist no DB — body.instance não é confiável)      │
│     └─ Não encontrado → 400 Rejected                          │
│  2. Valida event type (messages.upsert, status.update, …)    │
│  3. Extrai phone via maskPhone (redact em logs)               │
│  4. INSERT whatsapp_messages {                                │
│       organization_id, instance_id, message_id,              │
│       from_phone, body, timestamp, direction: "inbound" }    │
│  5. INSERT analytics_events { event: "message_received" }    │
│  6. Realtime notification via Supabase channel               │
└──────────────────────────────────────────────────────────────┘
                             │ Supabase Realtime
                             ▼
                      Frontend recebe evento via WebSocket
                      → invalidate React Query cache
                      → UI exibe nova mensagem em tempo real
```

**Dados persistidos:** `whatsapp_messages` (body, from_phone, direction: "inbound"), `analytics_events`. Lido: `whatsapp_instances` (whitelist).

**Segurança:** path UUID tem precedência sobre body.instance (INT-009). Whitelist no DB: instance não registrada → 400. PII via `maskPhone()`. Circuit breaker em `_shared/whatsappCircuitBreaker.ts`. Sem JWT — org_id resolvido server-side.

---

## Referências

- [ARCHITECTURE.md](ARCHITECTURE.md) — Visão arquitetural completa
- [docs/runbooks/dlq-investigation.md](runbooks/dlq-investigation.md) — Investigar falhas de jobs
- [docs/runbooks/webhook-hmac-failed.md](runbooks/webhook-hmac-failed.md) — Debug de webhooks Meta
- [docs/runbooks/idempotency-conflicts.md](runbooks/idempotency-conflicts.md) — Conflitos de idempotência
- [docs/runbooks/dsr-processing.md](runbooks/dsr-processing.md) — Atendimento de DSRs LGPD
- [ADR-002](adr/002-multi-tenant-rls.md) — Multi-tenancy via organization_id + RLS
- [ADR-003](adr/003-edge-fns-verify-jwt-false.md) — Edge functions com verify_jwt=false
- [ADR-004](adr/004-ai-gateway-gemini.md) — AI Gateway Lovable (Gemini)

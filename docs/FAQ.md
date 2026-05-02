# FAQ — Sistema Noé (grow-guard-system)

> Perguntas frequentes sobre desenvolvimento, configuração e operação.
> Para cenários de erro, ver [TROUBLESHOOTING.md](TROUBLESHOOTING.md).
> Para detalhes de arquitetura, ver [ARCHITECTURE.md](ARCHITECTURE.md).

---

## Índice

1. [Como configuro o Meta App para receber webhooks?](#1-como-configuro-o-meta-app-para-receber-webhooks)
2. [Onde gerencio os créditos das unidades?](#2-onde-gerencio-os-créditos-das-unidades)
3. [Posso exportar dados do sistema?](#3-posso-exportar-dados-do-sistema)
4. [Como funciona o soft-delete no Sistema Noé?](#4-como-funciona-o-soft-delete-no-sistema-noé)
5. [Posso desativar o comportamento de PWA?](#5-posso-desativar-o-comportamento-de-pwa)
6. [Como testar webhooks localmente durante o desenvolvimento?](#6-como-testar-webhooks-localmente-durante-o-desenvolvimento)
7. [Como rodar os testes E2E?](#7-como-rodar-os-testes-e2e)
8. [Posso customizar o Web App Manifest?](#8-posso-customizar-o-web-app-manifest)
9. [Quais são os limites de rate limit das chamadas de IA?](#9-quais-são-os-limites-de-rate-limit-das-chamadas-de-ia)
10. [Como resetar uma conta de teste?](#10-como-resetar-uma-conta-de-teste)
11. [Quem pode acessar cada portal?](#11-quem-pode-acessar-cada-portal)
12. [Como adiciono uma nova edge function?](#12-como-adiciono-uma-nova-edge-function)
13. [As migrations são aplicadas automaticamente?](#13-as-migrations-são-aplicadas-automaticamente)
14. [Como funciona o sistema de créditos com Asaas?](#14-como-funciona-o-sistema-de-créditos-com-asaas)
15. [Qual modelo de IA o sistema usa e onde é configurado?](#15-qual-modelo-de-ia-o-sistema-usa-e-onde-é-configurado)

---

## 1. Como configuro o Meta App para receber webhooks?

O Sistema Noé recebe eventos do Meta via HMAC — o app precisa de dois secrets configurados.

**Passos:**

1. Acesse [developers.facebook.com](https://developers.facebook.com) → seu app → **Settings → Basic**
2. Copie o **App Secret**
3. No Lovable Dashboard → **Settings → Secrets**, adicione:
   - `META_APP_SECRET` — App Secret do Meta
   - `WHATSAPP_APP_SECRET` — App Secret da instância WhatsApp Cloud (pode ser o mesmo)
4. Configure o Webhook URL no Meta App Dashboard:
   - URL: `https://<seu-projeto>.supabase.co/functions/v1/meta-leadgen-webhook`
   - Verify Token: qualquer string fixa (não é validada — o HMAC é o mecanismo real)
5. Assine os campos desejados: `leadgen`, `messages`

**Verificação:**
```sql
SELECT provider, count(*), max(received_at)
FROM webhook_events
WHERE received_at > now() - interval '10 minutes'
GROUP BY provider;
```
Se `meta` aparecer com eventos recentes, o webhook está ativo.

> Para erros de 401/403 após a configuração, ver [TROUBLESHOOTING.md#webhook-meta-retorna-unauthorized](TROUBLESHOOTING.md#4-webhook-meta-retorna-unauthorized).

---

## 2. Onde gerencio os créditos das unidades?

Créditos são gerenciados pelo módulo **Asaas + credit_wallets**.

- **Portal Franqueadora:** `Financeiro → Créditos` — visualiza saldo de todas as unidades
- **Portal Franqueado:** `Financeiro → Minha Carteira` — saldo da unidade, histórico de recargas
- **Programaticamente:**

```sql
-- Saldo atual de uma organização
SELECT balance, organization_id
FROM credit_wallets
WHERE organization_id = '<ORG_UUID>';

-- Histórico de transações
SELECT amount, kind, description, created_at
FROM credit_transactions
WHERE organization_id = '<ORG_UUID>'
ORDER BY created_at DESC
LIMIT 20;
```

Créditos são creditados automaticamente após `CONFIRMED` no webhook Asaas. Para crédito manual, ver runbook [asaas-payment-issues.md](runbooks/asaas-payment-issues.md).

---

## 3. Posso exportar dados do sistema?

**Dados do cliente (LGPD — DSR):** Sim, via fluxo de Data Subject Request. O portal do cliente tem botão "Exportar meus dados" → chama a edge function de DSR, que gera um arquivo JSON com todos os dados vinculados ao usuário.

**Exportação administrativa:**
- Relatórios de campanhas e leads: disponíveis no portal Franqueadora via botão "Exportar CSV"
- Dados brutos: apenas via Supabase Studio com acesso de `service_role` (não disponível para usuários finais por design)

**Retenção:** Dados deletados (soft-delete) são mantidos por 90 dias e depois expurgados via `pg_cron`. Exportações devem ser feitas dentro desse período.

> Regras de LGPD e retenção estão documentadas em [SECURITY-POLICY.md](SECURITY-POLICY.md).

---

## 4. Como funciona o soft-delete no Sistema Noé?

Todas as entidades principais (leads, clientes, campanhas, conversas) usam soft-delete via coluna `deleted_at timestamptz`.

**Comportamento:**
- `DELETE` na UI → preenche `deleted_at = now()`, não remove o registro
- Queries via RLS filtram automaticamente `WHERE deleted_at IS NULL`
- Registros deletados ficam visíveis apenas para `super_admin` via Supabase Studio
- Expurgo permanente ocorre via `pg_cron` após 90 dias

**Como restaurar um registro deletado (admin):**
```sql
-- Restaurar softdelete (executar com service_role via Supabase Studio)
UPDATE public.<tabela>
SET deleted_at = NULL
WHERE id = '<UUID>'
  AND deleted_at IS NOT NULL;
```

**Atenção:** Hard-delete direto via SQL quebra a auditoria. Sempre usar soft-delete ou o mecanismo de expurgo agendado.

---

## 5. Posso desativar o comportamento de PWA?

Não é recomendado — o PWA é parte da experiência mobile do portal do cliente. Mas é possível desabilitar o Service Worker em desenvolvimento.

**Para desabilitar em dev:**
```bash
# No arquivo vite.config.ts, comentar o plugin VitePWA:
# VitePWA({ ... })  ← comentar
npm run dev
```

**Para customizar o manifest (sem desativar):** ver [Pergunta 8](#8-posso-customizar-o-web-app-manifest).

**O ícone de instalação não aparece** em browsers que já têm o app instalado, ou em contextos `http://` (requer HTTPS). Em dev local, use `localhost` — o browser trata `localhost` como contexto seguro.

---

## 6. Como testar webhooks localmente durante o desenvolvimento?

O Supabase não expõe edge functions localmente por padrão. As opções são:

**Opção A — Supabase CLI (recomendado para dev):**
```bash
# Subir edge functions localmente
supabase functions serve meta-leadgen-webhook --env-file .env.local

# Expor via ngrok ou similar
ngrok http 54321
```
Configurar o ngrok URL no Meta App Dashboard temporariamente.

**Opção B — Testar diretamente via curl:**
```bash
# Simular POST de webhook Meta (sem validação HMAC em dev)
curl -X POST \
  https://<ref>.supabase.co/functions/v1/meta-leadgen-webhook \
  -H "Content-Type: application/json" \
  -H "x-hub-signature-256: sha256=<HMAC_CALCULADO>" \
  -d '{"object":"page","entry":[{"changes":[{"field":"leadgen","value":{"leadgen_id":"test-123","page_id":"test"}}]}]}'
```

**Calcular HMAC para testes:**
```bash
echo -n '<BODY_EXATO>' | openssl dgst -sha256 -hmac '<META_APP_SECRET>'
```

> Nunca commitar o `.env.local` com secrets reais.

---

## 7. Como rodar os testes E2E?

Os testes E2E usam Playwright. Chromium é baixado automaticamente na primeira execução.

```bash
# Instalar dependências (incluindo Chromium)
npx playwright install chromium

# Rodar todos os E2E
npm run e2e

# Rodar com UI interativa (debug)
npx playwright test --ui

# Rodar um arquivo específico
npx playwright test e2e/auth.spec.ts

# Ver relatório da última execução
npx playwright show-report
```

**Variáveis necessárias (.env ou CI):**
```
BASE_URL=http://localhost:8080   # ou URL de staging
TEST_USER_EMAIL=...
TEST_USER_PASSWORD=...
```

**Se Chromium não for encontrado:** ver [TROUBLESHOOTING.md#e2e-fail-enoent-chromium](TROUBLESHOOTING.md#12-e2e-fail-enoent-chromium).

Os testes de unit/integration são separados:
```bash
npm run test       # Vitest — unit + integration
npm run coverage   # Com cobertura
```

---

## 8. Posso customizar o Web App Manifest?

Sim. O manifest é gerado pelo plugin `VitePWA` no `vite.config.ts`.

**Localização:** `vite.config.ts` → opções do `VitePWA({ manifest: { ... } })`

**Campos customizáveis:**
- `name` e `short_name` — nome do app instalado
- `theme_color` e `background_color` — cores da splash screen
- `icons` — ícones em múltiplos tamanhos (recomendado: 192x192 e 512x512)
- `start_url` — URL de entrada ao abrir o PWA instalado
- `display` — `standalone` (padrão), `fullscreen`, `minimal-ui`

**Exemplo:**
```typescript
VitePWA({
  manifest: {
    name: 'Sistema Noé',
    short_name: 'Noé',
    theme_color: '#1a1a2e',
    icons: [
      { src: '/icons/192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icons/512.png', sizes: '512x512', type: 'image/png' },
    ],
  },
})
```

Após alterar, rodar `npm run build` para regenerar o `manifest.webmanifest` em `dist/`.

---

## 9. Quais são os limites de rate limit das chamadas de IA?

O sistema usa **Google Gemini via Lovable AI Gateway** (ver [ADR-004](adr/004-ai-gateway-gemini.md)).

**Rate limits aplicados internamente (por organização, por função):**

| Função | Limite padrão |
|--------|--------------|
| Geração de relatórios IA | 10 req/min |
| Chatbot (respostas automáticas) | 30 req/min |
| Análise de leads | 20 req/min |

Os limites são configurados no helper `_shared/rate-limit.ts` e armazenados na tabela `rate_limit_buckets`.

**Para consultar uso atual:**
```sql
SELECT fn_name, user_id, requests_this_window, window_start
FROM rate_limit_buckets
WHERE user_id = '<USER_UUID>'
  AND window_start > now() - interval '1 minute';
```

**Limites do Gemini (upstream):** definidos pelo tier da Lovable AI Gateway. Consultar o Lovable Dashboard para quotas do projeto.

---

## 10. Como resetar uma conta de teste?

**Opção A — Supabase Studio (recomendado):**
1. Acesse [supabase.com](https://supabase.com) → projeto `gxrhdpbbxfipeopdyygn` → **Table Editor**
2. Filtre por `organization_id` da conta de teste
3. Limpe as tabelas na ordem: `credit_transactions` → `credit_wallets` → `leads` → `campaigns`

**Opção B — SQL (service_role):**
```sql
-- Zerar wallet (preserva histórico de auditoria)
UPDATE credit_wallets
SET balance = 0
WHERE organization_id = '<ORG_UUID_DE_TESTE>';

-- Soft-delete de todos os leads de teste
UPDATE leads
SET deleted_at = now()
WHERE organization_id = '<ORG_UUID_DE_TESTE>'
  AND deleted_at IS NULL;
```

**Para resetar senha de usuário de teste:**
```
Supabase Dashboard → Authentication → Users → buscar email → Reset password
```

> Nunca usar dados de produção para testes. Credenciais de teste devem ser solicitadas ao maintainer (@rafmarutaka).

---

## 11. Quem pode acessar cada portal?

O sistema tem 3 portais com RLS aplicado por role:

| Portal | Roles com acesso | Escopo de dados |
|--------|-----------------|----------------|
| `/franqueadora/*` | `super_admin`, `admin` | Todas as organizações da rede |
| `/franqueado/*` | `franqueado`, `franqueado_admin` | Apenas a organização do franqueado |
| `/cliente/*` | `cliente_admin`, `cliente_user` | Apenas dados do cliente autenticado |

O campo `organization_id` é o isolador de tenant — todas as queries passam pela função `current_user_organization_id()` via RLS. Ver [ADR-002](adr/002-multi-tenant-rls.md).

---

## 12. Como adiciono uma nova edge function?

Ver [CONTRIBUTING.md — Seção 4: Edge Functions](../CONTRIBUTING.md#4-edge-functions) para o boilerplate completo.

Resumo:
1. Criar `supabase/functions/<nome-da-fn>/index.ts`
2. Usar os helpers obrigatórios de `_shared/` (cors, auth, rate-limit, idempotency)
3. Configurar `verify_jwt = false` no `config.toml` (padrão do projeto)
4. Deployar via Lovable Cloud — nunca via `supabase functions deploy` direto

---

## 13. As migrations são aplicadas automaticamente?

Sim, via **Lovable Cloud** — a plataforma lê as migrations do repositório Git e aplica em ordem de nome de arquivo.

**Regras obrigatórias:**
- Nunca usar `supabase db push` — isso desincroniza o histórico
- Toda migration deve ser idempotente (`IF NOT EXISTS`, `IF EXISTS`, `CREATE OR REPLACE`)
- Nomear como: `supabase/migrations/YYYYMMDD_NNN_descricao.sql`

Ver [CONTRIBUTING.md — Seção 3: Migrations SQL](../CONTRIBUTING.md#3-migrations-sql) e [ADR-005](adr/005-migrations-idempotent-via-lovable.md).

---

## 14. Como funciona o sistema de créditos com Asaas?

1. Unidade compra créditos via portal → chama `asaas-buy-credits`
2. Asaas cria a cobrança (boleto/cartão) e retorna `charge_id`
3. Após pagamento, Asaas dispara webhook `PAYMENT_CONFIRMED` para `asaas-webhook`
4. A edge function valida o HMAC do Asaas, marca o evento em `webhook_events` e credita a wallet
5. Frontend recebe update via Realtime (tabela `credit_wallets` tem subscription ativa)

O header `Idempotency-Key` é obrigatório nas chamadas de compra para evitar cobranças duplicadas.

---

## 15. Qual modelo de IA o sistema usa e onde é configurado?

O sistema usa **Google Gemini** (1.5 Flash e 2.0 Flash) roteado via **Lovable AI Gateway**.

- Modelo padrão: `gemini-1.5-flash` (custo/velocidade)
- Modelo para análises pesadas: `gemini-2.0-flash`
- Configuração: `_shared/prompts/` define os system prompts por módulo
- Chave de API: gerenciada pelo Lovable AI Gateway — não há `GEMINI_API_KEY` exposta no projeto

Ver [ADR-004](adr/004-ai-gateway-gemini.md) para a decisão de arquitetura.

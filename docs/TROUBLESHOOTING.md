# Troubleshooting — Sistema Noé (grow-guard-system)

> Cenários comuns de erro e como resolvê-los.
> Para perguntas conceituais, ver [FAQ.md](FAQ.md).
> Para detalhes de arquitetura, ver [ARCHITECTURE.md](ARCHITECTURE.md).
> Runbooks completos: `docs/runbooks/`.

---

## Índice

1. [Build falha localmente](#1-build-falha-localmente)
2. [Edge function retorna 401 ou 403](#2-edge-function-retorna-401-ou-403)
3. [Edge function retorna 403 mesmo com JWT válido](#3-edge-function-retorna-403-mesmo-com-jwt-válido)
4. [Webhook Meta retorna Unauthorized](#4-webhook-meta-retorna-unauthorized)
5. [Cobrança Asaas duplicada](#5-cobrança-asaas-duplicada)
6. [Erro de CORS no console do browser](#6-erro-de-cors-no-console-do-browser)
7. [Realtime não recebe updates](#7-realtime-não-recebe-updates)
8. [Erro 409 — Idempotency-Key conflict](#8-erro-409--idempotency-key-conflict)
9. [Erros de TypeScript após git pull](#9-erros-de-typescript-após-git-pull)
10. [Testes falham com vi.mock](#10-testes-falham-com-vimock)
11. [E2E falha com ENOENT / Chromium não encontrado](#11-e2e-falha-com-enoent--chromium-não-encontrado)
12. [Prerender react-snap travou ou falhou](#12-prerender-react-snap-travou-ou-falhou)
13. [PWA install não aparece no browser](#13-pwa-install-não-aparece-no-browser)
14. [Realtime subscription para de funcionar após idle](#14-realtime-subscription-para-de-funcionar-após-idle)
15. [Jobs acumulando na tabela job_failures (DLQ)](#15-jobs-acumulando-na-tabela-job_failures-dlq)

---

## 1. Build falha localmente

**Sintomas comuns:**
- `npm run build` encerra com erro
- `npm run types:check` retorna erros de TypeScript
- Vite não consegue resolver importações

**Diagnóstico passo a passo:**

```bash
# 1. Verificar Node.js — precisa ser v22+
node -v

# 2. Reinstalar dependências do zero
rm -rf node_modules package-lock.json
npm install

# 3. Checar erros de TypeScript isoladamente
npm run types:check

# 4. Checar lint
npm run lint

# 5. Tentar build com output verboso
npm run build -- --debug
```

**Causa mais comum — variáveis de ambiente ausentes:**
```bash
# Verificar se .env existe e tem as variáveis mínimas
cat .env | grep VITE_SUPABASE
```
O arquivo `.env.example` lista todas as variáveis obrigatórias. Copiar e preencher:
```bash
cp .env.example .env
# Preencher VITE_SUPABASE_PUBLISHABLE_KEY com o valor do Supabase Dashboard
```

**Se o erro for em tipos gerados (`supabase/types.ts`):**
```bash
# Regenerar tipos do banco de dados
npx supabase gen types typescript --project-id gxrhdpbbxfipeopdyygn > src/integrations/supabase/types.ts
```

---

## 2. Edge function retorna 401

**Sintoma:** Chamada a uma edge function retorna `401 Unauthorized`.

**Causas e soluções:**

**A — Token JWT ausente ou expirado no request:**
```bash
# Verificar se o token está sendo enviado
curl -X POST https://<ref>.supabase.co/functions/v1/<fn> \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json"
```
No frontend, confirmar que `supabase.auth.getSession()` está retornando sessão ativa antes da chamada.

**B — Usuário não autenticado acessando rota protegida:**
Verificar se o componente React envolve a chamada em guard de autenticação. Todas as rotas autenticadas devem estar dentro de `<ProtectedRoute>`.

**C — Token com claim `organization_id` ausente:**
```sql
-- Verificar claims do usuário no banco
SELECT raw_user_meta_data
FROM auth.users
WHERE id = '<USER_UUID>';
```
Se `organization_id` não estiver nos metadata, o usuário não foi vinculado a uma organização durante o onboarding.

---

## 3. Edge function retorna 403 mesmo com JWT válido

**Sintoma:** Usuário autenticado recebe `403 Forbidden`.

**Causas:**

**A — RLS bloqueando a query:**
```sql
-- Testar a query como o usuário (Supabase Studio → SQL Editor)
SET LOCAL role TO authenticated;
SET LOCAL "request.jwt.claims" TO '{"sub": "<USER_UUID>", "organization_id": "<ORG_UUID>"}';

SELECT * FROM <tabela> WHERE organization_id = '<ORG_UUID>';
```
Se retornar vazio, a policy RLS está bloqueando. Verificar as policies da tabela:
```sql
SELECT policyname, cmd, qual
FROM pg_policies
WHERE tablename = '<tabela>';
```

**B — Role do usuário sem permissão para a operação:**
Verificar se o campo `role` em `auth.users.raw_user_meta_data` corresponde ao esperado pela fn (`super_admin`, `admin`, `franqueado`, etc).

**C — `verify_jwt = true` na função (configuração incorreta):**
Por padrão, todas as fns usam `verify_jwt = false` e fazem autenticação interna. Se uma fn está com `verify_jwt = true`, o Supabase valida o JWT antes de chamar a fn — tokens de anon ou webhook externos são rejeitados.

---

## 4. Webhook Meta retorna Unauthorized

**Sintoma:** Leads do Meta param de chegar; logs mostram `HMAC validation failed`.

**Diagnóstico:**
```
Lovable Dashboard → Functions → meta-leadgen-webhook → Logs
Buscar: "HMAC validation failed"
```

**Solução — Secret ausente ou incorreta:**
1. Acesse **Lovable Dashboard → Settings → Secrets**
2. Confirme que `META_APP_SECRET` e `WHATSAPP_APP_SECRET` existem
3. Compare com o valor em `developers.facebook.com → seu app → Settings → Basic → App Secret`
4. Se diferente, atualizar o secret (aguarda reinicialização automática em ~30s)

**Verificar se eventos voltaram:**
```sql
SELECT provider, count(*), max(received_at)
FROM webhook_events
WHERE received_at > now() - interval '5 minutes'
GROUP BY provider;
```

> Ver runbook completo: [docs/runbooks/webhook-hmac-failed.md](runbooks/webhook-hmac-failed.md)

---

## 5. Cobrança Asaas duplicada

**Sintoma:** Cliente reporta duas cobranças para o mesmo pedido, ou créditos não chegaram após pagamento confirmado.

**Diagnóstico rápido:**
```sql
-- Verificar se Idempotency-Key foi usada
SELECT key, fn_name, response_status, created_at
FROM idempotency_keys
WHERE user_id = '<USER_UUID>'
  AND fn_name = 'asaas-buy-credits'
ORDER BY created_at DESC
LIMIT 5;
```

**Se chave duplicada existir:** o sistema detectou e bloqueou — verificar se o frontend está apresentando erro corretamente.

**Se chave ausente:** o frontend não enviou `Idempotency-Key` no header. Bug de frontend — verificar se `x-idempotency-key` está sendo gerado por interação.

**Para estornar cobrança duplicada:**
1. Asaas Dashboard → Cobranças → identificar a duplicata
2. Estornar via UI do Asaas
3. Não deletar entradas de `idempotency_keys` (manter auditoria)

**Créditos não chegaram após pagamento:**
```sql
SELECT external_event_id, received_at, processed_at
FROM webhook_events
WHERE provider = 'asaas'
  AND received_at > now() - interval '1 day'
  AND processed_at IS NULL;
```
`processed_at IS NULL` há >5min indica processamento travado. Verificar logs da fn `asaas-webhook` e reenviar via Asaas Dashboard → Webhooks → Reenviar.

> Ver runbook completo: [docs/runbooks/asaas-payment-issues.md](runbooks/asaas-payment-issues.md)

---

## 6. Erro de CORS no console do browser

**Sintoma:** Console mostra `Access-Control-Allow-Origin` ausente; requests bloqueados pelo browser.

**Causa mais comum:** Edge function não retorna headers CORS na resposta de erro (exceptions capturadas sem o helper).

**Verificação:**
```bash
curl -X OPTIONS https://<ref>.supabase.co/functions/v1/<fn> \
  -H "Origin: http://localhost:8080" \
  -v 2>&1 | grep -i "access-control"
```
Deve retornar `Access-Control-Allow-Origin: *`.

**Solução:** A fn deve retornar `corsHeaders` em TODOS os paths de resposta, inclusive erros:

```typescript
import { corsHeaders } from "../_shared/cors.ts";

// Retorno de erro também precisa dos headers
return new Response(
  JSON.stringify({ error: "mensagem" }),
  { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
);
```

**Se o erro ocorre apenas em produção (não em localhost):** verificar se o domínio do frontend está listado como origem permitida no Supabase Dashboard → API → CORS Allowed Origins.

---

## 7. Realtime não recebe updates

**Sintoma:** UI não atualiza após mudanças no banco; subscription aparentemente ativa mas sem eventos.

**Diagnóstico:**

```bash
# Checar no console do browser se a subscription está conectada
# Supabase Realtime usa WebSocket — verificar Network tab → WS
```

**A — Tabela sem Realtime habilitado:**
```sql
-- Verificar quais tabelas têm Realtime ativo
SELECT schemaname, tablename
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime';
```
Se a tabela não aparecer, habilitar no Supabase Dashboard → Database → Replication → supabase_realtime → Add tables.

**B — RLS bloqueando o evento Realtime:**
O Realtime respeita RLS — se o usuário não tem `SELECT` na tabela, não recebe eventos. Verificar policies.

**C — Subscription não foi reativada após reconexão:**
O cliente Supabase reconecta automaticamente, mas subscriptions precisam ser re-registradas em alguns cenários. Verificar se o hook de Realtime está usando `useEffect` com cleanup correto:

```typescript
useEffect(() => {
  const channel = supabase
    .channel('minha-subscription')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'minha_tabela' }, handler)
    .subscribe();

  return () => { supabase.removeChannel(channel); };
}, []);
```

---

## 8. Erro 409 — Idempotency-Key conflict

**Sintoma:** Frontend recebe `HTTP 409` com `{ "error": "idempotency_key_conflict" }`.

**Causa normal (sistema funcionando corretamente):**
O mesmo `Idempotency-Key` foi enviado duas vezes. O 409 protege contra processamento duplo. O frontend deve usar a resposta cacheada do primeiro request — não reenviar com a mesma chave.

**Causa de bug — chave travada:**
```sql
-- Chaves sem response_status (requisição anterior falhou no meio)
SELECT key, fn_name, created_at, expires_at
FROM idempotency_keys
WHERE response_status IS NULL
  AND expires_at > now()
  AND created_at < now() - interval '5 minutes';
```

**Para liberar chave travada:**
```sql
UPDATE idempotency_keys
SET expires_at = now() - interval '1 second'
WHERE key = '<KEY>'
  AND response_status IS NULL;
```

**Regra de ouro:** O frontend deve gerar UUID v4 novo por interação do usuário. Retries automáticos devem usar nova chave, não reutilizar a original.

> Ver runbook completo: [docs/runbooks/idempotency-conflicts.md](runbooks/idempotency-conflicts.md)

---

## 9. Erros de TypeScript após git pull

**Sintoma:** `npm run types:check` quebra após puxar mudanças do main.

**A — Tipos do banco desatualizados:**
Se uma migration foi adicionada, os tipos gerados (`src/integrations/supabase/types.ts`) podem estar defasados.

```bash
# Regenerar tipos
npx supabase gen types typescript --project-id gxrhdpbbxfipeopdyygn \
  > src/integrations/supabase/types.ts
```

**B — Dependências novas não instaladas:**
```bash
npm install
```

**C — Conflito de versão de pacote:**
```bash
# Verificar se há peer dependency warnings
npm install --legacy-peer-deps
```

**D — Mudanças em `tsconfig.json`:**
```bash
# Checar o diff do tsconfig
git diff HEAD~1 tsconfig.json tsconfig.app.json
```
Se `strict` foi habilitado em algum arquivo, erros latentes podem aparecer. Ver [docs/ts-strict-rollout.md](ts-strict-rollout.md) para o plano de adoção gradual.

---

## 10. Testes falham com vi.mock

**Sintoma:** Testes Vitest falham com `Cannot mock module '...'` ou o mock não substitui o módulo corretamente.

**Causa A — `vi.mock` deve estar no topo do arquivo (antes de imports):**
```typescript
// ERRADO — vi.mock após import
import { minhaFuncao } from '../lib/modulo';
vi.mock('../lib/modulo');

// CORRETO — vi.mock antes de tudo
vi.mock('../lib/modulo');
import { minhaFuncao } from '../lib/modulo';
```
O Vitest eleva (hoists) `vi.mock` automaticamente, mas variáveis do escopo do teste não estão disponíveis dentro da factory — usar `vi.importMock` ou factories sem closures sobre variáveis locais.

**Causa B — Mock de módulo Supabase não está configurado:**
Verificar se `src/integrations/supabase/client.ts` está sendo mockado no setup global (`vitest.config.ts → setupFiles`).

**Causa C — Módulo com efeitos colaterais na importação:**
```typescript
// Usar vi.doMock (lazy) para módulos com side effects
vi.doMock('../lib/modulo-com-side-effect', () => ({ default: mockFn }));
```

---

## 11. E2E falha com ENOENT / Chromium não encontrado

**Sintoma:**
```
Error: browserType.launch: Executable doesn't exist at /home/.../.cache/ms-playwright/chromium-*/chrome-linux/chrome
```

**Solução:**
```bash
# Instalar os browsers necessários
npx playwright install chromium

# Se precisar de todas as dependências do sistema (Linux CI)
npx playwright install-deps chromium
```

**Em CI (GitHub Actions):**
```yaml
- name: Install Playwright browsers
  run: npx playwright install --with-deps chromium
```

**Se o download falhar por rede/proxy:**
```bash
# Definir mirror alternativo
PLAYWRIGHT_DOWNLOAD_HOST=https://playwright.azureedge.net npx playwright install chromium
```

**Verificar instalação:**
```bash
npx playwright --version
ls ~/.cache/ms-playwright/
```

---

## 12. Prerender react-snap travou ou falhou

**Sintoma:** `npm run build` conclui mas o prerender (react-snap) trava ou gera páginas em branco.

**Diagnóstico:**
```bash
# Rodar prerender com output verboso
npx react-snap --include "/" --puppeteer-args="--no-sandbox"
```

**A — react-snap tentando renderizar rotas privadas:**
Configurar o `react-snap` para excluir rotas autenticadas no `package.json`:
```json
"reactSnap": {
  "exclude": ["/franqueadora", "/franqueado", "/cliente"]
}
```

**B — Chromium não encontrado pelo Puppeteer interno:**
```bash
# Definir caminho do Chromium instalado pelo Playwright
PUPPETEER_EXECUTABLE_PATH=$(npx playwright install --dry-run chromium 2>&1 | grep "chromium" | tail -1) \
  npx react-snap
```

**C — Timeout em páginas com fetch de dados:**
Aumentar timeout no config ou mockar os fetches para o ambiente de prerender:
```json
"reactSnap": {
  "puppeteerArgs": ["--timeout=60000"]
}
```

**Alternativa:** Se o prerender está causando mais problemas que benefícios, desabilitar temporariamente removendo o script `postbuild` do `package.json` e abrir issue para revisão.

---

## 13. PWA install não aparece no browser

**Sintoma:** Ícone de instalação (install prompt) não aparece na barra do browser.

**Checklist de pré-requisitos para o install prompt:**

- [ ] O site é servido via **HTTPS** (ou `localhost`)
- [ ] O `manifest.webmanifest` está linkado no `index.html`
- [ ] Os campos obrigatórios do manifest estão presentes: `name`, `short_name`, `icons` (com 192×192 e 512×512), `start_url`, `display`
- [ ] Há um **Service Worker registrado e ativo**
- [ ] O usuário não instalou o app anteriormente neste browser

**Verificar via DevTools:**
```
Chrome DevTools → Application → Manifest
Chrome DevTools → Application → Service Workers
Chrome DevTools → Application → Storage → Clear Storage (para resetar estado de instalação)
```

**Se o manifest for válido mas o prompt não aparecer:**
O Chrome pode aguardar até 30 dias antes de mostrar novamente para o mesmo usuário. Limpar o storage e recarregar força um novo ciclo.

**Em dev local:** o prompt funciona em `localhost` sem HTTPS. Se não aparecer, verificar se o Service Worker está registrado (sem erros no console).

---

## 14. Realtime subscription para de funcionar após idle

**Sintoma:** Após o browser ficar inativo (aba em background ou computador em sleep), o Realtime para de disparar eventos mesmo após o browser volcar.

**Causa:** O WebSocket do Supabase Realtime fecha por timeout de idle. O SDK reconecta automaticamente, mas subscriptions antigas podem não ser re-registradas.

**Solução — adicionar listener de visibilidade:**
```typescript
useEffect(() => {
  const handleVisibility = () => {
    if (document.visibilityState === 'visible') {
      // Forçar reconexão das subscriptions
      supabase.channel('minha-subscription').subscribe();
    }
  };
  document.addEventListener('visibilitychange', handleVisibility);
  return () => document.removeEventListener('visibilitychange', handleVisibility);
}, []);
```

**Verificar no Supabase Dashboard:**
```
Supabase Dashboard → Database → Realtime → verifica se a tabela tem replication habilitada
```

---

## 15. Jobs acumulando na tabela job_failures (DLQ)

**Sintoma:** Notificações de alerta sobre `job_failures` crescendo; features específicas param de funcionar silenciosamente.

**Diagnóstico:**
```sql
-- Visão geral do DLQ por tipo e erro
SELECT
  job_type,
  error_code,
  count(*) AS count,
  min(failed_at) AS oldest,
  max(failed_at) AS newest
FROM job_failures
WHERE resolved_at IS NULL
GROUP BY job_type, error_code
ORDER BY count DESC;
```

**Para ver detalhes de um job específico:**
```sql
SELECT job_type, error_code, error_message, payload, failed_at
FROM job_failures
WHERE resolved_at IS NULL
ORDER BY failed_at DESC
LIMIT 10;
```

**Causas comuns e ações:**

| error_code | Causa | Ação |
|------------|-------|------|
| `network_timeout` | Serviço externo lento | Verificar status da integração (Meta, Asaas) |
| `rate_limit_exceeded` | Burst de chamadas IA | Aguardar ou ajustar limites — ver runbook [rate-limit-tuning.md](runbooks/rate-limit-tuning.md) |
| `schema_validation_failed` | Payload inválido | Corrigir o código que gera o payload |
| `auth_failed` | Secret expirada | Verificar Lovable Secrets |

**Marcar jobs como resolvidos após correção:**
```sql
UPDATE job_failures
SET resolved_at = now(), resolution_note = 'Causa identificada: <descrição>'
WHERE job_type = '<tipo>'
  AND resolved_at IS NULL;
```

> Ver runbook completo: [docs/runbooks/dlq-investigation.md](runbooks/dlq-investigation.md)

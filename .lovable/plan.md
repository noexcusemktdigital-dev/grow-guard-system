

## Diagnóstico Completo — Erros Silenciosos e Correções

### Problemas Identificados

**1. `getClaims()` — 9 Edge Functions quebradas (CRÍTICO)**
O método `auth.getClaims()` não existe no SDK Supabase v2. Isso causa **erro 500 silencioso** em todas essas funções:
- `whatsapp-typing`
- `whatsapp-bulk-send`
- `recharge-credits`
- `generate-script`
- `generate-strategy`
- `generate-prospection`
- `generate-daily-checklist`
- `google-calendar-oauth`
- `google-calendar-sync`

**Correção:** Substituir `getClaims(token)` por `getUser()` em todas, seguindo o padrão já corrigido em `whatsapp-setup` e `whatsapp-send`.

**2. URL do Webhook de Leads (CRM) incorreta na UI**
A UI gera: `...crm-lead-webhook?org_id=${orgId}` (query param)
Mas a Edge Function extrai o org_id do **path**: `url.pathname.split("/")`
Resultado: O webhook nunca encontra a organização — retorna 400.

**Correção:** Mudar a URL na UI para `...crm-lead-webhook/${orgId}` (path param).

**3. `whatsapp-typing` só suporta Z-API**
Quando a instância conectada é Evolution, o endpoint Z-API `/typing` falha silenciosamente. Deve suportar Evolution ou pular graciosamente.

---

### Plano de Implementação

#### Tarefa 1: Corrigir `getClaims` em todas as 9 Edge Functions
Para cada uma, substituir o bloco:
```typescript
const token = authHeader.replace("Bearer ", "");
const { data: claimsData, error: claimsError } = await client.auth.getClaims(token);
if (claimsError || !claimsData?.claims) { ... }
const userId = claimsData.claims.sub;
```
Por:
```typescript
const { data: { user }, error: userError } = await client.auth.getUser();
if (userError || !user) { ... }
const userId = user.id;
```

#### Tarefa 2: Corrigir URL do webhook de leads na UI
**Arquivo:** `src/pages/cliente/ClienteIntegracoes.tsx` (linha ~417)
Mudar de:
```typescript
const webhookUrl = orgId ? `https://${projectId}.supabase.co/functions/v1/crm-lead-webhook?org_id=${orgId}` : "";
```
Para:
```typescript
const webhookUrl = orgId ? `https://${projectId}.supabase.co/functions/v1/crm-lead-webhook/${orgId}` : "";
```

#### Tarefa 3: Suporte a Evolution no `whatsapp-typing`
**Arquivo:** `supabase/functions/whatsapp-typing/index.ts`
- Adicionar suporte ao provedor Evolution (não tem endpoint nativo de typing — retornar sucesso silencioso)
- Já incluído na correção do `getClaims`

#### Tarefa 4: Revisão do CRM
O CRM está funcional com base na análise:
- Pipeline Kanban com drag-and-drop ✅
- Filtros avançados ✅
- Ações em massa ✅
- Criação/edição de leads ✅
- Pipeline summary ✅
- Paginação server-side ✅

Nenhum bug estrutural encontrado no CRM. As falhas reportadas decorrem das Edge Functions quebradas (getClaims) que impedem ações como enviar WhatsApp, typing indicator, e integração com webhooks.

---

### Arquivos a editar
1. `supabase/functions/whatsapp-typing/index.ts` — getClaims + Evolution support
2. `supabase/functions/whatsapp-bulk-send/index.ts` — getClaims
3. `supabase/functions/recharge-credits/index.ts` — getClaims
4. `supabase/functions/generate-script/index.ts` — getClaims
5. `supabase/functions/generate-strategy/index.ts` — getClaims
6. `supabase/functions/generate-prospection/index.ts` — getClaims
7. `supabase/functions/generate-daily-checklist/index.ts` — getClaims
8. `supabase/functions/google-calendar-oauth/index.ts` — getClaims
9. `supabase/functions/google-calendar-sync/index.ts` — getClaims
10. `src/pages/cliente/ClienteIntegracoes.tsx` — URL webhook correta


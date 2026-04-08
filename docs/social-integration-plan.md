# Noexcuse — Plano Mestre: Social & Ads Integration
**Data:** 2026-04-08 | **Versão:** 2.0 | **Abordagem:** APIs Diretas (fetch nativo Deno)

---

## RESUMO EXECUTIVO

O sistema já possui base sólida (OAuth pattern, `ad_platform_connections`, geração IA de conteúdo). Há **6 vulnerabilidades críticas** que devem ser corrigidas **antes** de adicionar novas integrações — caso contrário os novos OAuth flows herdam os mesmos problemas.

**Descoberta crítica da pesquisa de APIs:** Nenhum SDK oficial (Meta, Google Ads, LinkedIn) roda no Deno. Toda implementação será com `fetch()` nativo — isso simplifica as dependências e remove risco de incompatibilidade.

**Estimativa total:** 5-6 semanas.

---

## STACK TÉCNICO DEFINITIVO

| Plataforma | Abordagem | Base URL | Versão atual |
|---|---|---|---|
| **Meta / Instagram** | `fetch()` nativo | `https://graph.facebook.com/v25.0/` | v25.0 |
| **Facebook Pages** | `fetch()` nativo | `https://graph.facebook.com/v25.0/` | v25.0 |
| **Google Ads** | `fetch()` REST | `https://googleads.googleapis.com/v23/` | v23 |
| **LinkedIn** | `fetch()` nativo | `https://api.linkedin.com/rest/` | 202603 |
| **TikTok** | `fetch()` nativo | `https://open.tiktokapis.com/v2/` | v2 |

> **Por que não usar SDKs npm?**
> - `facebook-nodejs-business-sdk` — usa módulos Node (`http`, `https`, `fs`) — não roda no Deno
> - `google-ads-api` (Opteo) — usa gRPC — não roda no Deno
> - `linkedin-api-client` — usa axios e módulos Node — não roda no Deno
> - Solução: `fetch()` direto com headers corretos — código mais simples, zero dependências

---

## TIMELINES DE APROVAÇÃO (começar imediatamente)

| Plataforma | Tempo aprovação | Funciona antes? | Ação imediata |
|---|---|---|---|
| **Meta / Instagram** | 24-48h | Sim (app em dev mode) | Criar app + System User token |
| **Facebook Pages** | Junto com Meta | Sim | Mesmas credenciais |
| **Google Ads** | 1-2 semanas | Sim (test accounts) | Solicitar Developer Token agora |
| **LinkedIn orgânico** | **Sem aprovação** | Sim, imediato | Criar app + configurar scopes |
| **LinkedIn Ads (MDP)** | 2-4 semanas | Não | Solicitar Marketing Developer Platform |
| **TikTok** | Variável (semanas) | Não para posts públicos | Última prioridade |

---

## PARTE 1 — ANÁLISE TÉCNICA PROFUNDA DAS APIs

---

### 1.1 META GRAPH API (Instagram + Facebook Pages)

**Versão atual:** v25.0 | Descontinuação de v25.0: Maio 2027

#### Instagram — Fluxo de Publicação (2 etapas obrigatórias)

**Etapa 1 — Criar container de mídia:**
```http
POST https://graph.facebook.com/v25.0/{ig-user-id}/media

Parâmetros:
  image_url   — URL pública JPEG (imagens)
  video_url   — URL pública do vídeo (reels/stories)
  media_type  — IMAGE | VIDEO | REELS | STORIES | CAROUSEL (omitir para imagens simples)
  caption     — Até 2.200 chars, máx 30 hashtags, 20 @menções
  alt_text    — Até 1.000 chars (apenas imagens, adicionado março/2025)
  collaborators — Até 3 usernames para collab posts

Resposta: {"id": "<IG_CONTAINER_ID>"}
```

**Etapa 2 — Publicar:**
```http
POST https://graph.facebook.com/v25.0/{ig-user-id}/media_publish

Parâmetros:
  creation_id — container ID da etapa 1
  access_token

Permissões necessárias: instagram_basic + instagram_content_publish
```

**Para vídeos — polling obrigatório de status:**
```http
GET https://graph.facebook.com/v25.0/{container-id}?fields=status_code

Valores: FINISHED | IN_PROGRESS | EXPIRED | ERROR | PUBLISHED
TTL do container: 24 horas — se expirar, recriar do zero
Polling: 1x por minuto, max 5 minutos
```

#### Instagram — Formatos de mídia (CRÍTICO)

| Tipo | Formato | Restrições |
|---|---|---|
| **Imagem** | **JPEG APENAS** (PNG/WebP/GIF = erro) | Max 8MB, aspect 4:5 a 1.91:1, min 320px, max 1.440px, sRGB |
| **Reels** | MOV ou MP4, H.264/HEVC, AAC audio | Frame 23-60 FPS, max 1.920px, duração 3s-15min, max 300MB |
| **Stories** | MOV ou MP4 | Duração 3-60s, max 100MB |
| **Carrossel** | Até 10 itens | Todos cortados para o aspect ratio do primeiro item |

#### Instagram — Limites de publicação

| Limite | Valor | Escopo |
|---|---|---|
| Posts publicados | 100 / 24h (rolling) | Por conta IG |
| Containers criados | 400 / 24h (rolling) | Por conta IG |

Verificar quota em tempo real:
```http
GET https://graph.facebook.com/v25.0/{ig-user-id}/content_publishing_limit
    ?fields=quota_usage,config
```

#### Instagram — NÃO suporta agendamento nativo
Publicações do Instagram via API são **imediatas apenas**. Scheduling deve ser implementado com BullMQ + delayed jobs. **Exceção: Facebook Pages** suporta agendamento (10 min a 30 dias via `scheduled_publish_time` + `published=false`).

#### Instagram — Auth: dois caminhos distintos

**Caminho A — Business Login for Instagram (novo, mais simples):**
```
Base URL: graph.instagram.com
Scopes: instagram_business_basic, instagram_business_content_publish,
        instagram_business_manage_comments, instagram_business_manage_messages
```

**Caminho B — Facebook Login (mais completo, requer Page vinculada):**
```
Base URL: graph.facebook.com
Scopes: instagram_basic, instagram_content_publish, instagram_manage_comments,
        instagram_manage_insights, instagram_manage_messages,
        pages_show_list, pages_read_engagement
```
> Caminho B dá acesso a insights — recomendado para o sistema.

#### Tokens Meta — ciclo de vida

| Tipo | Validade | Uso |
|---|---|---|
| Short-lived User Token | **1 hora** | Trocar imediatamente |
| Long-lived User Token | 60 dias | Renovar quando restar >7 dias |
| Page Access Token (derivado do long-lived) | Expira com o user token | Não usar para automação |
| **System User Token** | **Nunca expira** | **Usar em produção** |

Trocar short-lived → long-lived:
```http
GET https://graph.facebook.com/oauth/access_token
    ?grant_type=fb_exchange_token
    &client_id={APP_ID}
    &client_secret={APP_SECRET}
    &fb_exchange_token={SHORT_TOKEN}
```

**Recomendação de produção:** Criar System User no Business Manager > Configurações > Usuários do Sistema. Tokens nunca expiram e são vinculados a ativos (não a pessoas). Standard Access: 1 system user; Advanced: 10.

#### Facebook Pages — Publicação

```http
POST https://graph.facebook.com/v25.0/{page-id}/feed      # texto e links
POST https://graph.facebook.com/v25.0/{page-id}/photos     # imagens
POST https://graph.facebook.com/v25.0/{page-id}/videos     # vídeos

Permissões: pages_manage_posts, pages_read_engagement, pages_show_list
```

Obter Page Access Token (necessário para postar como Page):
```http
GET https://graph.facebook.com/v25.0/me/accounts
# Retorna lista de Pages com access_token individual por página
```

Agendar post no Facebook Pages:
```json
{
  "message": "texto",
  "published": false,
  "scheduled_publish_time": 1736000000
}
```
> Janela: 10 minutos a 30 dias a partir de agora.

#### Meta Marketing API — Rate limits (fórmulas exatas)

| Tipo | Fórmula |
|---|---|
| App-level | `200 × DAU / hora` |
| Ads Insights Standard | `600 + (400 × active_ads) - (0.001 × erros) / hora` |
| Ads Insights Advanced | `190.000 + (400 × active_ads) / hora` |
| Ads Management Standard | `300 + (40 × active_ads) / hora` |
| Ads Management Advanced | `100.000 + (40 × active_ads) / hora` |

Monitorar via response headers: `X-App-Usage`, `X-Business-Use-Case-Usage`
(inclui `estimated_time_to_regain_access`)

Códigos de erro rate limit: `4` (app), `17` (user), `32` (page), `80001` (page BUC), `80004` (ads management)

#### Meta Ads — Campaigns API

```http
GET  https://graph.facebook.com/v25.0/act_{ad_account_id}/campaigns
     ?fields=id,name,status,objective,daily_budget,lifetime_budget,
             budget_remaining,start_time,stop_time,effective_status

POST https://graph.facebook.com/v25.0/act_{ad_account_id}/campaigns
POST https://graph.facebook.com/v25.0/{campaign_id}   # update
```

Campos obrigatórios para criar:
- `name`
- `objective`: `OUTCOME_SALES` | `OUTCOME_TRAFFIC` | `OUTCOME_AWARENESS` | `OUTCOME_ENGAGEMENT` | `OUTCOME_LEADS` | `OUTCOME_APP_PROMOTION`
- `special_ad_categories`: **obrigatório** mesmo vazio `[]`
- `status`: `ACTIVE` | `PAUSED`

> Contas pessoais de anúncio não atingem Advanced Access — obrigatório usar Business Manager.

#### Meta Webhooks

Verificação (hub.challenge):
```http
GET {endpoint}?hub.mode=subscribe&hub.challenge=1234&hub.verify_token={seu-token}
# Responder: HTTP 200 + hub.challenge como plain text
```

Validar payload:
```
X-Hub-Signature-256: sha256={hmac}
# HMAC-SHA256 do raw body usando app secret
```

Campos Instagram: `comments`, `messages`, `story_insights`, `mentions`, `live_comments`

> **Não existe webhook de "post publicado" no Instagram** — usar polling de status do container.
> Meta faz retry por 36 horas. Responder em <5s e processar async.

#### Gotchas Meta (não óbvios)

1. Instagram aceita **JPEG apenas** — PNG retorna erro
2. Vídeos precisam de URL pública acessível (não binary POST direto)
3. TTL do container é 24h — crash do worker = recriar do zero
4. `media_type` é opcional para imagens, obrigatório para VIDEO/REELS/STORIES/CAROUSEL
5. Short-lived tokens expiram em **1 hora**, não 24h
6. Long-lived tokens **não renovam automaticamente** — fazer cron a cada 7 dias
7. `special_ad_categories: []` é obrigatório em campanhas mesmo sem categoria especial
8. Page tokens derivados de User tokens **expiram com o User token** — usar System User
9. Parâmetro `metadata` deprecado na v25.0, descontinuado em 19/05/2026

#### Exemplo de chamada (Deno Edge Function)

```typescript
// Publicar imagem no Instagram
const step1 = await fetch(
  `https://graph.facebook.com/v25.0/${igUserId}/media`,
  {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      image_url: mediaUrl,  // JPEG público
      caption: caption,
      access_token: systemUserToken,
    }),
  }
);
const { id: containerId } = await step1.json();

// Polling status (vídeos)
let status = "IN_PROGRESS";
while (status === "IN_PROGRESS") {
  await new Promise(r => setTimeout(r, 60000));
  const poll = await fetch(
    `https://graph.facebook.com/v25.0/${containerId}?fields=status_code&access_token=${token}`
  );
  const { status_code } = await poll.json();
  status = status_code;
}

// Publicar
const step2 = await fetch(
  `https://graph.facebook.com/v25.0/${igUserId}/media_publish`,
  {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ creation_id: containerId, access_token: token }),
  }
);
```

---

### 1.2 LINKEDIN API

**Versão atual:** `202603` (Março 2026) — **header obrigatório em toda request**

#### OAuth 2.0

```http
GET https://www.linkedin.com/oauth/v2/authorization
    ?response_type=code
    &client_id={CLIENT_ID}
    &redirect_uri={REDIRECT_URI}
    &state={CSRF_TOKEN}
    &scope=r_basicprofile%20w_organization_social%20r_organization_social

# authorization code expira em 30 MINUTOS — trocar imediatamente
```

```http
POST https://www.linkedin.com/oauth/v2/accessToken
Content-Type: application/x-www-form-urlencoded

grant_type=authorization_code&code={CODE}&client_id={ID}
&client_secret={SECRET}&redirect_uri={URI}

Resposta:
  access_token     — validade: 60 dias
  refresh_token    — validade: 365 dias (renovação só com MDP)
```

> Sem MDP aprovado: não é possível renovar programaticamente. Mandar usuário pelo fluxo OAuth novamente (LinkedIn pula consent se não expirou).

#### Scopes necessários

| Scope | Função |
|---|---|
| `w_organization_social` | Postar/comentar/curtir na Company Page |
| `r_organization_social` | Ler posts e engagement da org |
| `rw_organization_admin` | Gerenciar páginas + reporting |
| `w_member_social` | Postar no perfil pessoal |
| `r_ads` | Ler contas de anúncio |
| `rw_ads` | Gerenciar campanhas |
| `r_ads_reporting` | Analytics de anúncios |

#### Headers obrigatórios em TODA request

```http
Authorization: Bearer {ACCESS_TOKEN}
X-Restli-Protocol-Version: 2.0.0
Linkedin-Version: 202603
Content-Type: application/json
```
> **`Linkedin-Version` ausente = erro hard** — não existe fallback de versão.

#### Publicação orgânica — Company Pages

Usar **Posts API** (`/rest/posts`) — UGC Posts API (`/v2/ugcPosts`) está **depreciada**.

**Post de texto:**
```http
POST https://api.linkedin.com/rest/posts

{
  "author": "urn:li:organization:{ORG_ID}",
  "commentary": "Texto do post #hashtag",
  "visibility": "PUBLIC",
  "distribution": {
    "feedDistribution": "MAIN_FEED",
    "targetEntities": [],
    "thirdPartyDistributionChannels": []
  },
  "lifecycleState": "PUBLISHED",
  "isReshareDisabledByAuthor": false
}

Resposta: 201 Created (sem body)
URN do post: header x-restli-id (NÃO no body)
```

**Post com imagem — 3 etapas:**

```http
# Etapa 1 — Registrar upload
POST https://api.linkedin.com/rest/images?action=initializeUpload
{"initializeUploadRequest": {"owner": "urn:li:organization:{ID}"}}

Resposta: {"value": {"uploadUrl": "...", "image": "urn:li:image:{ID}"}}

# Etapa 2 — Fazer upload binário (sem header Authorization!)
PUT {uploadUrl}
Content-Type: image/jpeg
Body: [dados binários da imagem]

# Etapa 3 — Criar post referenciando a imagem
POST /rest/posts
{
  "author": "urn:li:organization:{ORG_ID}",
  "commentary": "texto",
  "visibility": "PUBLIC",
  "distribution": {"feedDistribution": "MAIN_FEED", ...},
  "content": {"media": {"altText": "descrição", "id": "urn:li:image:{ID}"}},
  "lifecycleState": "PUBLISHED"
}
```

Formatos de imagem suportados: JPG, GIF, PNG. Máximo: **36.152.320 pixels** (contagem de pixels, não bytes).

#### LinkedIn — NÃO suporta agendamento nativo
`lifecycleState` aceita apenas `PUBLISHED` ou `DRAFT` (rascunho visível só ao autor). Sem campo `scheduledAt`. Implementar com BullMQ.

#### Listar Company Pages

```http
GET https://api.linkedin.com/rest/organizationAcls
    ?q=roleAssignee&role=ADMINISTRATOR&state=APPROVED

GET https://api.linkedin.com/rest/organizations/{orgId}

GET https://api.linkedin.com/rest/networkSizes/urn:li:organization:{id}
    ?edgeType=COMPANY_FOLLOWED_BY_MEMBER
```

> Não existe "organization token" — usar token do membro com scopes corretos. O campo `author` determina se é post pessoal ou da Company Page.

#### LinkedIn Ads API

```http
POST https://api.linkedin.com/rest/adAccounts/{adAccountId}/adCampaigns
GET  https://api.linkedin.com/rest/adAccounts/{adAccountId}/adCampaigns/{campaignId}
GET  https://api.linkedin.com/rest/adAccounts/{adAccountId}/adCampaigns
     ?q=search&search=(status:(values:List(ACTIVE)))
```

Scopes necessários: `rw_ads` ou `r_ads`

**Analytics de anúncios:**
```http
GET https://api.linkedin.com/rest/adAnalytics
    ?q=analytics&pivot=CREATIVE&timeGranularity=DAILY
    &dateRange=(start:(year:2025,month:1,day:1))
    &campaigns=List(urn%3Ali%3AsponsoredCampaign%3A1234567)
    &fields=impressions,clicks,costInLocalCurrency,externalWebsiteConversions,
            landingPageClicks,likes,shares,dateRange,pivotValues
```

Scope: `r_ads_reporting`. Sempre especificar `fields` — default retorna só `impressions` + `clicks`. Máximo 15.000 elementos por resposta. Dados de vídeo têm delay de 48h.

#### Rate Limits LinkedIn

Development tier: **500 calls/app/dia, 100 calls/membro/dia**. Limite exato não publicado na docs — ver no Developer Portal Analytics. Alerta em 75% (com 1-2h delay). Erro: `429 Too Many Requests`.

#### APIs depreciadas (evitar)

| Depreciada | Substituta atual |
|---|---|
| `/v2/ugcPosts` | `/rest/posts` |
| `/v2/assets` | `/rest/images` |
| `/v2/shares` | `/rest/posts` |
| URN `organizationBrand` | URN `organization` |

#### Gotchas LinkedIn (não óbvios)

1. URN do post criado está no **header `x-restli-id`**, não no body da resposta (body é vazio no 201)
2. URNs em parâmetros de URL devem ser URL-encoded: `urn:li:organization:123` → `urn%3Ali%3Aorganization%3A123`
3. Usar URN `organization` (não `company`) — `company` deprecado desde Jan/2024
4. Após `initializeUpload` de imagem: aguardar 1-2s antes de criar o post (imagem pode não estar `AVAILABLE` ainda)
5. `feedDistribution: "NONE"` cria dark post (não aparece na Company Page) — usar `MAIN_FEED` para orgânico
6. BATCH_GET desabilitado no tier Development — requer Standard tier para batch operations
7. Violação de política de conteúdo retorna `422 UNPROCESSABLE_ENTITY` sem motivo detalhado
8. Authorization code expira em **30 minutos** — trocar antes de redirecionar o usuário de volta
9. **`refresh_token_expires_in` inconsistente nas docs** — o campo retorna `525600` que pode ser segundos (~6 dias) ou minutos (365 dias). Comportamento real: access_token = 60 dias, refresh_token = 365 dias. **Sempre salvar o timestamp absoluto** calculado como `now() + expires_in` — nunca confiar no valor bruto
10. Posts API retorna URN em dois formatos possíveis: `urn:li:share:{id}` OU `urn:li:ugcPost:{id}` — tratar ambos
11. `r_member_social` (ler posts do membro) é permissão restrita — requer aprovação separada além da Community Management API
12. Limite Development tier: **500 calls/app/dia, 100 calls/membro/dia** — suficiente para ~250 posts/dia

#### Exemplos completos Deno/Edge Functions

**Publicar imagem na Company Page (Deno):**
```typescript
const LINKEDIN_BASE = "https://api.linkedin.com/rest";
const LINKEDIN_VERSION = "202603";

// Etapa 1: upload da imagem
async function uploadImage(accessToken: string, orgId: string, imageBuffer: Uint8Array, mimeType: string) {
  const init = await fetch(`${LINKEDIN_BASE}/images?action=initializeUpload`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${accessToken}`,
      "X-Restli-Protocol-Version": "2.0.0",
      "Linkedin-Version": LINKEDIN_VERSION,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ initializeUploadRequest: { owner: `urn:li:organization:${orgId}` } }),
  });
  const { value } = await init.json();

  // PUT binário — SEM header Authorization
  await fetch(value.uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": mimeType },
    body: imageBuffer,
  });

  await new Promise(r => setTimeout(r, 1500)); // aguardar AVAILABLE
  return value.image; // ex: "urn:li:image:C4E10AQFo..."
}

// Etapa 2: criar post
async function publishPost(accessToken: string, orgId: string, caption: string, imageUrn?: string) {
  const body: Record<string, unknown> = {
    author: `urn:li:organization:${orgId}`,
    commentary: caption,
    visibility: "PUBLIC",
    distribution: { feedDistribution: "MAIN_FEED", targetEntities: [], thirdPartyDistributionChannels: [] },
    lifecycleState: "PUBLISHED",
    isReshareDisabledByAuthor: false,
  };
  if (imageUrn) body.content = { media: { altText: "imagem", id: imageUrn } };

  const res = await fetch(`${LINKEDIN_BASE}/posts`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${accessToken}`,
      "X-Restli-Protocol-Version": "2.0.0",
      "Linkedin-Version": LINKEDIN_VERSION,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) throw new Error(`LinkedIn ${res.status}: ${await res.text()}`);
  return res.headers.get("x-restli-id"); // URN do post — no HEADER, não no body
}
```

#### Exemplo de chamada (Deno Edge Function)

```typescript
const LINKEDIN_BASE = "https://api.linkedin.com/rest";
const LINKEDIN_VERSION = "202603";

const headers = {
  "Authorization": `Bearer ${accessToken}`,
  "X-Restli-Protocol-Version": "2.0.0",
  "Linkedin-Version": LINKEDIN_VERSION,
  "Content-Type": "application/json",
};

// Postar na Company Page
const res = await fetch(`${LINKEDIN_BASE}/posts`, {
  method: "POST",
  headers,
  body: JSON.stringify({
    author: `urn:li:organization:${orgId}`,
    commentary: caption,
    visibility: "PUBLIC",
    distribution: { feedDistribution: "MAIN_FEED", targetEntities: [], thirdPartyDistributionChannels: [] },
    lifecycleState: "PUBLISHED",
    isReshareDisabledByAuthor: false,
  }),
});

// URN está no HEADER, não no body
const postUrn = res.headers.get("x-restli-id");
```

---

### 1.3 GOOGLE ADS API

**Versão atual:** v23 | REST disponível para Deno

#### OAuth 2.0

```http
GET https://accounts.google.com/o/oauth2/v2/auth
    ?client_id={CLIENT_ID}
    &scope=https://www.googleapis.com/auth/adwords
    &access_type=offline
    &response_type=code
    &redirect_uri={REDIRECT_URI}
    &state={CSRF_TOKEN}
```
> `access_type=offline` **obrigatório** para receber refresh token.

```http
POST https://oauth2.googleapis.com/token
Content-Type: application/x-www-form-urlencoded

grant_type=authorization_code&code={CODE}&client_id={ID}
&client_secret={SECRET}&redirect_uri={URI}
```

Refresh tokens do Google são **long-lived** — não expiram a menos que sejam revogados (inatividade prolongada ou revogação manual).

**Para multi-tenant SaaS:** OAuth2 por usuário (cada cliente autoriza sua conta). Service Account: sem interação do usuário, usado para operações cross-account no MCC. Até 20 contas de anúncio por service account email — para mais, vincular ao MCC.

#### Developer Token

- **Um por empresa** — reutilizar em todos os clientes.
- Test accounts funcionam **antes** da aprovação em produção.
- Tiers: Explorer (test) → Basic Access → **Standard Access** (obrigatório para SaaS em produção).
- Múltiplos clientes podem usar o mesmo developer token.

#### Listar campanhas com métricas (GAQL)

Google Ads usa GAQL (Google Ads Query Language) — parecido com SQL:

```sql
SELECT
  campaign.id,
  campaign.name,
  campaign.status,
  campaign.advertising_channel_type,
  campaign_budget.amount_micros,
  campaign.start_date,
  campaign.end_date,
  metrics.impressions,
  metrics.clicks,
  metrics.cost_micros,
  metrics.conversions,
  metrics.ctr
FROM campaign
WHERE campaign.status = 'ENABLED'
  AND segments.date DURING LAST_30_DAYS
ORDER BY metrics.impressions DESC
```

Filtros de data:
```sql
WHERE segments.date DURING LAST_30_DAYS
WHERE segments.date DURING THIS_MONTH
WHERE segments.date >= '2025-01-01' AND segments.date <= '2025-12-31'
```

> **CRÍTICO:** `cost_micros` = custo em microunidades. **Dividir por 1.000.000** para obter o valor real.

#### Endpoint REST (Deno-compatível)

```http
POST https://googleads.googleapis.com/v23/customers/{customer_id}/googleAds:search

Headers:
  Authorization: Bearer {access_token}
  developer-token: {developer_token}
  login-customer-id: {mcc_id}        # obrigatório para acessar via MCC
  Content-Type: application/json

Body:
{
  "query": "SELECT campaign.id, campaign.name, metrics.impressions FROM campaign WHERE segments.date DURING LAST_30_DAYS"
}
```

#### Listar contas filhas do MCC

```sql
SELECT customer_client.client_customer, customer_client.level, customer_client.manager
FROM customer_client
WHERE customer_client.level = 1
```
Executar com `login-customer-id` = ID do MCC.

#### Rate Limits Google Ads

Token Bucket por CID (customer ID) + developer token. Limites não são publicados como números fixos — variam com carga do servidor. Erro: `RESOURCE_TEMPORARILY_EXHAUSTED`.

Boas práticas:
- Batching: múltiplas operações em uma chamada
- Limite de tarefas paralelas com semáforo
- BullMQ para distribuir carga

#### Exemplo de chamada (Deno Edge Function)

```typescript
const GOOGLE_ADS_BASE = "https://googleads.googleapis.com/v23";

const res = await fetch(
  `${GOOGLE_ADS_BASE}/customers/${customerId}/googleAds:search`,
  {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${accessToken}`,
      "developer-token": Deno.env.get("GOOGLE_ADS_DEVELOPER_TOKEN")!,
      "login-customer-id": mccId,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query: `
        SELECT campaign.id, campaign.name, campaign.status,
               metrics.impressions, metrics.clicks, metrics.cost_micros
        FROM campaign
        WHERE segments.date DURING LAST_30_DAYS
      `,
    }),
  }
);

const { results } = await res.json();
const campaigns = results.map((r: any) => ({
  id: r.campaign.id,
  name: r.campaign.name,
  status: r.campaign.status,
  impressions: r.metrics.impressions,
  clicks: r.metrics.clicks,
  cost: r.metrics.costMicros / 1_000_000,  // converter micros!
}));
```

---

### 1.4 TIKTOK API

**Versão atual:** v2 | **Avaliação: API mais imatura do grupo — prioridade última**

#### Developer Setup

1. Criar conta dev em `developers.tiktok.com`
2. Criar app no portal + completar App Review
3. Sandbox disponível para testes (posts privados)
4. **Apps não auditados: todos os posts ficam privados** — produção requer conclusão do app audit
5. Timeline de aprovação: variável (sem prazo publicado pela TikTok)

#### OAuth 2.0

```http
GET https://www.tiktok.com/v2/auth/authorize/
    ?client_key={CLIENT_KEY}
    &scope={SCOPES}
    &redirect_uri={REDIRECT_URI}
    &state={CSRF_TOKEN}
    &response_type=code
```

- Redirect URIs: HTTPS, max 10, sem parâmetros, máx 512 chars
- Scopes disponíveis: `user.info.basic`, `video.upload`
- Upload URLs expiram em **1 hora**

#### Publicação — Content Posting API (fluxo 3 etapas)

```http
# Etapa 1 — Consultar dados do criador
GET https://open.tiktokapis.com/v2/post/publish/creator_info/query/

# Etapa 2 — Inicializar publicação
POST https://open.tiktokapis.com/v2/post/publish/video/init/
{
  "post_info": {
    "title": "caption aqui",
    "privacy_level": "PUBLIC_TO_EVERYONE",
    "disable_duet": false,
    "disable_comment": false,
    "disable_stitch": false
  },
  "source_info": {
    "source": "FILE_UPLOAD",
    "video_size": 12345678,
    "chunk_size": 10000000,
    "total_chunk_count": 2
  }
}

# Etapa 3 — Upload chunked para a URL recebida
```

- Rate limit: **6 requests/minuto por access token**
- Posts em apps não auditados: **privados forçados**

#### Especificações de vídeo (2026)

- Resolução recomendada: 1080×1920
- Bitrate: 8-12 Mbps
- Upload via protocolo chunked (não single POST)
- Caption: máx 2.200 caracteres (UTF-16 runes)

#### Avaliação honesta do TikTok API

| Aspecto | Avaliação |
|---|---|
| Maturidade da API | ⭐⭐ (baixa — fragmentada, documentação desatualizada) |
| Prazo de aprovação | Imprevisível |
| Posts públicos sem auditoria | ❌ Impossível |
| Estabilidade | Mudanças frequentes sem aviso |
| Documentação | Incompleta e inconsistente |
| SDK maduro para Node/Deno | ❌ Não existe |

**Recomendação:** Implementar TikTok apenas após Meta + LinkedIn estarem estáveis e o app TikTok completar o audit. Para clientes que precisam de TikTok com urgência, avaliar Ayrshare ($299-599/mês) como alternativa gerenciada apenas para essa plataforma.

---

## PARTE 2 — CORREÇÕES NECESSÁRIAS ANTES DA INTEGRAÇÃO

### 🔴 CRÍTICOS (6 itens — bloqueiam toda integração)

| ID | Descrição | Arquivo | Esforço |
|---|---|---|---|
| **SEC-001** | `ads-select-account` sem autenticação JWT — qualquer usuário pode alterar conexão de outra organização (IDOR) | `supabase/functions/ads-select-account/index.ts` | 2h |
| **SEC-002** | Tokens OAuth em plaintext no banco — comprometer DB = comprometer todas as contas de anúncio | Migration + funções OAuth | 4h |
| **SEC-003** | `ads-oauth-callback` — parâmetro `origin` controlável pelo atacante → open redirect pós-OAuth | `supabase/functions/ads-oauth-callback/index.ts:39` | 1h |
| **SEC-004** | `react-router-dom` com XSS via open redirects (GHSA-2w69-qvjg-hvjx) — afeta callbacks OAuth | `package.json` | 30min |
| **CFG-001** | `ads-select-account` e `ads-get-config` ausentes do `config.toml` — comportamento de auth indefinido | `supabase/config.toml` | 30min |
| **BUG-001** | Conexão com `account_id = "__pending__"` aparece na UI e nas sincronizações de métricas | `useAdPlatforms.ts:53` + `ads-sync-metrics/index.ts:70` | 2h |

### 🟠 ALTOS (corrigir em paralelo na Semana 2)

| ID | Descrição | Esforço |
|---|---|---|
| **SEC-005** | Meta tokens sem verificação de expiração no sync (Google tem, Meta não) | 1h |
| **SEC-006** | 9 dependências npm HIGH: glob, lodash, minimatch, picomatch, rollup | 1h |
| **BUG-002** | RLS de `ad_platform_connections` não filtra por status — pending/disconnected acessíveis | 1h |
| **BUG-003** | OAuth callback loga JSON completo de contas do usuário (PII em logs) | 30min |
| **TS-001** | 509 `@ts-nocheck` — começar pelos 15 arquivos críticos de OAuth/auth | 8h |

### 🟡 MÉDIOS (Semana 3-4)

| ID | Descrição | Esforço |
|---|---|---|
| **SEC-007** | Funções com `verify_jwt=false` sem validação manual documentada | 3h |
| **TS-002** | 156 `: any` nos hooks principais | 6h |

---

## PARTE 3 — PLANO DE IMPLEMENTAÇÃO

### FASE 0 — Correções Críticas `(Semana 1, Dias 1-3)`

```
Dia 1 — Segurança básica:
  [SEC-004] npm audit fix — react-router, lodash, rollup, glob
  [CFG-001] config.toml: ads-select-account (verify_jwt=true) + ads-get-config (verify_jwt=false)
  [SEC-001] ads-select-account: adicionar auth.getUser() + verificar is_member_of_org(uid, org_id)
  [SEC-003] ads-oauth-callback: whitelist de origins em array estático

Dia 2 — Bug de pending e logs:
  [BUG-001] ads-oauth-callback: mover contas pendentes para coluna pending_accounts (JSONB) + pending_created_at
  [BUG-001] ads-sync-metrics: filtrar WHERE account_id != '__pending__' + check token_expires_at Meta
  [BUG-001] useAdPlatforms.ts: filtrar .in('status', ['active', 'expired'])
  [BUG-003] ads-oauth-callback: substituir JSON.stringify de dados por contagens numéricas nos logs

Dia 3 — RLS + início de criptografia:
  [BUG-002] Migration RLS: ad_platform_connections WITH CHECK (status IN ('active', 'expired'))
  [SEC-002] Migration: extensão pgcrypto + coluna access_token_encrypted
             (migrar gradualmente — manter plaintext até toda stack atualizada)
```

### FASE 1 — Base de Dados `(Semana 1, Dias 4-5)`

**4 novas migrations:**

```sql
-- 1. social_accounts: contas OAuth por plataforma
CREATE TABLE public.social_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  platform text NOT NULL CHECK (platform IN ('instagram','facebook','linkedin','tiktok')),
  account_id text NOT NULL,
  account_name text,
  account_username text,
  access_token text NOT NULL,
  refresh_token text,
  token_expires_at timestamptz,
  scopes text[] DEFAULT '{}',
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','expired','disconnected')),
  metadata jsonb DEFAULT '{}',  -- profile_picture_url, follower_count, page_id, etc
  last_synced_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(organization_id, platform, account_id)
);
-- RLS: SELECT/UPDATE para is_member_of_org(auth.uid(), organization_id)

-- 2. social_posts: posts publicados e agendados
CREATE TABLE public.social_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  client_post_id uuid REFERENCES client_posts(id) ON DELETE SET NULL,
  social_account_id uuid NOT NULL REFERENCES social_accounts(id) ON DELETE CASCADE,
  platform text NOT NULL,
  platform_post_id text,           -- ID real da plataforma após publicação
  caption text,
  hashtags text[] DEFAULT '{}',
  scheduled_at timestamptz,
  published_at timestamptz,
  status text NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft','scheduled','published','failed','archived')),
  error_message text,
  media_urls text[] DEFAULT '{}',
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
-- INDEX: (organization_id, scheduled_at) WHERE status = 'scheduled'

-- 3. social_engagement_metrics: métricas por post/dia
CREATE TABLE public.social_engagement_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  social_post_id uuid NOT NULL REFERENCES social_posts(id) ON DELETE CASCADE,
  platform text NOT NULL,
  likes bigint DEFAULT 0,
  comments bigint DEFAULT 0,
  shares bigint DEFAULT 0,
  saves bigint DEFAULT 0,
  reach bigint DEFAULT 0,
  impressions bigint DEFAULT 0,
  engagement_rate numeric(5,2) DEFAULT 0,
  date date NOT NULL,
  synced_at timestamptz DEFAULT now(),
  UNIQUE(social_post_id, date)
);

-- 4. social_posting_queue: fila com retry
CREATE TABLE public.social_posting_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  social_post_id uuid NOT NULL REFERENCES social_posts(id) ON DELETE CASCADE,
  platform text NOT NULL,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','processing','success','failed','cancelled')),
  scheduled_for timestamptz NOT NULL,
  attempted_at timestamptz,
  completed_at timestamptz,
  error_details jsonb,
  retry_count int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);
-- INDEX: (organization_id, scheduled_for) WHERE status != 'success'

-- Extensões em tabelas existentes
ALTER TABLE client_posts
  ADD COLUMN IF NOT EXISTS platforms text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS is_published boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS published_platforms text[] DEFAULT '{}';

ALTER TABLE ad_platform_connections
  ADD COLUMN IF NOT EXISTS pending_accounts jsonb,
  ADD COLUMN IF NOT EXISTS pending_created_at timestamptz;
```

### FASE 2 — OAuth + Conexão de Contas `(Semana 2)`

**Novas edge functions** (copiar estrutura de `ads-oauth-callback` existente):

```
social-oauth-meta      → redirect para Facebook Login (cobre Instagram + Facebook Pages)
social-oauth-linkedin  → redirect para LinkedIn OAuth v2
social-oauth-tiktok    → redirect TikTok (após aprovação sandbox)
social-oauth-callback  → handler universal — salva em social_accounts
social-token-refresh   → refresh proativo via pg_cron
```

**config.toml additions:**
```toml
[functions.social-oauth-meta]
  verify_jwt = false  # OAuth callback não carrega JWT

[functions.social-oauth-linkedin]
  verify_jwt = false

[functions.social-oauth-callback]
  verify_jwt = false  # callback externo das plataformas

[functions.social-token-refresh]
  verify_jwt = false  # chamado por pg_cron
```

**Nova página:** `/cliente/contas-sociais`
- Cards por plataforma: Instagram, Facebook, LinkedIn, TikTok
- Status: ativo / expirado / desconectado / não conectado
- Dados: nome da conta, seguidores, último sync
- Ações: Conectar (→ OAuth) / Desconectar (revoga token)

**Novo hook:** `src/hooks/useSocialAccounts.ts`
```typescript
useSocialAccounts()          // lista contas da org
useConnectAccount(platform)  // redirect OAuth
useDisconnectAccount(id)     // desconectar + revogar
```

### FASE 3 — Publicação Real `(Semana 3)`

**Novas edge functions:**
```
social-publish-post    → publica em Meta Graph API + LinkedIn Posts API
social-publish-cron    → verifica social_posting_queue a cada 5min
```

**Lógica por plataforma:**
```
Instagram:  POST /media (container) → polling status → POST /media_publish
Facebook:   POST /{page-id}/photos ou /feed (com page access token)
LinkedIn:   initializeUpload → PUT binário → POST /rest/posts (URN no header)
TikTok:     creator_info → init → chunked upload (fase 6+)
```

**Rate limiting e retry:**
```
Instagram:  200 req/hora → exponential backoff, 3 tentativas
LinkedIn:   450 req/dia  → espaçamento de 200ms entre chamadas
Google:     Token bucket → BullMQ com concurrency limitada
```

**Extensão de `/cliente/redes-sociais` — novas abas:**

| Aba | O que faz |
|---|---|
| "Conteúdo" (existente) | Geração de arte/vídeo — sem mudança |
| "Agendar" (nova) | Post gerado + selecionar plataformas + data/hora + caption específico por plataforma |
| "Agendados" (nova) | Posts esperando publicação — editar / cancelar / publicar agora |
| "Publicado" (nova) | Timeline de posts publicados com engagement básico |

**Novos hooks:**
- `src/hooks/useSocialPosts.ts` — schedule, publish, cancel
- `src/components/cliente/social/PostScheduleDialog.tsx` — datetime picker + multi-select plataforma

### FASE 4 — Google Ads Upgrade `(Semana 4)`

O sistema já tem Google Ads. Melhorias:
- Substituir chamadas por REST API v23 com GAQL
- `ads-sync-metrics`: expandir para estrutura de campanhas reais (não só métricas)
- Nova aba "Campanhas" em `/cliente/trafego-pago` com dados reais
- Lembrar: `cost_micros` ÷ 1.000.000 = custo real

### FASE 5 — Engagement Metrics `(Semana 5)`

- `social-sync-engagement` — coleta likes/comments/reach/impressões (cron diário às 00h BRT)
- Instagram Insights API: `GET /{media-id}/insights?metric=impressions,reach,likes,comments,shares,saved`
- LinkedIn Organic Analytics: `GET /rest/organizationalEntityShareStatistics`
- Dashboard comparativo cross-platform
- Novo hook: `src/hooks/useSocialEngagement.ts`

### FASE 6 — TikTok + LinkedIn Ads + Polish `(Semana 6+)`

- TikTok: aguardar aprovação do app audit
- LinkedIn Ads: aguardar aprovação MDP
- Dashboard analytics avançado
- Exportação de relatórios

---

## PARTE 4 — ORDEM DEFINITIVA DE IMPLANTAÇÃO

```
SEMANA 1
  Dias 1-3: FASE 0 — 6 correções críticas (SEC-001 ao BUG-001)
  Dias 4-5: FASE 1 — 4 migrations SQL

  Rafael (em paralelo):
    → Meta: criar App + System User Token (15min)
    → Google: ativar Google Ads API + criar OAuth Client (10min)
    → Google: solicitar Developer Token no Google Ads (5min)
    → LinkedIn: criar app + solicitar "Share on LinkedIn" product (10min)
    → Criar página privacidade: noexcuse.com.br/privacidade (10min)

SEMANA 2
  Dias 1-3: FASE 2 — OAuth Meta + LinkedIn + callback universal
  Dias 4-5: Página /cliente/contas-sociais + useSocialAccounts hook
  Fix paralelo: SEC-005, SEC-006, BUG-002, BUG-003

SEMANA 3
  Dias 1-3: FASE 3 — social-publish-post (Meta + LinkedIn)
  Dias 4-5: Abas Agendar / Agendados / Publicado em redes-sociais
  Fix paralelo: TS-001 (15 arquivos OAuth/auth)

SEMANA 4
  Dias 1-3: FASE 4 — Google Ads REST v23 upgrade
  Dias 4-5: social-publish-cron + social_posting_queue consumer
  Fix paralelo: SEC-007, TS-002

SEMANA 5
  FASE 5 — social-sync-engagement + dashboard
  Testes E2E da stack OAuth completa

SEMANA 6+
  TikTok (após audit) + LinkedIn Ads (após MDP) + analytics avançado
```

---

## PARTE 5 — REUTILIZAÇÃO DE CÓDIGO EXISTENTE

| Código existente | Serve como modelo para |
|---|---|
| `ads-oauth-callback/index.ts` | `social-oauth-callback/index.ts` (mesma estrutura) |
| `ads-sync-metrics/index.ts` | `social-sync-engagement/index.ts` |
| `useAdPlatforms.ts` | `useSocialAccounts.ts` (mesmo padrão React Query) |
| Schema de `ad_platform_connections` | Schema de `social_accounts` (campos idênticos) |
| WhatsApp setup wizard pattern | Wizard de conexão de conta social |
| `organization_integrations` table | Integrar via FK com `social_accounts` |

---

## PARTE 6 — CHECKLIST POR PLATAFORMA

### Meta (Instagram + Facebook)
- [ ] App criado em developers.facebook.com (tipo: Business)
- [ ] Marketing API adicionada ao app
- [ ] Instagram Graph API adicionada ao app
- [ ] System User criado no Business Manager > Usuários do Sistema
- [ ] Token permanente gerado (scopes: instagram_basic, instagram_content_publish, pages_manage_posts, ads_management, ads_read)
- [ ] Instagram Business account vinculada à Facebook Page
- [ ] URL de política de privacidade criada (exigência da Meta)
- [ ] SEC-001 e SEC-003 corrigidos antes de usar o token em produção

### Google Ads
- [ ] Google Ads API ativada no projeto Google Cloud existente
- [ ] OAuth 2.0 Client criado (Web App) com redirect URLs corretas
- [ ] Developer Token solicitado (Centro de API no Google Ads Manager)
- [ ] MCC Manager Account criada (se ainda não existe)
- [ ] `login-customer-id` header configurado nas edge functions

### LinkedIn
- [ ] App criado em linkedin.com/developers
- [ ] Company Page vinculada e verificada no app
- [ ] Produto "Share on LinkedIn" solicitado
- [ ] Redirect URIs configuradas no OAuth
- [ ] Scopes: w_organization_social, r_organization_social, rw_organization_admin
- [ ] Header `Linkedin-Version: 202603` em todas as chamadas
- [ ] URN `organization` (não `company`) em todos os requests

### TikTok (Fase 6)
- [ ] Developer account criado em developers.tiktok.com
- [ ] App criado + sandbox configurado
- [ ] App Review submetido para produção
- [ ] Scope video.upload aprovado
- [ ] Rate limiting: máx 6 req/min por token

---

*Documento gerado em 2026-04-08 com análise profunda das documentações oficiais de Meta v25.0, LinkedIn 202603, Google Ads v23 e TikTok v2.*
*Atualizar ao completar cada fase.*

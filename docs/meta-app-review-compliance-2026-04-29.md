# Meta App Review — Compliance NOE (2026-04-29)

Checklist completo para submissão de App Review da Meta para o app **NoExcuse Digital**, cobrindo publicação no Facebook/Instagram, leitura de Insights, leitura de campanhas Meta Ads e recebimento de leads via Meta Lead Ads.

## 1. Permissões solicitadas

### 1a. Fluxo Redes Sociais (publicação Facebook/Instagram + Insights orgânicos)

| Permissão | Uso na plataforma |
|-----------|-------------------|
| `pages_show_list` | Listar Páginas do Facebook administradas pelo usuário durante o OAuth para escolha da conta a conectar. |
| `pages_read_engagement` | Ler métricas básicas de engajamento dos posts publicados pela plataforma. |
| `pages_manage_posts` | Publicar conteúdo aprovado pelo usuário no feed da Página. |
| `instagram_basic` | Identificar conta profissional do Instagram vinculada à Página e exibir nome/perfil. |
| `instagram_content_publish` | Publicar imagem + caption no Instagram após aprovação do usuário. |
| `instagram_manage_insights` | Ler alcance, impressões e engajamento de posts publicados pelo Instagram. |

### 1b. Fluxo Meta Ads (leitura de campanhas e métricas pagas)

| Permissão | Uso na plataforma |
|-----------|-------------------|
| `ads_read` | Ler estrutura de campanhas/conjuntos/anúncios e métricas (impressões, cliques, gasto, conversões, CTR, CPC, CPL) das contas autorizadas pelo usuário. |
| `pages_show_list` | Listar Páginas administradas para vincular a conta de anúncios à Página correta. |
| `pages_read_engagement` | Ler métricas de engajamento das publicações usadas como anúncios. |

> **Não solicitamos `ads_management`** — a plataforma apenas lê dados de Ads para relatórios e não cria, edita ou pausa campanhas em nome do usuário. Toda gestão de campanha é feita pelo usuário diretamente no Gerenciador de Anúncios da Meta.

> **Não solicitamos `business_management`** — não acessamos nem modificamos ativos do Business Manager.

### 1c. Fluxo Meta Lead Ads (recebimento de leads de formulários)

| Permissão | Uso na plataforma |
|-----------|-------------------|
| `leads_retrieval` | Recuperar leads enviados via formulários Lead Ads vinculados às Páginas autorizadas pelo usuário. |
| `pages_manage_ads` | Permitir que a Plataforma se inscreva como app autorizado a receber webhooks `leadgen` da Página. |
| `pages_manage_metadata` | Assinar/desassinar a Página ao webhook `leadgen` do app NoExcuse Digital. |
| `pages_show_list` | Listar Páginas administradas para o usuário escolher quais conectar. |

## 2. URLs oficiais de referência

- Política de Privacidade: https://sistema.noexcusedigital.com.br/privacidade
- Termos de Uso: https://sistema.noexcusedigital.com.br/termos
- Callback de Exclusão de Dados (Meta): https://gxrhdpbbxfipeopdyygn.supabase.co/functions/v1/meta-data-deletion
- Página de Confirmação de Exclusão: https://sistema.noexcusedigital.com.br/privacidade?deletion_confirmed=CODIGO
- OAuth Start (Redes Sociais + Lead Ads): https://gxrhdpbbxfipeopdyygn.supabase.co/functions/v1/social-oauth-meta
- OAuth Callback (Redes Sociais + Lead Ads): https://gxrhdpbbxfipeopdyygn.supabase.co/functions/v1/social-oauth-callback
- OAuth Start (Meta Ads — leitura): https://gxrhdpbbxfipeopdyygn.supabase.co/functions/v1/ads-oauth-start
- OAuth Callback (Meta Ads — leitura): https://gxrhdpbbxfipeopdyygn.supabase.co/functions/v1/ads-oauth-callback
- Webhook Meta Lead Ads (leadgen): https://gxrhdpbbxfipeopdyygn.supabase.co/functions/v1/meta-leadgen-webhook

## 3. Documentação Meta de referência

- Permissions Reference: https://developers.facebook.com/docs/permissions/reference
- Instagram Content Publishing: https://developers.facebook.com/docs/instagram-api/guides/content-publishing
- Pages API: https://developers.facebook.com/docs/pages-api
- Marketing API — Authorization: https://developers.facebook.com/docs/marketing-api/overview/authorization
- Marketing API — Insights: https://developers.facebook.com/docs/marketing-api/insights
- Lead Ads Retrieval (Webhooks `leadgen`): https://developers.facebook.com/docs/marketing-api/guides/lead-ads/retrieving
- Data Deletion Callback: https://developers.facebook.com/docs/development/create-an-app/app-dashboard/data-deletion-callback
- App Review: https://developers.facebook.com/docs/app-review

## 4. Gravações necessárias (screencasts)

Cada gravação deve mostrar login real na plataforma, ação completa e resultado visível.

1. **OAuth de conexão (Redes Sociais)**
   - Login do cliente → Redes Sociais → Conectar Meta
   - Tela de consentimento Meta com as permissões base listadas
   - Retorno à plataforma, conta listada como conectada
2. **Publicar Facebook (`pages_manage_posts`)**
   - Criar conteúdo, aprovar, escolher conta Facebook, publicar
   - Mostrar post visível na Página do Facebook
3. **Publicar Instagram (`instagram_content_publish`)**
   - Criar conteúdo com imagem, aprovar, escolher Instagram Business, publicar
   - Mostrar post visível no perfil do Instagram
4. **Insights orgânicos (`pages_read_engagement` + `instagram_manage_insights`)**
   - Acessar tela de relatórios sociais
   - Mostrar métricas (alcance, impressões, engajamento) das publicações conectadas
5. **Revogação / Exclusão**
   - Desconectar a conta em Redes Sociais > Contas
   - Demonstrar callback de Data Deletion (URL com `deletion_confirmed=<codigo>` exibindo o box de confirmação na Política de Privacidade)
6. **Meta Lead Ads (`leads_retrieval`, `pages_manage_ads`, `pages_manage_metadata`)**
   - Login → CRM > Integrações > Meta Lead Ads → Conectar Meta
   - Tela de consentimento Meta mostrando as permissões adicionais de Lead Ads
   - Selecionar Página, assinar formulário, enviar lead de teste pelo Lead Ads Testing Tool
   - Mostrar lead chegando no CRM da plataforma
7. **Meta Ads — leitura (`ads_read`)**
   - Login → Anúncios → Conectar Meta Ads
   - Tela de consentimento Meta mostrando apenas permissões de leitura
   - Sincronizar métricas e mostrar dashboard com campanhas, gasto, CTR, CPC, CPL provenientes da Marketing API

## 5. Conformidade com Política de Plataforma Meta

- Não vendemos dados recebidos da Meta.
- Não usamos dados para publicidade de terceiros.
- Não publicamos sem ação/aprovação explícita do usuário.
- Não criamos, editamos ou pausamos campanhas pagas — apenas leitura via `ads_read`.
- Tokens armazenados apenas no backend (Supabase) com Service Role.
- Revogação acessível ao usuário a qualquer momento em Redes Sociais > Contas, CRM > Integrações > Meta Lead Ads e nas Ferramentas de Negócios Meta.
- Política de Privacidade documenta integração, permissões, uso, armazenamento e revogação para todos os fluxos Meta.

## 6. Checklist técnico final (princípio do menor privilégio)

- [x] `social-oauth-meta` solicita as 6 permissões base; adiciona `leads_retrieval`, `pages_manage_ads`, `pages_manage_metadata` somente quando `redirect_to=crm-leads`.
- [x] `social-oauth-callback` armazena escopos efetivos (com ou sem Lead Ads) na coluna `scopes` de `social_accounts`.
- [x] `ads-oauth-start` solicita exatamente `ads_read,leads_retrieval,pages_show_list,pages_read_engagement,pages_manage_ads,pages_manage_metadata` — sem `ads_management` e sem `business_management`.
- [x] `useAdPlatforms.getOAuthUrl("meta_ads", …)` solicita o mesmo conjunto de leitura, sem `ads_management`.
- [x] `use-ads-connections.useInitiateMetaOAuth` solicita o mesmo conjunto de leitura, sem `ads_management`.
- [x] `social-publish` (não `social-post`) executa publicação manual.
- [x] `social-publish-post` / worker agendado usam `_shared/socialPublish.ts`.
- [x] `meta-data-deletion` valida HMAC, desconecta apenas contas correspondentes e registra em `meta_data_deletion_requests`.
- [x] `meta-leadgen-pages` e `meta-leadgen-subscribe` retornam mensagem de erro orientando reconectar em CRM > Integrações > Meta Lead Ads autorizando `leads_retrieval`, `pages_manage_ads` e `pages_manage_metadata`.
- [x] `/privacidade` documenta os três fluxos Meta (Redes Sociais, Ads, Lead Ads), permissões e revogação.
- [x] `/privacidade?deletion_confirmed=…` exibe box de confirmação.
- [x] Insights consumidos a partir de `social_engagement_metrics` (não de função `social-get-insights`).

## 7. Risco conhecido — vídeo do reviewer Meta Ads

A Meta normalmente espera ver no screencast de `ads_read` uma tela em que o usuário interage com campanhas. Como a plataforma é estritamente **leitora** (não pedimos `ads_management`), a gravação 7 deve deixar **explícito**:

> "Esta plataforma não cria, edita nem pausa campanhas. Toda gestão é feita pelo usuário no Gerenciador de Anúncios da Meta. A integração serve exclusivamente para consolidar relatórios de performance dentro do CRM do cliente."

Caso o reviewer rejeite por entender que a leitura sem `ads_management` é insuficiente, manter postura de menor privilégio: a plataforma **não precisa** de `ads_management` e a recusa em pedir essa permissão é parte do compromisso de privacidade documentado nesta política.

# Meta App Review — Compliance NOE (2026-04-29)

Checklist completo para submissão de App Review da Meta para o app **NoExcuse Digital** (publicação Facebook/Instagram + Insights).

## 1. Permissões solicitadas

| Permissão | Uso na plataforma |
|-----------|-------------------|
| `pages_show_list` | Listar Páginas do Facebook administradas pelo usuário durante o OAuth para escolha da conta a conectar. |
| `pages_manage_posts` | Publicar conteúdo aprovado pelo usuário no feed da Página. |
| `pages_read_engagement` | Ler métricas básicas de engajamento dos posts publicados pela plataforma. |
| `instagram_basic` | Identificar conta profissional do Instagram vinculada à Página e exibir nome/perfil. |
| `instagram_content_publish` | Publicar imagem + caption no Instagram após aprovação do usuário. |
| `instagram_manage_insights` | Ler alcance, impressões e engajamento de posts publicados pelo Instagram. |

## 2. URLs oficiais de referência

- Política de Privacidade: https://sistema.noexcusedigital.com.br/privacidade
- Termos de Uso: https://sistema.noexcusedigital.com.br/termos
- Callback de Exclusão de Dados (Meta): https://gxrhdpbbxfipeopdyygn.supabase.co/functions/v1/meta-data-deletion
- Página de Confirmação de Exclusão: https://sistema.noexcusedigital.com.br/privacidade?deletion_confirmed=CODIGO
- OAuth Start: https://gxrhdpbbxfipeopdyygn.supabase.co/functions/v1/social-oauth-meta
- OAuth Callback: https://gxrhdpbbxfipeopdyygn.supabase.co/functions/v1/social-oauth-callback

## 3. Documentação Meta de referência

- Permissions Reference: https://developers.facebook.com/docs/permissions/reference
- Instagram Content Publishing: https://developers.facebook.com/docs/instagram-api/guides/content-publishing
- Pages API: https://developers.facebook.com/docs/pages-api
- Data Deletion Callback: https://developers.facebook.com/docs/development/create-an-app/app-dashboard/data-deletion-callback
- App Review: https://developers.facebook.com/docs/app-review

## 4. Gravações necessárias (screencasts)

Cada gravação deve mostrar login real na plataforma, ação completa e resultado visível.

1. **OAuth de conexão**
   - Login do cliente → Redes Sociais → Conectar Meta
   - Tela de consentimento Meta com todas as permissões listadas
   - Retorno à plataforma, conta listada como conectada
2. **Publicar Facebook (`pages_manage_posts`)**
   - Criar conteúdo, aprovar, escolher conta Facebook, publicar
   - Mostrar post visível na Página do Facebook
3. **Publicar Instagram (`instagram_content_publish`)**
   - Criar conteúdo com imagem, aprovar, escolher Instagram Business, publicar
   - Mostrar post visível no perfil do Instagram
4. **Insights (`pages_read_engagement` + `instagram_manage_insights`)**
   - Acessar tela de relatórios sociais
   - Mostrar métricas (alcance, impressões, engajamento) das publicações conectadas
5. **Revogação / Exclusão**
   - Desconectar a conta em Redes Sociais > Contas
   - Demonstrar callback de Data Deletion (URL com `deletion_confirmed=<codigo>` exibindo o box de confirmação na Política de Privacidade)

## 5. Conformidade com Política de Plataforma Meta

- Não vendemos dados recebidos da Meta.
- Não usamos dados para publicidade de terceiros.
- Não publicamos sem ação/aprovação explícita do usuário.
- Tokens armazenados apenas no backend (Supabase) com Service Role.
- Revogação acessível ao usuário a qualquer momento.
- Política de Privacidade documenta integração, permissões, uso, armazenamento e revogação.

## 6. Checklist técnico final

- [x] `social-oauth-meta` solicita exatamente as 6 permissões listadas
- [x] `social-oauth-callback` armazena tokens em `social_accounts` com metadata
- [x] `social-publish` (não `social-post`) executa publicação manual
- [x] `social-publish-post` / worker agendado usam `_shared/socialPublish.ts`
- [x] `meta-data-deletion` valida HMAC, desconecta apenas contas correspondentes e registra em `meta_data_deletion_requests`
- [x] `/privacidade` exibe seção dedicada Meta + box de confirmação ao receber `?deletion_confirmed=`
- [x] Insights consumidos a partir de `social_engagement_metrics` (não de função `social-get-insights`)

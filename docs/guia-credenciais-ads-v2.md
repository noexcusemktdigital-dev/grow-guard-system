# GUIA CLIQUE-POR-CLIQUE — Criar Credenciais

## Para Rafael executar com o navegador aberto

## Tempo total: \~45 minutos

---

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# ETAPA 1 — META (Facebook/Instagram Ads)

# Tempo: \~25 minutos

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## 1A — Registrar como Developer (pular se já é)

1. Abra o navegador  
2. Acesse: [**https://developers.facebook.com**](https://developers.facebook.com)  
3. Faça login com o Facebook que **administra o Business Manager da Noexcuse**  
4. Se aparecer "Começar" ou "Get Started":  
   - Clique em **"Começar"**  
   - Aceite os termos (Platform Terms \+ Developer Policies)  
   - Confirme seu email quando a Meta enviar  
5. Se já aparece "Meus Apps" no canto superior direito → já é developer, pule para 1B

---

## 1B — Criar o App

1. No site `developers.facebook.com`, clique em **"Meus Apps"** (canto superior direito)  
2. Clique no botão **"Criar App"** (botão azul/verde)  
3. Na tela de seleção de use case:  
   - Procure e selecione: **"Other"** ou **"Outro"**  
   - Clique **"Next"** / **"Avançar"**  
4. Na tela de tipo de app:  
   - Selecione: **"Business"** (Empresa)  
   - ⚠️ **NÃO selecione** "Consumer" nem "Gaming" — só Business dá acesso ao Marketing API  
   - Clique **"Next"** / **"Avançar"**  
5. Preencha os campos:  
   - **App name (Nome do app):** `Noexcuse Ads MCP`  
   - **App contact email:** seu email da Noexcuse  
   - **Business portfolio / Business Manager:** selecione a conta da Noexcuse na lista dropdown  
6. Clique **"Create App"** / **"Criar App"**  
7. Se pedir senha do Facebook, digite e confirme

**✅ Resultado:** Você está no Dashboard do app. Anote ou copie o número que aparece no topo — é o **App ID**.

---

## 1C — Pegar App ID e App Secret

1. No Dashboard do app, olhe o menu lateral esquerdo  
2. Clique em **"Settings"** → **"Basic"** (ou "Configurações" → "Básico")  
3. Você verá:  
   - **App ID:** número tipo `123456789012345` → **COPIE**  
   - **App Secret:** aparece como `••••••••••` → clique em **"Show"** (Mostrar) → **COPIE**  
4. Cole ambos num arquivo de texto seguro:  
     
   META\_APP\_ID=123456789012345  
     
   META\_APP\_SECRET=a1b2c3d4e5f6g7h8i9j0...  
     
5. Ainda nessa página, procure o campo **"Privacy Policy URL"**:  
   - Digite: `https://noexcusedigital.com.br/privacidade`  
   - (Você precisa criar essa página depois — pode ser simples, texto mínimo)  
6. Clique **"Save Changes"** / **"Salvar alterações"** no final da página

---

## 1D — Adicionar Marketing API ao App

1. No menu lateral esquerdo, clique em **"Add Product"** / **"Adicionar Produto"**  
   - Se não vê esse botão, procure no Dashboard principal um botão "+ Add Product"  
2. Na lista de produtos, procure **"Marketing API"**  
3. Clique no botão **"Set Up"** / **"Configurar"** ao lado de Marketing API  
4. Marketing API agora aparece no menu lateral esquerdo

**✅ Resultado:** O app agora tem acesso ao Marketing API.

---

## 1E — Criar System User (Token que não expira)

**Agora vamos sair do developers.facebook.com e ir para o Business Manager:**

1. Abra uma nova aba no navegador  
2. Acesse: [**https://business.facebook.com/settings**](https://business.facebook.com/settings)  
   - Se redirecionar para Business Suite, procure no menu: **"Settings"** / **"Configurações"** → **"Business Settings"**  
   - Ou acesse diretamente: [**https://business.facebook.com/settings/system-users**](https://business.facebook.com/settings/system-users)  
3. No menu lateral esquerdo, procure a seção **"Users"** / **"Usuários"**  
4. Dentro de "Users", clique em **"System Users"** / **"Usuários do sistema"**  
5. Clique no botão **"Add"** / **"Adicionar"** (botão azul)  
6. Preencha:  
   - **System User Name:** `noexcuse-mcp`  
   - **System User Role:** selecione **"Admin"**  
7. Clique **"Create System User"** / **"Criar Usuário do Sistema"**

**✅ Resultado:** Usuário do sistema `noexcuse-mcp` criado.

---

## 1F — Dar acesso às contas de anúncio ao System User

1. Na lista de System Users, clique no nome **"noexcuse-mcp"** que acabou de criar  
2. Clique no botão **"Add Assets"** / **"Adicionar ativos"**  
3. Na janela que abre:  
   - No menu lateral da janela, clique em **"Ad Accounts"** / **"Contas de anúncio"**  
   - Marque o checkbox de **TODAS as contas de anúncio** da Noexcuse  
   - Para cada conta marcada, no lado direito, selecione permissão: **"Manage campaigns"** / **"Gerenciar campanhas"**  
4. Clique **"Save Changes"** / **"Salvar alterações"**

---

## 1G — Gerar o Token do System User

**⚠️ ATENÇÃO: O token só aparece UMA VEZ. Tenha um arquivo de texto aberto para colar imediatamente.**

1. Ainda na página do System User `noexcuse-mcp`  
2. Clique no botão **"Generate New Token"** / **"Gerar novo token"**  
3. Na janela que abre:  
   - **Select App:** selecione **"Noexcuse Ads MCP"** (o app que você criou)  
   - **Token expiration:** selecione **"Never"** / **"Nunca"** (token permanente)  
   - **Available Permissions:** marque os seguintes checkboxes:  
     - ☑️ `ads_management`  
     - ☑️ `ads_read`  
     - ☑️ `business_management`  
     - ☑️ `pages_show_list`  
     - ☑️ `pages_read_engagement`  
4. Clique **"Generate Token"** / **"Gerar Token"**  
5. **O TOKEN APARECE NA TELA** — é um texto longo começando com `EAABx...`  
6. **COPIE IMEDIATAMENTE** e cole no seu arquivo de texto:  
     
   META\_ACCESS\_TOKEN=EAABxyz123...muito\_longo...  
     
7. Clique **"OK"** para fechar

---

## 1H — Pegar o Business ID

1. Ainda em **business.facebook.com/settings**  
2. No menu lateral, clique em **"Business Info"** / **"Informações da empresa"**  
3. Procure **"Business Manager ID"** ou **"Business ID"**  
4. É um número tipo `9876543210` → **COPIE**  
5. Adicione ao arquivo:  
     
   META\_BUSINESS\_ID=9876543210

---

## ✅ RESULTADO ETAPA 1 — Meta

Seu arquivo deve ter:

META\_APP\_ID=123456789012345

META\_APP\_SECRET=a1b2c3d4e5f6g7h8i9j0abcdef

META\_ACCESS\_TOKEN=EAABxyz...token\_muito\_longo...

META\_BUSINESS\_ID=9876543210

**Guarde esse arquivo com segurança. O META\_ACCESS\_TOKEN não expira mas não pode ser recuperado.**

---

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# ETAPA 2 — GOOGLE (Google Ads API)

# Tempo: \~15 minutos

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## 2A — Ativar Google Ads API

1. Abra o navegador  
2. Acesse: [**https://console.cloud.google.com**](https://console.cloud.google.com)  
3. Faça login com a conta Google que administra o Google Ads da Noexcuse  
4. No canto superior esquerdo, clique no **seletor de projeto** (dropdown que mostra o nome do projeto)  
5. Selecione o **projeto existente** (o que já tem branding verificado)  
   - Se não tem projeto, clique **"New Project"** → Nome: `Noexcuse MCP` → **"Create"**  
6. No menu lateral esquerdo (☰ hambúrguer), clique em **"APIs & Services"** → **"Library"**  
   - Ou acesse diretamente: [**https://console.cloud.google.com/apis/library**](https://console.cloud.google.com/apis/library)  
7. Na barra de busca, digite: **`Google Ads API`**  
8. Clique no resultado **"Google Ads API"** (ícone do Google Ads)  
9. Clique no botão azul **"Enable"** / **"Ativar"**  
10. Aguarde ativar (alguns segundos)

**✅ Resultado:** Google Ads API ativada no projeto.

---

## 2B — Configurar Tela de Consentimento OAuth

**Se já configurou antes, pule para 2C.**

1. No menu lateral, clique em **"APIs & Services"** → **"OAuth consent screen"**  
   - Ou: [**https://console.cloud.google.com/apis/credentials/consent**](https://console.cloud.google.com/apis/credentials/consent)  
2. Selecione **"External"** → clique **"Create"**  
3. Preencha:  
   - **App name:** `Noexcuse MCP Server`  
   - **User support email:** selecione seu email  
   - **Developer contact information (email):** seu email  
4. Clique **"Save and Continue"**  
5. Na tela de "Scopes": clique **"Save and Continue"** (não precisa adicionar scopes aqui)  
6. Na tela de "Test users": clique **"Add Users"** → adicione **seu email do Google** → **"Save and Continue"**  
7. Clique **"Back to Dashboard"**

---

## 2C — Criar OAuth 2.0 Client ID

1. No menu lateral, clique em **"APIs & Services"** → **"Credentials"**  
   - Ou: [**https://console.cloud.google.com/apis/credentials**](https://console.cloud.google.com/apis/credentials)  
2. No topo da página, clique em **"+ Create Credentials"** (botão azul)  
3. No dropdown, selecione **"OAuth client ID"**  
4. Preencha:  
   - **Application type:** selecione **"Web application"** / **"Aplicativo da Web"**  
   - **Name:** `Noexcuse MCP Server`  
   - **Authorized redirect URIs:** clique em **"+ Add URI"** e adicione:  
     - `http://localhost:8088/callback`  
     - (Se quiser mais no futuro, pode adicionar depois)  
5. Clique **"Create"** / **"Criar"**  
6. **Uma janela popup aparece com:**  
   - **Client ID:** tipo `123456789.apps.googleusercontent.com` → **COPIE**  
   - **Client Secret:** tipo `GOCSPX-...` → **COPIE**  
7. **IMPORTANTE:** Clique no botão **"Download JSON"** (ícone de download ⬇️)  
   - Salva um arquivo tipo `client_secret_123456789.apps.googleusercontent.com.json`  
   - **Guarde esse arquivo — o Claude Code vai precisar dele**  
8. Clique **"OK"** para fechar

Adicione ao seu arquivo de credenciais:

GOOGLE\_CLIENT\_ID=123456789.apps.googleusercontent.com

GOOGLE\_CLIENT\_SECRET=GOCSPX-abcdef...

---

## 2D — Verificar/Criar conta MCC (Manager) no Google Ads

1. Abra nova aba: [**https://ads.google.com**](https://ads.google.com)  
2. Faça login com a mesma conta Google  
3. Verifique se você tem uma **conta Manager (MCC)**:  
   - Se no topo aparece um ícone de "ferramenta" (🔧) e a conta tem sub-contas → você tem MCC  
   - Se é uma conta simples de anúncios → precisa criar MCC

**Se PRECISA criar MCC:**

1. Acesse: [**https://ads.google.com/home/tools/manager-accounts/**](https://ads.google.com/home/tools/manager-accounts/)  
2. Clique **"Create a Manager Account"**  
3. Preencha: nome da empresa, fuso horário, moeda  
4. Clique **"Submit"**  
5. Vincule suas contas de anúncio existentes ao MCC

**Pegue o Customer ID do MCC:**

1. Olhe no canto superior direito do Google Ads  
2. O número tipo `123-456-7890` é o Customer ID  
3. **Remova os hífens** para usar na API: `1234567890`  
4. Adicione ao arquivo:  
     
   GOOGLE\_MCC\_CUSTOMER\_ID=1234567890

---

## 2E — Solicitar Developer Token

1. Dentro do Google Ads (conta MCC), clique no ícone **"Tools & Settings"** (🔧 chave inglesa) no topo  
2. Na seção **"Setup"**, procure **"API Center"**  
   - Se não encontrar: **"Tools & Settings"** → **"Setup"** → **"API Center"**  
   - Pode estar em: **"Admin"** → **"API Center"**  
3. Se é primeira vez:  
   - Clique **"Apply for access"** ou **"Request token"**  
   - Preencha o formulário:  
     - **Company name:** Noexcuse  
     - **Website:** noexcuse.com.br  
     - **Describe how you'll use the API:** `Internal tool for campaign management and performance analysis via MCP (Model Context Protocol) integration`  
   - Clique **"Submit"**  
4. Seu **Developer Token** aparece na página do API Center  
   - É um código tipo `AbCdEfGhIjKlMnOp`  
   - **COPIE** e adicione ao arquivo:

   GOOGLE\_DEVELOPER\_TOKEN=AbCdEfGhIjKlMnOp

**⚠️ Status inicial: "Test Account"** — funciona apenas com contas de teste. Para acessar contas reais, você precisa de **Basic Access**. A aprovação demora dias. **Solicite Basic Access agora** (tem um botão "Apply for Basic Access" na mesma página).

---

## ✅ RESULTADO ETAPA 2 — Google

Seu arquivo deve ter:

GOOGLE\_CLIENT\_ID=123456789.apps.googleusercontent.com

GOOGLE\_CLIENT\_SECRET=GOCSPX-abcdef...

GOOGLE\_DEVELOPER\_TOKEN=AbCdEfGhIjKlMnOp

GOOGLE\_MCC\_CUSTOMER\_ID=1234567890

**Mais:** o arquivo JSON baixado (`client_secret_*.json`)

---

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# ETAPA 3 — DNS (Subdomínio)

# Tempo: \~5 minutos

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## 3A — Criar registro DNS

1. Acesse o painel de controle do DNS da Noexcuse (onde o domínio está registrado — pode ser HostGator, Cloudflare, Registro.br, etc.)  
2. Vá em **"Gerenciar DNS"** ou **"Zone Editor"** ou **"DNS Records"**  
3. Clique em **"Add Record"** / **"Adicionar registro"**  
4. Preencha:  
   - **Type / Tipo:** `A`  
   - **Name / Nome:** `ads-mcp` (vai ficar `ads-mcp.noexcusedigital.com.br`)  
   - **Value / Valor:** `129.121.44.127`  
   - **TTL:** `3600` (ou deixe o padrão)  
5. Clique **"Save"** / **"Salvar"**

**Verificar (após alguns minutos):**

\# No terminal (ou peça ao Claude Code)

dig ads-mcp.noexcusedigital.com.br

\# Deve retornar 129.121.44.127

---

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# ETAPA 4 — CRIAR PÁGINA DE PRIVACIDADE

# Tempo: \~5 minutos

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Criar uma página simples em `https://noexcusedigital.com.br/privacidade` com este conteúdo mínimo:

Política de Privacidade — Noexcuse Marketing

Este aplicativo acessa dados de publicidade digital (Facebook Ads, Instagram Ads, Google Ads) 

para fins de gestão, análise e otimização de campanhas publicitárias para nossos clientes.

Dados coletados: métricas de campanhas publicitárias, dados de performance de anúncios.

Uso dos dados: análise interna, geração de relatórios, otimização de campanhas.

Armazenamento: dados processados em servidor próprio, não compartilhados com terceiros.

Contato: \[email da Noexcuse\]

Última atualização: \[data de hoje\]

Pode ser uma página simples no site existente, um post no WordPress, ou até um Google Doc público.

---

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# ETAPA 5 — ENVIAR TUDO PARA O CLAUDE CODE

# Tempo: \~5 minutos

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## O que enviar

Crie um arquivo chamado `.env.noexcuse` com todo o conteúdo:

\# \=== META \===

META\_APP\_ID=

META\_APP\_SECRET=

META\_ACCESS\_TOKEN=

META\_BUSINESS\_ID=

\# \=== GOOGLE \===

GOOGLE\_CLIENT\_ID=

GOOGLE\_CLIENT\_SECRET=

GOOGLE\_DEVELOPER\_TOKEN=

GOOGLE\_MCC\_CUSTOMER\_ID=

**Mais:** o arquivo `client_secret_*.json` do Google.

## Como enviar para o VPS

**Opção 1 — Via code-server** (se estiver rodando):

- Abra code-server no navegador  
- Faça upload dos arquivos para `/home/claude/mcp-servers/`

**Opção 2 — Via SCP no terminal:**

scp \-P 22022 \-i \~/.ssh/claude\_vps .env.noexcuse claude@129.121.44.127:/home/claude/mcp-servers/

scp \-P 22022 \-i \~/.ssh/claude\_vps client\_secret\_\*.json claude@129.121.44.127:/home/claude/mcp-servers/google-ads/

**Opção 3 — Colar direto no Claude Code:**

- O Claude Code pode criar os arquivos no VPS se você colar os valores no chat

---

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# ETAPA 6 — GOOGLE OAUTH (Primeira autenticação)

# Tempo: \~5 minutos

# Isso acontece DEPOIS do Claude Code instalar tudo

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Quando o Claude Code rodar o Google Ads MCP pela primeira vez, ele vai precisar que você complete o OAuth no browser:

1. O Claude Code vai mostrar uma **URL** tipo:  
     
   https://accounts.google.com/o/oauth2/auth?client\_id=...\&redirect\_uri=...\&scope=...  
     
2. **Copie e cole essa URL no seu navegador**  
3. Faça login com a conta Google que administra o Google Ads  
4. Na tela de permissões, clique **"Allow"** / **"Permitir"**  
5. O navegador redireciona para `localhost:8088/callback?code=...`  
   - Se aparecer erro de conexão, **copie a URL inteira da barra de endereço**  
   - Cole no terminal/Claude Code quando ele pedir  
6. O Claude Code recebe o código e salva o token automaticamente

**Isso só precisa ser feito UMA VEZ.** Depois, o refresh token renova automaticamente.

---

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# RESUMO RÁPIDO — ORDEM DE EXECUÇÃO

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

| \# | O quê | Onde | Tempo |
| :---- | :---- | :---- | :---- |
| 1 | Registrar como developer | developers.facebook.com | 2 min |
| 2 | Criar app "Noexcuse Ads MCP" | developers.facebook.com | 3 min |
| 3 | Pegar App ID \+ App Secret | developers.facebook.com/settings | 2 min |
| 4 | Adicionar Marketing API | developers.facebook.com (dashboard do app) | 1 min |
| 5 | Criar System User | business.facebook.com/settings | 3 min |
| 6 | Dar acesso às ad accounts | business.facebook.com/settings | 2 min |
| 7 | Gerar Token permanente | business.facebook.com/settings | 3 min |
| 8 | Pegar Business ID | business.facebook.com/settings | 1 min |
| 9 | Ativar Google Ads API | console.cloud.google.com | 2 min |
| 10 | Configurar OAuth consent | console.cloud.google.com | 3 min |
| 11 | Criar OAuth Client ID | console.cloud.google.com | 3 min |
| 12 | Baixar JSON do OAuth | console.cloud.google.com | 1 min |
| 13 | Verificar/Criar MCC | ads.google.com | 3 min |
| 14 | Solicitar Developer Token | ads.google.com → API Center | 3 min |
| 15 | Solicitar Basic Access | ads.google.com → API Center | 1 min |
| 16 | Criar DNS ads-mcp.noexcusedigital.com.br | Painel DNS | 3 min |
| 17 | Criar página /privacidade | Site da Noexcuse | 5 min |
| 18 | Enviar credenciais para o VPS | SCP / code-server / chat | 3 min |
| **Total** |  |  | **\~45 min** |

---

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# DEPOIS DISSO — O CLAUDE CODE FAZ O RESTO

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Com as credenciais no VPS, o Claude Code:

1. Clona os repos  
2. Instala dependências  
3. Configura os .env  
4. Sobe com PM2  
5. Configura Nginx \+ SSL  
6. Registra os MCP servers  
7. Testa tudo  
8. Baixa e organiza skills

A única interação extra que você terá é a **Etapa 6** (OAuth do Google — \~5 min).
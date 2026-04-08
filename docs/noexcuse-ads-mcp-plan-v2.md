# DOCUMENTO ÚNICO CONSOLIDADO — Noexcuse Ads & Marketing via Claude

## Análise Cruzada \+ Complemento de Pesquisa \+ Plano de Execução Definitivo

## Self-hosted · Zero custo extra · Setup via Claude Code

---

# ÍNDICE

1. Análise Cruzada dos Documentos Originais  
2. Descobertas da Pesquisa (o que faltava)  
3. Decisão Estratégica: Build vs Open-Source  
4. Arquitetura Final  
5. Repos Open-Source Selecionados  
6. Parte Manual — Rafael (\~45 min)  
7. Parte Automatizada — Claude Code (\~1h)  
8. Skills e Project Knowledge  
9. CLAUDE.md para Análise do Repo Grow  
10. CLAUDE.md para Desenvolvimento do MCP Server  
11. Referência Técnica (SDK v2, OAuth 2.1, GAQL, Meta v25)  
12. Checklist Final de Execução  
13. Decisões Pendentes  
14. Custos e Licenças

---

# 1\. ANÁLISE CRUZADA DOS DOCUMENTOS ORIGINAIS

Os dois documentos enviados (`plano-completo-noexcuse-apis-e-analise.md` e `documentacao-completa-izitech-ads-mcp.txt`) são **complementares, não redundantes**.

## O que cada um cobre

| Aspecto | Doc 1 (plano-completo) | Doc 2 (documentação-completa) |
| :---- | :---- | :---- |
| Setup Meta | Passo a passo prático | Detalhes técnicos: API v25, endpoints, SDKs, rate limits |
| Setup Google | Passo a passo prático | GAQL, headers obrigatórios, níveis de Developer Token |
| Setup LinkedIn | Completo | Não cobre |
| Requisitos Anthropic | Menção superficial | Seção inteira: checklist, redirect URIs, submissão |
| Skills/Tools | Script bash (4 repos) | Catálogo detalhado (6 fontes) \+ variáveis de ambiente |
| CLAUDE.md para repo | Seção dedicada (excelente) | Não cobre |
| Plano de execução | Tabela de 10 passos | 4 fases com semanas |
| MCP Server build | Menção como passo 9 | Fases 2-4 detalhadas |

## Conflitos encontrados

| Item | Doc 1 | Doc 2 | Resolução |
| :---- | :---- | :---- | :---- |
| Nome do app Meta | "Noexcuse Ads Connector" | "Izitech Ads Connector" | **Definir antes de criar** |
| Email dev Meta | "email da Noexcuse" | "[dev@izitech.com.br](mailto:dev@izitech.com.br)" | Depende da decisão acima |
| Script de instalação | Bash com 4 repos | 6 fontes \+ variáveis .env | Doc 2 mais completo |

## O que aproveitar de cada

**Do Doc 1 — manter tudo:**

- Passo a passo Meta, Google, LinkedIn (guia prático para Rafael)  
- Checklist visual com 11 itens  
- CLAUDE.md para análise do repo "grow-guard-system"  
- Tabela de próximos passos

**Do Doc 2 — manter:**

- Detalhes técnicos Meta (v25.0, levels, rate limits, endpoints, SDKs)  
- Detalhes técnicos Google (v23, GAQL, headers, Developer Token levels)  
- Requisitos Anthropic Connectors Directory  
- Catálogo de skills com variáveis de ambiente  
- Plano de fases (4 fases, 12 semanas)

**Descartar:**

- Referências a API Anthropic como produto SaaS (conforme solicitado)  
- Deploy em Cloudflare Workers (manter foco no VPS)  
- Custos com plataformas managed (foco em open-source self-hosted)

---

# 2\. DESCOBERTAS DA PESQUISA (O QUE FALTAVA)

## 2.1 Já existem MCP servers open-source PRONTOS

Os documentos originais assumem construção do zero (2-4 semanas). A pesquisa revelou repos open-source maduros que podem ser instalados no VPS em minutos:

**Meta Ads:**

- `pipeboard-co/meta-ads-mcp` — Python, 30+ tools (read+write), BSL 1.1  
- `brijr/meta-mcp` — TypeScript/Node.js, 25 tools, MIT  
- `gomarble-ai/facebook-ads-mcp-server` — Python, MIT, mais simples

**Google Ads:**

- `gomarble-ai/google-ads-mcp-server` — Python, MIT, GAQL \+ keyword research  
- `cohnen/mcp-google-ads` — Python, 5 tools, forks com write  
- `anegash/google-ads-mcp-server` — TypeScript, 82 tools (mais completo)  
- `googleads/google-ads-mcp` — oficial Google, 2 tools, read-only

## 2.2 SDK TypeScript v2 mudou a API

Os documentos referenciam padrões antigos do SDK MCP:

| Antes (v1) | Agora (v2) |
| :---- | :---- |
| `import { Server }` | `import { McpServer }` |
| `server.setRequestHandler()` | `server.registerTool()` |
| JSON Schema para inputs | Zod v4 direto |
| SSE transport | Streamable HTTP (SSE deprecated) |
| Sem annotations | `readOnlyHint` / `destructiveHint` obrigatórios |

## 2.3 OAuth 2.1 é mais complexo do que os docs sugerem

A spec MCP (Nov 2025\) exige para servidores públicos:

- **PKCE obrigatório** com S256  
- **Discovery endpoints:** `/.well-known/oauth-protected-resource` e `/.well-known/oauth-authorization-server`  
- **Dynamic Client Registration (DCR)** — Claude se registra como client público  
- **Sem client\_secret** — public client, PKCE substitui

**Para uso interno (só Noexcuse):** Bearer token estático é suficiente. OAuth 2.1 completo só é necessário para publicação no Connectors Directory.

**Bug conhecido:** Claude Desktop teve problemas com OAuth de custom connectors (Issue \#5, github.com/anthropics/claude-ai-mcp). Claude Code CLI funciona melhor.

## 2.4 Meta API v25 — Objectives mudaram

Objetivos legados retornam erro 400 em campanhas novas:

- ❌ `BRAND_AWARENESS`, `LINK_CLICKS`, `CONVERSIONS`, `APP_INSTALLS`  
- ✅ `OUTCOME_AWARENESS`, `OUTCOME_TRAFFIC`, `OUTCOME_ENGAGEMENT`, `OUTCOME_LEADS`, `OUTCOME_SALES`

## 2.5 Google Developer Token — Impacto prático

| Nível | Acesso | Tempo de Aprovação | Ops/dia |
| :---- | :---- | :---- | :---- |
| Test Account | Só contas de teste | Imediato | Ilimitado (teste) |
| Basic Access | Contas reais | Dias úteis | 15.000 |
| Standard Access | Contas reais | Dias úteis | Sem limite |

**Ação imediata necessária:** Solicitar aprovação AGORA — demora dias.

## 2.6 Serviços managed existem (descartados por custo)

Pipeboard ($49/mês), Adzviser ($34.99/mês), Windsor.ai, Composio, Flyweel — todos oferecem MCP servers gerenciados. **Descartados** conforme diretriz de zero custo extra. Os repos open-source deles (ou equivalentes MIT) serão usados self-hosted.

---

# 3\. DECISÃO ESTRATÉGICA: BUILD vs OPEN-SOURCE

| Opção | Tempo | Custo | Controle | Quando usar |
| :---- | :---- | :---- | :---- | :---- |
| ~~Managed (Pipeboard etc)~~ | 5 min | $49+/mês | Baixo | ~~Descartado~~ |
| **Open-Source no VPS** | 1-2 horas | $0 | Alto | **ESCOLHIDO** |
| Build Custom | 2-4 semanas | $0 (tempo) | Total | Futuro (se virar produto Izitech) |

**Decisão:** Instalar repos open-source no VPS. Se no futuro decidir transformar em produto Izitech para o Connectors Directory, usar esses repos como base/referência para construção custom.

---

# 4\. ARQUITETURA FINAL

┌──────────────────────────────────────────────────────────┐

│                    VPS HostGator                          │

│              129.121.44.127 (SSH 22022\)                   │

│                                                          │

│  ┌─────────────────────────────────────────────────────┐ │

│  │ Nginx (reverse proxy \+ SSL via Let's Encrypt)       │ │

│  │   ads-mcp.noexcusedigital.com.br/meta/  → :3001           │ │

│  │   ads-mcp.noexcusedigital.com.br/google/ → :3002           │ │

│  └─────────────────────────────────────────────────────┘ │

│                                                          │

│  ┌──────────────────┐  ┌───────────────────┐             │

│  │ meta-ads-mcp     │  │ google-ads-mcp    │             │

│  │ Python (venv)    │  │ Python (venv)     │             │

│  │ pipeboard OSS    │  │ gomarble OSS      │             │

│  │ 30+ tools R+W    │  │ GAQL \+ keywords   │             │

│  │ BSL 1.1          │  │ MIT               │             │

│  └──────────────────┘  └───────────────────┘             │

│                                                          │

│  ┌──────────────────────────────────────────────────────┐│

│  │ PM2 — gerencia processos \+ auto-restart             ││

│  └──────────────────────────────────────────────────────┘│

│                                                          │

│  /home/claude/mcp-servers/                               │

│  ├── meta-ads/     (clone \+ venv \+ .env)                 │

│  ├── google-ads/   (clone \+ venv \+ .env \+ client\_secret) │

│  └── skills/       (marketing-skills, claude-ads, etc)   │

└──────────────────────────────────────────────────────────┘

Conexões:

• Claude Code → stdio (direto no processo, sem HTTP)

• claude.ai  → HTTPS via Nginx (Settings → Integrations)

---

# 5\. REPOS OPEN-SOURCE SELECIONADOS

## 5.1 Meta Ads MCP

| Campo | Valor |
| :---- | :---- |
| Repo | `github.com/pipeboard-co/meta-ads-mcp` |
| Licença | BSL 1.1 (uso interno OK, não revender como serviço hosted) |
| Stack | Python |
| Tools | 30+ (read \+ write: campanhas, adsets, ads, criativos, audiences, insights) |
| Auth | META\_APP\_ID \+ META\_APP\_SECRET \+ META\_ACCESS\_TOKEN (app próprio) |
| Transport | stdio (padrão) ou Streamable HTTP |
| Custo | $0 self-hosted |
| Requisito | Meta Developer App \+ System User Token |
| Alternativa MIT | `gomarble-ai/facebook-ads-mcp-server` (mais simples, menos tools) |

**Importante:** Usar modo `CUSTOM_META_APP` (app próprio). NÃO setar `PIPEBOARD_API_TOKEN` — isso conectaria ao serviço pago deles.

## 5.2 Google Ads MCP

| Campo | Valor |
| :---- | :---- |
| Repo | `github.com/gomarble-ai/google-ads-mcp-server` |
| Licença | MIT |
| Stack | Python \+ FastMCP |
| Tools | list\_accounts, execute\_gaql, campaign\_performance, ad\_performance, keyword\_ideas |
| Auth | OAuth 2.0 (client\_secret JSON \+ Developer Token) |
| Transport | stdio |
| Custo | $0 |
| Requisito | Google Cloud OAuth Client \+ Developer Token |
| Alternativa mais completa | `anegash/google-ads-mcp-server` (TypeScript, 82 tools, R+W) |

---

# 6\. PARTE MANUAL — RAFAEL (\~45 min)

## 6.1 Meta — Developer App \+ System User Token

### A) Developer App

1. `developers.facebook.com` → login com Facebook do Business Manager  
2. Meus Apps → Criar App → tipo **Business**  
3. Nome: `Noexcuse Ads MCP`  
4. Email: email da Noexcuse  
5. Business Manager: selecionar o da Noexcuse  
6. Criar App  
7. Dashboard → Adicionar Produto → **Marketing API** → Configurar

### B) System User Token (não expira)

1. `business.facebook.com` → Configurações do Negócio  
2. Usuários → Usuários do sistema → Adicionar  
3. Nome: `noexcuse-mcp` | Função: Admin  
4. Adicionar ativos → selecionar TODAS as contas de anúncio → Gerenciar campanhas  
5. Gerar token → selecionar app "Noexcuse Ads MCP"  
6. Marcar: `ads_management`, `ads_read`, `pages_show_list`  
7. Gerar → **COPIAR E SALVAR** (só aparece uma vez)

### C) Política de Privacidade

- Meta exige URL pública. Criar página simples: `noexcusedigital.com.br/privacidade`  
- Conteúdo mínimo: "Este aplicativo acessa dados de publicidade para fins de gestão e otimização de campanhas."

### D) Credenciais a coletar

META\_APP\_ID=

META\_APP\_SECRET=

META\_ACCESS\_TOKEN=       \# System User Token (nunca expira)

META\_BUSINESS\_ID=

## 6.2 Google — OAuth Client \+ Developer Token

### A) Ativar Google Ads API

1. `console.cloud.google.com` → projeto existente (branding verificado)  
2. APIs e Serviços → Biblioteca → "Google Ads API" → Ativar

### B) Criar OAuth 2.0 Client

1. APIs e Serviços → Credenciais → Criar credenciais → ID do cliente OAuth  
2. Tipo: Aplicativo da Web  
3. Nome: `Noexcuse MCP Server`  
4. URIs de redirecionamento: `http://localhost:8088/callback`  
5. Criar → Anotar Client ID e Client Secret  
6. **Baixar o JSON** (arquivo `client_secret_*.json`)

### C) Developer Token

1. `ads.google.com` → conta MCC (Manager)  
2. Se não tem: criar em `ads.google.com/home/accounts/manager-account`  
3. Ferramentas → Centro de API → Solicitar token  
4. Status inicial: Test Account → **Solicitar Basic Access imediatamente** (demora dias)

### D) Credenciais a coletar

GOOGLE\_CLIENT\_ID=

GOOGLE\_CLIENT\_SECRET=

GOOGLE\_DEVELOPER\_TOKEN=

GOOGLE\_MCC\_CUSTOMER\_ID=        \# Sem hífens (ex: 1234567890\)

\# \+ arquivo client\_secret\_\*.json baixado

## 6.3 DNS

Criar registro A:

ads-mcp.noexcusedigital.com.br → 129.121.44.127

## 6.4 LinkedIn (Fase futura — não bloqueia MVP)

Documentação completa no Doc 1 original (Seção 1.3). Adiar para após Meta \+ Google estarem funcionando.

---

# 7\. PARTE AUTOMATIZADA — CLAUDE CODE (\~1h)

## CLAUDE.md para o Claude Code executar no VPS

\# CLAUDE.md — Setup MCP Servers Noexcuse

\#\# Conexão VPS

\- Host: 129.121.44.127

\- SSH Port: 22022

\- User: claude

\- Key: \~/.ssh/claude\_vps

\#\# Objetivo

Instalar e configurar dois MCP servers open-source no VPS:

1\. Meta Ads MCP (pipeboard-co/meta-ads-mcp) — Python

2\. Google Ads MCP (gomarble-ai/google-ads-mcp-server) — Python

\#\# Sequência de Execução

\#\#\# 1\. Preparar ambiente

\`\`\`bash

\# Verificar Python

python3 \--version  \# Precisa 3.10+

\# Instalar uv (gerenciador Python moderno)

pip install uv \--break-system-packages

\# Criar diretório base

mkdir \-p /home/claude/mcp-servers/{meta-ads,google-ads,skills}

### 2\. Meta Ads MCP

cd /home/claude/mcp-servers

git clone https://github.com/pipeboard-co/meta-ads-mcp.git meta-ads

cd meta-ads

python3 \-m venv venv

source venv/bin/activate

pip install \-e .

\# Criar .env (pedir credenciais ao Rafael)

cat \> .env \<\< 'EOF'

META\_APP\_ID=PEDIR\_AO\_RAFAEL

META\_APP\_SECRET=PEDIR\_AO\_RAFAEL

META\_ACCESS\_TOKEN=PEDIR\_AO\_RAFAEL

META\_BUSINESS\_ID=PEDIR\_AO\_RAFAEL

META\_API\_VERSION=v25.0

EOF

\# NÃO setar PIPEBOARD\_API\_TOKEN (usaria serviço pago)

\# Testar

python \-c "import meta\_ads\_mcp; print('Meta MCP OK')"

### 3\. Google Ads MCP

cd /home/claude/mcp-servers

git clone https://github.com/gomarble-ai/google-ads-mcp-server.git google-ads

cd google-ads

python3 \-m venv venv

source venv/bin/activate

pip install \-r requirements.txt

\# Criar .env (pedir credenciais ao Rafael)

cat \> .env \<\< 'EOF'

GOOGLE\_ADS\_DEVELOPER\_TOKEN=PEDIR\_AO\_RAFAEL

GOOGLE\_ADS\_OAUTH\_CONFIG\_PATH=/home/claude/mcp-servers/google-ads/client\_secret.json

EOF

\# Rafael precisa:

\# 1\. Enviar arquivo client\_secret\_\*.json → salvar como client\_secret.json

\# 2\. Rodar o server uma vez para completar OAuth (abre browser)

\# 3\. Após aprovação no browser, token fica salvo em google\_ads\_token.json

### 4\. PM2

\# Meta Ads

pm2 start /home/claude/mcp-servers/meta-ads/venv/bin/python \\

  \--name meta-ads-mcp \\

  \--interpreter none \\

  \-- \-m meta\_ads\_mcp \\

  \--cwd /home/claude/mcp-servers/meta-ads

\# Google Ads

pm2 start /home/claude/mcp-servers/google-ads/venv/bin/python \\

  \--name google-ads-mcp \\

  \--interpreter none \\

  \-- server.py \\

  \--cwd /home/claude/mcp-servers/google-ads

pm2 save

pm2 startup  \# se ainda não configurou

### 5\. Nginx \+ SSL

\# Criar config

sudo tee /etc/nginx/sites-available/ads-mcp \<\< 'NGINX'

server {

    listen 443 ssl;

    server\_name ads-mcp.noexcusedigital.com.br;

    ssl\_certificate /etc/letsencrypt/live/ads-mcp.noexcusedigital.com.br/fullchain.pem;

    ssl\_certificate\_key /etc/letsencrypt/live/ads-mcp.noexcusedigital.com.br/privkey.pem;

    location /meta/ {

        proxy\_pass http://127.0.0.1:3001/;

        proxy\_http\_version 1.1;

        proxy\_set\_header Host $host;

        proxy\_set\_header X-Real-IP $remote\_addr;

        proxy\_set\_header X-Forwarded-For $proxy\_add\_x\_forwarded\_for;

        proxy\_set\_header X-Forwarded-Proto $scheme;

        proxy\_buffering off;

        proxy\_cache off;

        chunked\_transfer\_encoding on;

    }

    location /google/ {

        proxy\_pass http://127.0.0.1:3002/;

        proxy\_http\_version 1.1;

        proxy\_set\_header Host $host;

        proxy\_set\_header X-Real-IP $remote\_addr;

        proxy\_set\_header X-Forwarded-For $proxy\_add\_x\_forwarded\_for;

        proxy\_set\_header X-Forwarded-Proto $scheme;

        proxy\_buffering off;

        proxy\_cache off;

        chunked\_transfer\_encoding on;

    }

}

NGINX

\# Ativar site

sudo ln \-sf /etc/nginx/sites-available/ads-mcp /etc/nginx/sites-enabled/

sudo nginx \-t && sudo systemctl reload nginx

\# SSL (após DNS configurado)

sudo certbot certonly \--nginx \-d ads-mcp.noexcusedigital.com.br

sudo systemctl reload nginx

### 6\. Skills

cd /tmp

\# Marketing Skills (17 skills)

git clone https://github.com/irinabuht12-oss/marketing-skills.git 2\>/dev/null

mkdir \-p /home/claude/mcp-servers/skills/marketing-skills

cp \-r marketing-skills/Skills\\ for\\ Claude/\* /home/claude/mcp-servers/skills/marketing-skills/ 2\>/dev/null

\# Claude Ads (auditoria)

git clone https://github.com/AgriciDaniel/claude-ads.git 2\>/dev/null

mkdir \-p /home/claude/mcp-servers/skills/claude-ads

cp \-r claude-ads/\* /home/claude/mcp-servers/skills/claude-ads/ 2\>/dev/null

\# Marketing Skills (CRO, copywriting, SEO)

git clone https://github.com/coreyhaines31/marketingskills.git 2\>/dev/null

mkdir \-p /home/claude/mcp-servers/skills/marketingskills

cp \-r marketingskills/skills/\* /home/claude/mcp-servers/skills/marketingskills/ 2\>/dev/null

\# Limpar

rm \-rf /tmp/marketing-skills /tmp/claude-ads /tmp/marketingskills

\# Listar skills instaladas

echo "=== Skills instaladas \==="

find /home/claude/mcp-servers/skills \-name "\*.md" | head \-30

### 7\. Registrar no Claude Code

\# Meta Ads (stdio — direto, sem HTTP)

claude mcp add meta-ads \\

  \--transport stdio \\

  \-- /home/claude/mcp-servers/meta-ads/venv/bin/python \\

  \-m meta\_ads\_mcp

\# Google Ads (stdio)

claude mcp add google-ads \\

  \--transport stdio \\

  \-- /home/claude/mcp-servers/google-ads/venv/bin/python \\

  server.py

### 8\. Testar

\# MCP Inspector

npx @modelcontextprotocol/inspector http://localhost:3001

\# Dentro do Claude Code

\# /mcp  → deve mostrar meta-ads e google-ads

\# Testar: "List my Meta ad accounts"

\# Testar: "Show Google Ads campaign performance last 30 days"

## Regras

- NUNCA commitar tokens no git  
- Tokens ficam em .env (gitignored)  
- Usar virtualenvs Python isolados  
- PM2 para gerenciar processos  
- Testar com MCP Inspector antes de declarar pronto

\---

\# 8\. SKILLS E PROJECT KNOWLEDGE

\#\# 8.1 Para upload no claude.ai (Rafael faz manualmente)

Criar Project: \*\*"Noexcuse Ads Operations"\*\*

Project Knowledge → Upload:

\#\#\# Prioridade Alta (usar imediatamente)

| \# | Skill | Utilidade |

|---|-------|-----------|

| 1 | \`01-google-and-meta-cpa-diagnostics.md\` | Diagnóstico de CPA |

| 2 | \`02-google-and-meta-wasted-spend-finder.md\` | Identificar desperdício |

| 3 | \`05-google-and-meta-client-report-narratives.md\` | Relatórios para clientes |

| 4 | \`06-google-and-meta-anomaly-detection.md\` | Detectar anomalias |

| 5 | \`04-meta-creative-fatigue-detection.md\` | Fadiga de criativo |

\#\#\# Prioridade Média

| 6 | \`03-google-and-meta-budget-scenario-planner.md\` | Planejamento de budget |

| 7 | \`07-google-search-term-mining.md\` | Search terms Google |

| 8 | Skills de SEO, copywriting, CRO (marketingskills) | Otimização geral |

\*\*Fluxo:\*\* Claude Code baixa tudo no VPS → Rafael faz download via code-server ou SCP → upload no claude.ai.

\#\# 8.2 Skills que funcionam SEM API keys externas

| Skill | Funciona sem key? | Observação |

|-------|--------------------|------------|

| claude-ads (auditoria) | ✅ Sim | Framework de análise com dados copiados |

| marketing-skills (17) | ✅ Sim | Análise e relatórios com dados informados |

| marketingskills (CRO/SEO) | ✅ Sim | Copywriting, CRO, analytics |

| openclaudia google-ads-report | ❌ Precisa GOOGLE\_CLIENT\_ID | Instalar depois |

| openclaudia competitor-analysis | ❌ Precisa SEMRUSH\_API\_KEY | Descartado |

| openclaudia serp-analyzer | ❌ Precisa SERPAPI\_API\_KEY | Descartado |

\---

\# 9\. CLAUDE.md PARA ANÁLISE DO REPO GROW

Usar este arquivo na raiz do repo "grow-guard-system" (via Claude Code conectado ao GitHub):

\`\`\`markdown

\# CLAUDE.md — Análise de Integração · Noexcuse (repo: grow-guard-system)

\#\# Objetivo

Analisar o sistema Noe/Grow para identificar:

1\. O que o sistema faz hoje

2\. O que pode ser ADAPTADO para integrar com Meta/Google APIs

3\. O que precisa ser CRIADO do zero

4\. Onde encaixar módulos de "Social Media" e "Ads Management"

\#\# Contexto

\- Sistema: Noe (repo "grow-guard-system")

\- Stack: Lovable \+ Lovable Cloud \+ Supabase
- Supabase Ref: gxrhdpbbxfipeopdyygn
- Org ID Noexcuse: adb09618-e9f3-4dbd-a89c-29e3eb1bec9f
- Auditoria já realizada em 2026-04-03: 507 @ts-nocheck removidos, 50 testes adicionados, múltiplos bugs corrigidos. NÃO refazer o que já está feito.

\- Empresa: Noexcuse (agência de marketing do Grupo Lamadre)

\- Situação: gestão de redes sociais e ads 100% manual

\- Objetivo: gerenciar tudo dentro do sistema via API

\#\# Fase 1: Mapeamento

1\. Listar TODAS as rotas/páginas (src/App.tsx ou router)

2\. Listar TODOS os módulos/funcionalidades existentes

3\. Identificar entidades Supabase (types.ts \+ migrations/)

4\. Verificar se existe: gestão de clientes, campanhas, dashboard de métricas, agendamento, CRM

5\. Listar componentes principais (src/components/)

\#\# Fase 2: Análise de Compatibilidade

Para cada módulo, avaliar:

\- Dashboard de métricas existente? → Pode receber dados de Meta/Google Ads

\- Módulo de clientes? → Pode vincular ad accounts

\- Calendário/agenda? → Pode virar agendador de posts

\- Relatórios? → Pode gerar reports com dados de API

\#\# Fase 3: Proposta de Arquitetura

Propor novas tabelas, páginas, Edge Functions:

\- \`connected\_accounts\`, \`scheduled\_posts\`, \`ad\_campaigns\_cache\`, \`performance\_metrics\`

\- \`/settings/connections\`, \`/social/calendar\`, \`/ads/dashboard\`, \`/ads/campaigns\`

\- Edge Functions: sync-meta-ads, sync-google-ads, publish-instagram, refresh-tokens

\#\# Output Esperado

1\. Mapa do sistema atual

2\. Gap analysis

3\. Plano de implementação (adaptar vs criar)

4\. Schema SQL (novas tabelas)

5\. Estimativa de esforço (horas/complexidade)

6\. Ordem de implementação

\#\# Regras

\- NÃO altere nenhum arquivo — apenas leia e analise

\- CITE sempre arquivo e caminho

\- Seja ESPECÍFICO — não diga "precisa melhorar", diga COMO

---

# 10\. CLAUDE.md PARA DESENVOLVIMENTO DO MCP SERVER (futuro)

Se no futuro decidir construir custom (produto Izitech):

\# CLAUDE.md — Izitech Ads MCP Server Development

\#\# Stack

\- Runtime: Node.js 20+ LTS

\- Language: TypeScript 5.x

\- MCP SDK: @modelcontextprotocol/sdk v2 (McpServer, NÃO Server)

\- Schema: Zod v4

\- HTTP Framework: Express (com @modelcontextprotocol/express)

\- Meta SDK: facebook-nodejs-business-sdk

\- Google SDK: google-ads-api

\#\# Estrutura

izitech-ads-mcp/

├── src/

│   ├── index.ts

│   ├── auth/ (oauth-discovery, oauth-flow, dcr)

│   ├── tools/

│   │   ├── meta/ (campaigns, adsets, ads, insights, audiences)

│   │   ├── google/ (campaigns, adgroups, keywords, metrics)

│   │   └── cross-platform/ (summary)

│   ├── clients/ (meta-client, google-client)

│   └── utils/ (rate-limiter, error-handler, pagination)

├── package.json

├── tsconfig.json

└── .env.example

\#\# Regras

1\. TODOS tools com annotations (readOnlyHint ou destructiveHint)

2\. Input schemas com Zod v4

3\. NUNCA logar tokens

4\. Rate limiting: Meta 200/h, Google 15.000/dia

5\. Erros úteis para LLM, não stack traces

6\. Streamable HTTP transport, NÃO SSE

7\. Testar com: npx @modelcontextprotocol/inspector

\#\# Exemplo de Tool (SDK v2)

server.registerTool(

  'meta\_list\_campaigns',

  {

    title: 'List Meta Campaigns',

    inputSchema: { account\_id: z.string() },

    annotations: { readOnlyHint: true }

  },

  async ({ account\_id }) \=\> ({

    content: \[{ type: 'text', text: JSON.stringify(data) }\]

  })

);

---

# 11\. REFERÊNCIA TÉCNICA

## 11.1 Queries GAQL prontas para a Noexcuse

\-- Performance geral de campanhas (30 dias)

SELECT campaign.id, campaign.name, campaign.status,

  metrics.impressions, metrics.clicks, metrics.cost\_micros,

  metrics.conversions, metrics.conversions\_value

FROM campaign

WHERE segments.date DURING LAST\_30\_DAYS AND campaign.status \!= 'REMOVED'

ORDER BY metrics.cost\_micros DESC

\-- Search terms com desperdício (gastando sem converter)

SELECT search\_term\_view.search\_term,

  metrics.impressions, metrics.clicks, metrics.cost\_micros, metrics.conversions

FROM search\_term\_view

WHERE segments.date DURING LAST\_30\_DAYS AND metrics.clicks \> 5 AND metrics.conversions \= 0

ORDER BY metrics.cost\_micros DESC

\-- Keywords com Quality Score baixo

SELECT ad\_group\_criterion.keyword.text,

  ad\_group\_criterion.quality\_info.quality\_score,

  metrics.impressions, metrics.clicks, metrics.cost\_micros

FROM keyword\_view

WHERE ad\_group\_criterion.quality\_info.quality\_score \< 5

  AND segments.date DURING LAST\_30\_DAYS

ORDER BY metrics.cost\_micros DESC

\-- Performance por dispositivo

SELECT segments.device, metrics.impressions, metrics.clicks,

  metrics.cost\_micros, metrics.conversions

FROM campaign

WHERE segments.date DURING LAST\_7\_DAYS

\-- Anúncios com CTR baixo

SELECT ad\_group\_ad.ad.id, ad\_group\_ad.ad.responsive\_search\_ad.headlines,

  metrics.impressions, metrics.clicks, metrics.ctr, metrics.cost\_micros

FROM ad\_group\_ad

WHERE segments.date DURING LAST\_30\_DAYS AND metrics.impressions \> 100 AND metrics.ctr \< 0.02

ORDER BY metrics.impressions DESC

## 11.2 Meta API v25.0 — Endpoints principais

| Endpoint | Método | Descrição |
| :---- | :---- | :---- |
| `GET /{ad-account-id}/campaigns` | Read | Listar campanhas |
| `GET /{campaign-id}/insights` | Read | Métricas de performance |
| `GET /{ad-account-id}/adsets` | Read | Listar conjuntos |
| `GET /{ad-account-id}/ads` | Read | Listar anúncios |
| `POST /{ad-account-id}/campaigns` | Write | Criar campanha |
| `GET /me/adaccounts` | Read | Listar contas do usuário |

Base URL: `https://graph.facebook.com/v25.0/`

## 11.3 Rate Limits

| Plataforma | Limite | Nível |
| :---- | :---- | :---- |
| Meta (Standard) | 200 calls/hora/user | Standard Access |
| Meta (Advanced) | Mais alto | App Review necessário |
| Google (Test) | Ilimitado (contas teste) | Test Account |
| Google (Basic) | 15.000 ops/dia | Aprovação Google |

## 11.4 Segurança

- Tokens em `.env` (gitignored), nunca no código  
- System User Token da Meta não expira, mas guardar backup  
- Google OAuth refresh token renova automaticamente; se expirar, refazer flow  
- Nginx com SSL (Let's Encrypt) para acesso externo  
- `proxy_buffering off` obrigatório para Streamable HTTP

## 11.5 Nginx config para Streamable HTTP

proxy\_buffering off;

proxy\_cache off;

chunked\_transfer\_encoding on;

proxy\_http\_version 1.1;

proxy\_set\_header Connection "upgrade";

Sem isso, o streaming de respostas do MCP não funciona corretamente.

---

# 12\. CHECKLIST FINAL DE EXECUÇÃO

## Rafael (manual — \~45 min)

- [ ] Criar Meta Developer App tipo Business (`developers.facebook.com`)  
- [ ] Adicionar Marketing API ao app  
- [ ] Criar System User no Business Manager  
- [ ] Gerar System User Token — **SALVAR IMEDIATAMENTE**  
- [ ] Anotar META\_APP\_ID, META\_APP\_SECRET, META\_BUSINESS\_ID  
- [ ] Criar página /privacidade no site da Noexcuse  
- [ ] Ativar Google Ads API no Cloud Console (projeto existente)  
- [ ] Criar OAuth 2.0 Web Client → baixar JSON  
- [ ] Verificar/Criar conta MCC no Google Ads  
- [ ] Solicitar Developer Token → **SOLICITAR BASIC ACCESS IMEDIATAMENTE**  
- [ ] Anotar GOOGLE\_CLIENT\_ID, GOOGLE\_CLIENT\_SECRET, GOOGLE\_DEVELOPER\_TOKEN, MCC\_ID  
- [ ] Criar DNS: `ads-mcp.noexcusedigital.com.br → 129.121.44.127`  
- [ ] Enviar credenciais para o Claude Code

## Claude Code (automatizado — \~1h)

- [ ] SSH no VPS (129.121.44.127:22022)  
- [ ] Verificar Python 3.10+, pip, venv  
- [ ] Instalar uv  
- [ ] Criar /home/claude/mcp-servers/  
- [ ] Clonar pipeboard-co/meta-ads-mcp  
- [ ] Setup venv \+ pip install \+ .env (credenciais Meta)  
- [ ] Testar conexão Meta API  
- [ ] Clonar gomarble-ai/google-ads-mcp-server  
- [ ] Setup venv \+ pip install \+ .env \+ client\_secret.json  
- [ ] Testar conexão Google API (OAuth flow — Rafael aprova no browser)  
- [ ] Configurar PM2 para ambos  
- [ ] Configurar Nginx reverse proxy  
- [ ] Gerar SSL com certbot (após DNS pronto)  
- [ ] Testar HTTPS externo  
- [ ] Baixar e organizar skills markdown (3 repos)  
- [ ] Registrar MCP servers no Claude Code (stdio)  
- [ ] Testar tools via Claude Code (/mcp)  
- [ ] Rodar análise do repo grow com CLAUDE.md

## Rafael pós-setup (\~15 min)

- [ ] claude.ai → Settings → Integrations → Add "Noexcuse Meta Ads"  
- [ ] URL: `https://ads-mcp.noexcusedigital.com.br/meta/`  
- [ ] Repetir para Google: `https://ads-mcp.noexcusedigital.com.br/google/`  
- [ ] Criar Project "Noexcuse Ads Operations" no claude.ai  
- [ ] Upload skills markdown como Project Knowledge  
- [ ] Testar: "Show me my Meta ad accounts"

---

# 13\. DECISÕES PENDENTES

| \# | Decisão | Impacto | Urgência |
| :---- | :---- | :---- | :---- |
| 1 | Marca do connector (Noexcuse vs Izitech) | Nome em todas as plataformas | Antes de criar apps |
| 2 | Escopo MVP: só read ou read+write | Complexidade de permissões | Antes de configurar tokens |
| 3 | Multi-tenant vs single-tenant | Meta: Standard vs Advanced Access | Antes de App Review |
| 4 | LinkedIn: incluir no MVP ou depois | Setup adicional \+ API restritiva | Pode adiar |
| 5 | Integração com Noe/Grow: MCP server isolado vs sync com Supabase | Arquitetura do sistema | Após análise do repo |
| 6 | Build custom futuro: se/quando transformar em produto Izitech | Timeline e investimento | Após validar open-source |

---

# 14\. CUSTOS E LICENÇAS

## Custos

| Item | Custo |
| :---- | :---- |
| Meta Developer App | $0 |
| Meta Marketing API (Standard) | $0 |
| Google Cloud Console | $0 |
| Google Ads API \+ Developer Token | $0 |
| meta-ads-mcp (self-hosted) | $0 |
| google-ads-mcp-server (self-hosted) | $0 |
| Skills markdown (3 repos) | $0 |
| VPS HostGator | Já pago |
| SSL (Let's Encrypt) | $0 |
| Nginx, PM2, Python | $0 |
| **TOTAL CUSTO EXTRA** | **$0** |

## Licenças

| Repo | Licença | Implicação |
| :---- | :---- | :---- |
| pipeboard-co/meta-ads-mcp | BSL 1.1 | Uso interno OK. NÃO pode oferecer como serviço hosted competitivo. Se quiser SaaS futuro, usar gomarble (MIT) como base. |
| gomarble-ai/google-ads-mcp-server | MIT | Sem restrições. Pode usar, modificar, revender. |
| gomarble-ai/facebook-ads-mcp-server | MIT | Alternativa sem restrições de licença para Meta. |
| marketing-skills | Open source | Sem restrições. |
| claude-ads | Open source | Sem restrições. |
| marketingskills | Open source | Sem restrições. |

---

# FIM DO DOCUMENTO CONSOLIDADO
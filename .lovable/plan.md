

# Analise Completa: O que falta para colocar as 3 plataformas em producao

## Resumo Executivo

As tres plataformas (Franqueadora, Franqueado, SaaS/Cliente) estao com a estrutura funcional construida -- rotas, sidebars, CRM, financeiro, contratos, academy, etc. Os gaps restantes sao de **infraestrutura de producao**, **integracao financeira** e **polimento de experiencia**. Abaixo esta a analise dividida por plataforma e por categoria.

---

## 1. BLOQUEADORES CRITICOS (impedem venda)

### 1.1 Integracao Asaas em Producao
- **Status**: Sandbox funcionou, producao retorna `not_allowed_ip`
- **Problema**: A API de producao do Asaas exige IP fixo; as Edge Functions tem IPs dinamicos
- **Solucao necessaria**: Configurar um proxy HTTP com IP estatico (VPS ou servico como Fixie/QuotaGuard) e definir corretamente o segredo `ASAAS_PROXY_URL`
- **Impacto**: Sem isso, NENHUMA cobranca funciona -- assinaturas SaaS, recargas de creditos, taxa de sistema do franqueado, cobranças da matriz
- **Funcoes afetadas**: `asaas-create-subscription`, `asaas-create-charge`, `asaas-charge-system-fee`, `asaas-charge-franchisee`, `asaas-list-payments`

### 1.2 Webhook do Asaas
- **Status**: Codigo pronto (`asaas-webhook`), mas depende do item 1.1 funcionar para ter pagamentos reais
- **Acao**: Apos resolver o IP, registrar a URL do webhook no painel Asaas de producao: `https://gxrhdpbbxfipeopdyygn.supabase.co/functions/v1/asaas-webhook`

### 1.3 Confirmacao de E-mail
- **Status**: `auto_confirm_email` esta desabilitado (correto para producao)
- **Gap**: Nao ha configuracao de dominio de e-mail customizado -- e-mails de confirmacao vao com remetente generico do Supabase, o que pode ir para spam
- **Acao**: Configurar dominio de e-mail customizado (ex: `noreply@noexcuse.com.br`)

---

## 2. PLATAFORMA FRANQUEADORA (super_admin/admin)

### Funcional e Pronto
- Dashboard com KPIs e prioridades
- Agenda nativa com Google Calendar
- Comunicados para a rede
- CRM de Expansao
- Onboarding de unidades (wizard 3 etapas)
- Gestao de unidades (CRUD completo + provision-unit)
- Contratos (templates, gerador, gestao rede)
- Financeiro (dashboard, controle, repasse, fechamentos)
- Marketing e materiais
- Academy/Treinamentos
- Metas e Ranking
- Propostas (builder + PDF)
- Matriz (permissoes e usuarios)
- SaaS Management Hub (5 abas)
- Atendimento (suporte da rede)

### Gaps Identificados
| Item | Prioridade | Descricao |
|------|-----------|-----------|
| Drive Corporativo | Baixa | Item na sidebar esta desabilitado (disabled: true). Pode ser removido ou implementado |
| Notificacoes em tempo real | Media | NotificationBell existe no header mas nao ha sistema de notificacoes push/realtime configurado |
| Relatorios consolidados | Media | O dashboard mostra KPIs basicos; falta relatorios exportaveis (PDF/Excel) com filtros de periodo |
| Logs de auditoria | Baixa | Nao ha registro de acoes administrativas (quem alterou o que) |

---

## 3. PLATAFORMA FRANQUEADO

### Funcional e Pronto
- Dashboard com KPIs, mensagem do dia, comunicados, agenda
- CRM de Vendas completo
- Prospeccao IA
- Criador de Estrategia
- Gerador de Proposta (builder + PDF)
- Materiais/Marketing (heranca da matriz)
- Academy (heranca da matriz)
- Financeiro (read-only + taxa de sistema self-service)
- Contratos (visualizacao dos proprios + franquia)
- Suporte (chamados)
- Agenda e Comunicados
- Perfil e Configuracoes

### Gaps Identificados
| Item | Prioridade | Descricao |
|------|-----------|-----------|
| Diagnostico | Media | Pagina existe na rota mas precisa verificar se o fluxo esta conectado ao banco |
| Metas do Franqueado | Media | Nao ha pagina de metas na sidebar; o franqueado ve metas herdadas mas nao tem visao propria |
| Financeiro - cobranças reais | Alta | Depende do Asaas em producao (item 1.1) |

---

## 4. PLATAFORMA SAAS (Cliente Final)

### Funcional e Pronto
- Landing page (`/landing`) com planos e precos
- Portal de login/signup (`/app`) com Google OAuth
- Auto-provisionamento (trial 7 dias, 1000 creditos)
- Dashboard com KPIs reais (receita, leads, conversao, metas)
- CRM completo (Kanban, lista, contatos, funis, automacoes)
- Chat WhatsApp (Z-API)
- Agentes IA (configuracao e simulacao)
- Scripts de vendas
- Disparos em massa
- Plano de Vendas (diagnostico comercial + gating)
- Plano de Marketing (estrategia IA)
- Conteudos (geracao IA)
- Redes Sociais (conceitos visuais)
- Sites (gerador IA)
- Trafego Pago (estrategia IA)
- Integracoes (WhatsApp, Webhook, API Key, Widget Chat)
- Plano e Creditos (upgrade, recargas, historico)
- Configuracoes (perfil, organizacao, usuarios)
- Avaliacoes (NPS)
- Checklist diario
- Gamificacao
- Feature Gating (bloqueio apos trial)
- Sistema de creditos (debito atomico + guard em todas Edge Functions)

### Gaps Identificados
| Item | Prioridade | Descricao |
|------|-----------|-----------|
| Pagamento de planos | Alta | Depende do Asaas em producao (item 1.1). Sem isso, usuario nao consegue sair do trial |
| Recarga de creditos | Alta | Mesmo problema -- depende do Asaas |
| Integracoes de ads | Baixa | Meta Ads, Google Ads, TikTok Ads estao como formularios de token mas sem backend real |
| RD Station | Baixa | Formulario de integracao presente mas sem processamento |
| Google Calendar cliente | Media | Formulario presente mas precisa verificar se OAuth funciona para o cliente |
| Notificacoes | Media | Pagina existe mas sistema de push/realtime nao esta implementado |
| Responsividade mobile | Media | Sidebar nao tem menu hamburger; UX pode ser ruim em telas pequenas |

---

## 5. INFRAESTRUTURA TRANSVERSAL

| Item | Prioridade | Status |
|------|-----------|--------|
| RLS Policies | OK | Implementadas em todas as tabelas |
| Multi-tenancy (parent_org_id) | OK | Funcoes RPC com heranca funcionando |
| RBAC (5 roles) | OK | Roles em tabela separada, ProtectedRoute funcionando |
| LGPD (Termos + Privacidade) | OK | Paginas publicas implementadas |
| Seed de usuarios teste | OK | Edge Function seed-users pronta |
| Dominio customizado | Pendente | App esta em lovable.app; precisa dominio proprio |
| SSL | OK | Automatico pelo Lovable |
| Backup do banco | Pendente | Nao ha estrategia de backup alem do Lovable Cloud |

---

## 6. PLANO DE ACAO RECOMENDADO (ordem de prioridade)

### Fase 1 - Resolver Asaas (1-2 dias)
1. Contratar servico de proxy com IP fixo (Fixie, QuotaGuard, ou VPS propria)
2. Configurar o segredo `ASAAS_PROXY_URL` com a URL correta
3. Liberar o IP fixo no painel Asaas de producao
4. Testar: criar cobranca, receber webhook, verificar atualizacao de status
5. Registrar URL do webhook no painel Asaas

### Fase 2 - Configurar E-mail (1 dia)
1. Configurar dominio de e-mail para envio de confirmacoes e convites
2. Testar fluxo completo de signup -> confirmacao -> login

### Fase 3 - Dominio e Publicacao (1 dia)
1. Conectar dominio customizado (ex: app.noexcuse.com.br)
2. Publicar versao de producao
3. Testar landing page -> signup -> trial -> upgrade

### Fase 4 - Polimento (3-5 dias, pode ser pos-lancamento)
1. Implementar notificacoes realtime
2. Melhorar responsividade mobile
3. Remover itens desabilitados da sidebar (Drive Corporativo)
4. Adicionar relatorios exportaveis

---

## Conclusao

**O unico bloqueador real para vender e o Asaas em producao** (item 1.1). Todo o resto do sistema -- autenticacao, multi-tenancy, CRM, IA, contratos, financeiro, academy -- esta funcional e conectado ao banco de dados real. Uma vez que o proxy com IP fixo esteja configurado e o webhook registrado, as tres plataformas estarao prontas para receber usuarios pagantes.


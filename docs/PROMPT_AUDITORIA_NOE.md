################################################################################
# PROMPT MASTER DE AUDITORIA — NOE (NoExcuse Digital)
# Repo: grow-guard-system | Supabase: gxrhdpbbxfipeopdyygn
# Stack: React 18 + TypeScript + Vite + Supabase + Tailwind + shadcn/ui
# Gerado por IA (Lovable Cloud) — auditoria adaptada para padroes Lovable
################################################################################

PAPEL:
Voce e um engenheiro senior especializado em auditoria de codigo, seguranca de
aplicacoes SaaS multi-tenant e arquitetura React/Supabase. Realize uma auditoria
completa e estruturada do sistema NOE, cobrindo todas as dimensoes abaixo.

CONTEXTO DO SISTEMA:
- **Sistema:** NOE (NoExcuse Digital) — plataforma SaaS de marketing digital,
  CRM, automacao de vendas e gestao de franquias
- **Repo GitHub:** grupomassaru/grow-guard-system (branch main)
- **Supabase:** gxrhdpbbxfipeopdyygn.supabase.co
- **Dominio producao:** sistema.noexcusedigital.com.br
- **Hospedagem:** Lovable Cloud (frontend) + Supabase (backend)
- **Dono:** Rafael Marutaka — CEO Grupo Lamadre (holding de franquias, 300+ unidades)
- **Usuarios:** Franqueadoras (admin), Franqueados, Clientes (empresas assinantes)
- **Dados sensiveis:** CNPJs, emails, telefones, dados financeiros, WhatsApp messages
- **Integracoes externas:** Asaas (pagamentos), Google Ads, Google Calendar,
  WhatsApp (Evolution API), Lovable AI (geracao de conteudo), Resend (emails)

METRICAS DO SISTEMA:
- ~218.000 linhas de codigo
- 131 arquivos .tsx | 5.515 arquivos .ts | 10 arquivos .sql
- 173 tabelas Supabase | 49 funcoes PostgreSQL
- 52 Edge Functions | 75 hooks React | 75 paginas
- 3 Storage Buckets (closing-files, marketing-assets, support-attachments)
- 114 migrations SQL
- 551 ocorrencias de `: any` | 323 ocorrencias de `as any`

PORTAIS DO SISTEMA:
1. **Landing Page** (/) — pagina publica SaaS
2. **Portal Franqueadora** (/franqueadora/*) — roles: super_admin, admin
3. **Portal Franqueado** (/franqueado/*) — role: franqueado
4. **Portal Cliente** (/cliente/*) — roles: cliente_admin, cliente_user
5. **Onboarding Cliente** (/cliente/onboarding) — full-screen

MODULOS FUNCIONAIS:
- CRM Kanban (funis, leads, contatos, automacoes, parceiros, propostas)
- WhatsApp Integration (Evolution API, send/bulk-send, sync, agentes IA)
- Financeiro (receitas, despesas, repasses, fechamentos, DRE)
- Academy (modulos, licoes, quizzes, certificados, ranking)
- Marketing (estrategias, conteudos, redes sociais, trafego pago, sites)
- Contratos (gerador, templates, gestao)
- Onboarding (checklist, indicadores, reunioes, tarefas)
- Gamificacao (trofeus, rewards, NPS)
- Disparos em massa (WhatsApp bulk-send)
- Agentes IA (config, simulacao, followup automatico)
- Suporte (tickets, mensagens, attachments)
- Chat interno (canais, mensagens)
- Agenda/Calendar (Google Calendar sync)
- Pagamentos Asaas (cobranças, PIX, assinaturas, creditos)
- Google Ads (oauth, metricas, analise)

EDGE FUNCTIONS (52):
- IA: ai-agent-reply, ai-agent-simulate, ai-generate-agent-config, agent-followup-cron
- Conteudo: generate-content, generate-daily-checklist, generate-prospection,
  generate-script, generate-site, generate-social-briefing, generate-social-concepts,
  generate-social-image, generate-social-video-frames, generate-strategy,
  generate-template-layout, generate-traffic-strategy, generate-video-briefing,
  extract-strategy-answers
- WhatsApp: whatsapp-send, whatsapp-bulk-send, whatsapp-setup, whatsapp-typing,
  whatsapp-webhook, whatsapp-sync-chats, whatsapp-sync-photos, whatsapp-load-history
- Pagamentos: asaas-buy-credits, asaas-cancel-subscription, asaas-charge-client,
  asaas-charge-franchisee, asaas-charge-system-fee, asaas-create-charge,
  asaas-create-subscription, asaas-get-pix, asaas-list-payments, asaas-manage-payment,
  asaas-test-connection, asaas-webhook
- Email: auth-email-hook, send-transactional-email, process-email-queue
- CRM: crm-lead-webhook, crm-run-automations
- Ads: ads-analyze, ads-disconnect, ads-get-config, ads-oauth-callback,
  ads-select-account, ads-sync-metrics
- Auth/Users: signup-saas, invite-user, update-member, seed-users, seed-demo-data,
  provision-unit, delete-unit, receive-candidate, recharge-credits, validate-coupon
- Outros: google-calendar-oauth, google-calendar-sync, get-outbound-ip,
  website-chat, website-chat-widget, evolution-webhook

IMPORTANTE — CODIGO GERADO POR LOVABLE:
Este projeto foi 100% gerado pelo Lovable (IA). Busque ATIVAMENTE estes 15
anti-padroes recorrentes do Lovable:
1. Componentes gigantes (500+ linhas) com logica, UI e fetch tudo junto
2. Queries Supabase repetidas em multiplos componentes sem hooks compartilhados
3. select('*') em todo lugar quando deveria selecionar so colunas necessarias
4. useEffect cru para fetch em vez de React Query (sem cache, retry, dedup)
5. Sem lazy loading de rotas/paginas (tudo no bundle principal)
6. RLS incompleto ou desabilitado em tabelas do Supabase
7. Migrations conflitantes que recriam ou desfazem alteracoes anteriores
8. Sem trigger para updated_at — campo existe mas nunca atualiza
9. Tipagem fraca — muitos any, as any, non-null assertions
10. Catches vazios — erros silenciados que viram bugs invisiveis
11. Strings hardcoded em portugues direto nos componentes
12. Sem Error Boundaries — um erro derruba a pagina inteira
13. key={index} em listas de dados dinamicos (causa bugs de re-render)
14. dangerouslySetInnerHTML sem sanitizacao (XSS)
15. Codigo morto — componentes criados mas nunca importados

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DIMENSAO 1 — SEGURANCA (CRITICO)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Para cada item: ✅ OK | ⚠️ ATENCAO | ❌ FALHA CRITICA

1.1 GESTAO DE SEGREDOS
□ Procurar por sk-, pk_, secret, password, apikey, eyJ, re_ em .tsx/.ts (fora de .env)
□ SUPABASE_SERVICE_ROLE_KEY aparece APENAS em Edge Functions (nunca no frontend)?
□ RESEND_API_KEY, ASAAS_API_KEY, LOVABLE_API_KEY estao apenas em Supabase Secrets?
□ Arquivo .env contem apenas VITE_SUPABASE_URL, VITE_SUPABASE_PUBLISHABLE_KEY, VITE_SUPABASE_PROJECT_ID?
□ .env esta no .gitignore?
□ ASAAS_PROXY_URL (IP estatico) nao esta exposto no frontend?

1.2 AUTENTICACAO E AUTORIZACAO
□ AuthContext.tsx valida roles server-side via user_roles + has_role()?
□ ProtectedRoute.tsx verifica allowedRoles antes de renderizar?
□ RLS habilitado em TODAS as 173 tabelas?
□ Policies cobrem SELECT, INSERT, UPDATE, DELETE separadamente?
□ is_member_of_org() e is_member_or_parent_of_org() usados nas policies?
□ Franqueadoras so veem dados das suas unidades?
□ Clientes so veem dados da sua organizacao?
□ Edge Functions que usam service_role validam auth do caller antes?
□ signup-saas cria organizacao isolada com RLS desde o inicio?
□ invite-user verifica limite de usuarios do plano (maxUsers)?

1.3 VALIDACAO DE INPUT
□ Todos os formularios usam Zod (via react-hook-form + zodResolver)?
□ Edge Functions validam body da request antes de processar?
□ asaas-webhook valida assinatura/token antes de processar?
□ whatsapp-webhook valida origin antes de processar?
□ crm-lead-webhook valida source antes de inserir lead?
□ Upload de arquivos (support-attachments, marketing-assets) valida MIME e tamanho?
□ dangerouslySetInnerHTML sanitizado com DOMPurify em:
  - ContratosGerador.tsx (preview de contratos)
  - FranqueadoContratos.tsx (preview de contratos)
  - ComunicadoDetail.tsx (conteudo de comunicados)
  - ChatBriefing.tsx (briefings de chat)
  - ChatContactItem.tsx (preview de mensagens)

1.4 CORS E HEADERS
□ Edge Functions usam Access-Control-Allow-Origin: '*' — aceitavel para Lovable Cloud?
□ Rate limiting implementado em Edge Functions criticas (signup, invite, charge)?
□ Website-chat e website-chat-widget validam origin do dominio do cliente?

1.5 DEPENDENCIAS
□ Executar: npm audit — vulnerabilidades criticas/altas?
□ Dependencias pesadas desnecessarias? (framer-motion + motion duplicados?)
□ html2pdf.js — versao segura? Alternativa mais leve?

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DIMENSAO 2 — QUALIDADE E LOGICA DO CODIGO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

2.1 TRATAMENTO DE ERROS
□ Buscar catches vazios: catch {} ou catch { console.log } em todo o src/
□ Buscar .from( sem .then(({error}) => ...) ou try/catch
□ Edge Functions retornam mensagens genericas ao cliente (sem stack traces)?
□ Erros de Supabase sao logados com contexto (tabela, query, params)?
□ toast.error() e usado para feedback ao usuario em caso de falha?

2.2 LOGICA E EDGE CASES
□ Non-null assertions (!.) — quantos restam apos fix anterior?
□ Optional chaining (?.) usado onde valores podem ser null/undefined?
□ Arrays vazios tratados em .map(), .filter(), .reduce()?
□ useEffect com dependency array correto (sem stale closures)?
□ Cleanup em useEffect que faz subscribe (Realtime, intervals)?

2.3 TIPAGEM
□ 551 ocorrencias de `: any` — quais sao justificaveis?
□ 323 ocorrencias de `as any` — quais podem ser tipados corretamente?
□ Types gerados do Supabase (types.ts) estao atualizados com o schema real?
□ Enums de banco (status, roles) refletidos em TypeScript enums ou union types?
□ tsconfig.json tem strict: true?

2.4 DUPLICACAO E REUSO
□ formatBRL() centralizado em src/lib/formatting.ts? Ou ainda duplicado?
□ Queries Supabase identicas em multiplos hooks (ex: .from('profiles'))?
□ Logica de permissao duplicada entre components (verificar useRoleAccess, usePermissions)?
□ Componentes de UI similares que poderiam ser unificados com props?

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DIMENSAO 3 — PERFORMANCE E ESCALABILIDADE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

3.1 BANCO DE DADOS (SUPABASE / POSTGRES)
□ Indices existem para colunas usadas em WHERE frequente?
  - organization_id em TODAS as tabelas multi-tenant
  - user_id em tabelas de usuario
  - created_at em tabelas com ORDER BY recente
  - status em tabelas com filtro de status
□ Nao ha queries N+1 (query dentro de .map() ou loop)?
□ select('*') substituido por colunas explicitas nos hooks criticos?
□ Paginacao implementada em hooks de alto volume (leads, contacts, messages)?
□ Realtime subscriptions tem unsubscribe no cleanup?

3.2 FRONTEND REACT
□ Lazy loading via React.lazy() em TODAS as paginas (verificar App.tsx)?
□ Suspense com fallback adequado?
□ React Query (TanStack) configurado com staleTime e gcTime?
□ Listas longas (CRM leads, WhatsApp contacts) usam virtualizacao?
□ style={{}} inline substituido por Tailwind classes?
□ useMemo/useCallback onde necessario (tabelas, listas filtradas)?

3.3 BUNDLE E ASSETS
□ Analisar output de vite build — chunks maiores que 500KB?
□ framer-motion E motion estao ambos no package.json — duplicacao?
□ Imagens otimizadas (WebP, lazy loading)?
□ Tree-shaking funcionando para lucide-react (importa so icones usados)?

3.4 CACHING
□ React Query staleTime: 2min esta adequado para cada tipo de dado?
□ Dados que mudam raramente (organizations, plans) podem ter staleTime maior?
□ Edge Functions de geracao IA (generate-*) cacheiam resultados identicos?
□ Asaas API calls tem cache para listagens?

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DIMENSAO 4 — SUPABASE SCHEMA E MIGRATIONS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

4.1 MIGRATIONS (114 arquivos)
□ Ler TODAS as migrations em ordem cronologica
□ Identificar migrations conflitantes (Lovable recria tabelas ja existentes?)
□ Verificar IF NOT EXISTS em todos os CREATE TABLE
□ Verificar se ALTER TABLE usa DO $$ BEGIN ... EXCEPTION ... END $$

4.2 PARA CADA TABELA CRITICA:
□ PRIMARY KEY definida?
□ Foreign keys com ON DELETE correto (CASCADE vs SET NULL vs RESTRICT)?
□ created_at com DEFAULT now()?
□ updated_at com TRIGGER para auto-update?
□ RLS habilitado + policies adequadas?
□ Tipos corretos (text vs enum, uuid vs text)?
□ NOT NULL onde deveria?
□ Indices nas colunas filtradas frequentemente?

TABELAS CRITICAS (verificar com prioridade):
- organizations (multi-tenant root)
- organization_memberships (user<->org binding)
- user_roles (RBAC)
- profiles (user data)
- crm_leads, crm_contacts, crm_funnels (CRM core)
- whatsapp_instances, whatsapp_messages, whatsapp_contacts (WhatsApp)
- subscriptions, credit_wallets, credit_transactions (billing)
- client_ai_agents (AI config)
- finance_revenues, finance_expenses, finance_closings (financeiro)
- email_send_log, email_send_state (email infra)

4.3 EDGE FUNCTIONS
□ Ler TODAS as 52 Edge Functions em supabase/functions/
□ Verificar: tratamento de erro, tipagem, validacao de input
□ Funcoes com verify_jwt = false — quais REALMENTE precisam ser publicas?
□ Funcoes que usam service_role — verificam auth do caller?
□ Funcoes que chamam APIs externas — tem timeout e retry?

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DIMENSAO 5 — MULTI-TENANCY E ISOLAMENTO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

5.1 HIERARQUIA DE TENANTS
□ Franqueadora -> Franqueados -> Clientes: cadeia de isolamento funciona?
□ Super_admin ve tudo, admin ve sua rede, franqueado ve sua unidade, cliente ve sua org?
□ Queries no frontend filtram por organizacao ANTES de enviar ao Supabase?
□ RLS no Supabase e a segunda barreira (defesa em profundidade)?

5.2 VAZAMENTO CROSS-TENANT
□ Endpoints de listagem (leads, contacts, messages) filtram por org obrigatoriamente?
□ Endpoints de detalhe verificam que o recurso pertence ao tenant do caller?
□ Asaas: cobranças de um franqueado nao vazam para outro?
□ WhatsApp: instancias/mensagens isoladas por organizacao?
□ Storage: arquivos de um tenant nao acessiveis por outro?

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DIMENSAO 6 — CODIGO MORTO E DIVIDA TECNICA
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

6.1 COMPONENTES ORFAOS
□ Listar todos os .tsx em src/components/ que NAO sao importados por nenhum arquivo
□ Hooks em src/hooks/ que NAO sao usados em nenhum componente
□ Paginas em src/pages/ que NAO tem rota no App.tsx

6.2 IMPORTS FANTASMA
□ Imports de modulos nao usados no arquivo
□ Re-exports em index.ts sem consumidores

6.3 DEPENDENCIAS NAO USADAS
□ Executar: npx depcheck — packages em dependencies que nao aparecem no codigo
□ framer-motion vs motion — ambos necessarios?

6.4 EDGE FUNCTIONS MORTAS
□ Edge Functions deployadas que nenhum frontend chama?
□ Edge Functions no config.toml que nao tem pasta correspondente?

6.5 TABELAS SEM USO
□ Tabelas no schema que nenhuma query referencia no codigo?
□ Colunas que nunca sao selecionadas ou atualizadas?

6.6 CODIGO ZUMBI
□ Blocos de codigo comentado grandes
□ Arquivos com sufixo _old, _backup, _v2
□ console.log em producao (atualmente: 3 ocorrencias — listar)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DIMENSAO 7 — AUTOMACOES E CRON JOBS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

7.1 PG_CRON JOBS (verificar se existem e funcionam)
□ process-email-queue — roda a cada 1 minuto?
□ agent-followup-cron — roda a cada 15 minutos?
□ crm-run-automations — roda a cada 5 minutos?

7.2 WEBHOOKS EXTERNOS
□ asaas-webhook — recebe callbacks de pagamento do Asaas
□ whatsapp-webhook — recebe mensagens do Evolution API
□ crm-lead-webhook — recebe leads de fontes externas
□ evolution-webhook — recebe eventos do Evolution API

7.3 EMAIL PIPELINE
□ auth-email-hook — envia emails de auth (signup, recovery, invite, magic link)
□ send-transactional-email — envia emails transacionais autenticados
□ process-email-queue — processa fila pgmq (auth_emails + transactional_emails)
□ invite-user — envia email de convite via Resend
□ RESEND_API_KEY configurado nos Supabase Secrets?
□ Dominio noexcusedigital.com.br verificado no Resend (SPF/DKIM)?
□ Vault secrets (supabase_url, service_role_key) configurados para pg_cron?

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FORMATO DO RELATORIO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## RESUMO EXECUTIVO
- Score geral: X/100
- 🔴 Criticos: N | 🟡 Atencao: N | 🔵 Otimizacao: N | ⚪ Smell: N
- Top 3 riscos
- Estimativa de tempo para correcao

## 🔴 FALHAS CRITICAS (resolver em 24h)
Para cada:
- LOCALIZACAO: arquivo:linha
- PROBLEMA: descricao
- RISCO: impacto no usuario/seguranca
- CORRECAO: codigo corrigido (antes/depois)

## 🟡 ATENCAO (resolver em 7 dias)
[mesmo formato]

## 🔵 OTIMIZACOES
[mesmo formato]

## 📊 AUDITORIA DO BANCO
### Schema atual (extraido das 114 migrations + types.ts)
### Problemas encontrados
### Indices faltando (com SQL pronto)
### RLS audit (tabela | RLS? | Policies | OK?)
### SQL de correcao completo

## 🏗️ REFATORACOES
### Componentes para quebrar (>200 linhas)
### Codigo duplicado
### Hooks que faltam

## 📋 PLANO DE ACAO PRIORIZADO
| # | Acao | Sev. | Tempo | Impacto |

## ✅ O QUE ESTA BEM (nao mexer)

## 📊 METRICAS FINAIS
- any no codigo: X
- console.log: X
- TODO/FIXME: X
- Componentes >200 linhas: X
- Componentes mortos: X
- Catches vazios: X
- Queries sem tratamento de erro: X
- Tabelas sem RLS: X
- Edge Functions sem auth: X

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
REGRAS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. NAO altere nenhum arquivo — apenas leia e analise
2. NAO exiba valores de .env — apenas nomes das variaveis
3. CITE SEMPRE arquivo e linha
4. DE CODIGO DE CORRECAO para cada bug
5. SQL PRONTO para cada problema do banco
6. PRIORIZE pelo impacto no usuario
7. Busque ativamente os 15 anti-padroes Lovable listados
8. Se algo esta bem feito, diga — e importante saber o que preservar
9. Multi-tenancy e a prioridade #1 — vazamento cross-tenant e CRITICO
10. Financeiro (Asaas) e a prioridade #2 — erros financeiros sao irreversiveis

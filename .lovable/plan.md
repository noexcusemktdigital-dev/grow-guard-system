

# Propostas/Produtos no CRM + Dashboard Unificado

## Resumo

Duas grandes mudancas: (1) criar um sistema completo de propostas e negociacao dentro do CRM com cadastro de produtos e empresas parceiras, e (2) transformar a pagina "Relatorios" em um "Dashboard" com abas para CRM, Chat e Agentes IA.

---

## Parte 1: Propostas e Negociacao no CRM

### 1.1 Nova tabela `crm_products`

Cadastro de produtos/servicos que podem ser adicionados a propostas.

Colunas:
- `id` uuid PK
- `organization_id` uuid NOT NULL (FK organizations)
- `name` text NOT NULL
- `description` text nullable
- `price` numeric default 0
- `unit` text default 'un' (un, hora, mes, projeto)
- `category` text nullable
- `is_active` boolean default true
- `created_at`, `updated_at` timestamps

RLS: membros podem SELECT, admins (super_admin, admin, cliente_admin) podem ALL.

### 1.2 Nova tabela `crm_partner_companies`

Empresas parceiras que podem ser vinculadas a propostas.

Colunas:
- `id` uuid PK
- `organization_id` uuid NOT NULL
- `name` text NOT NULL
- `document` text nullable (CNPJ)
- `contact_name` text nullable
- `contact_email` text nullable
- `contact_phone` text nullable
- `notes` text nullable
- `created_at`, `updated_at` timestamps

RLS: membros podem SELECT/INSERT/UPDATE, admins podem DELETE.

### 1.3 Alterar tabela `crm_proposals`

Adicionar colunas:
- `items` jsonb default '[]' -- lista de produtos: `[{product_id, name, quantity, unit_price, discount, total}]`
- `partner_company_id` uuid nullable (FK crm_partner_companies)
- `notes` text nullable -- observacoes internas
- `valid_until` date nullable -- validade da proposta
- `payment_terms` text nullable -- condicoes de pagamento
- `discount_total` numeric default 0

### 1.4 Nova aba "Propostas" no Lead Detail Sheet

No `CrmLeadDetailSheet.tsx`, adicionar uma 5a aba "Propostas" (ao lado de Dados, Atividades, Tarefas, WhatsApp) com:

- Lista de propostas vinculadas ao lead
- Badge de status colorido (Rascunho, Enviada, Aceita, Rejeitada)
- Botao "+ Nova Proposta" que abre um Dialog/Sheet com:
  - Titulo da proposta
  - Empresa parceira (select com busca)
  - Tabela de itens: selecionar produto do catalogo, quantidade, preco unitario, desconto -- calculo automatico do total por linha
  - Botao "Adicionar item" para mais linhas
  - Resumo: subtotal, desconto total, valor final
  - Condicoes de pagamento (texto livre)
  - Validade da proposta (date)
  - Observacoes internas
- Acoes por proposta: Editar, Enviar (muda status), Marcar como Aceita, Marcar como Rejeitada, Duplicar, Excluir

### 1.5 Gestao de Produtos (dentro do CRM Config)

No `CrmConfigPage.tsx`, adicionar uma nova aba "Produtos" com:
- Lista de produtos cadastrados com nome, preco, unidade, categoria
- Busca e filtro por categoria
- Dialog para criar/editar produto
- Toggle ativo/inativo
- Importacao simples (manual)

### 1.6 Gestao de Empresas Parceiras (dentro do CRM Config)

No `CrmConfigPage.tsx`, adicionar uma nova aba "Parceiros" com:
- Lista de empresas parceiras
- Dialog para criar/editar
- Campos: nome, CNPJ, contato, email, telefone, notas

### 1.7 Hook `useCrmProposals`

Novo hook com:
- `useCrmProposals(leadId?)` -- lista propostas (filtro opcional por lead)
- `useCrmProposalMutations()` -- create, update, delete, duplicate

### 1.8 Hook `useCrmProducts`

Novo hook com:
- `useCrmProducts()` -- lista todos os produtos ativos
- `useCrmProductMutations()` -- CRUD

### 1.9 Hook `useCrmPartners`

Novo hook com:
- `useCrmPartners()` -- lista parceiros
- `useCrmPartnerMutations()` -- CRUD

---

## Parte 2: Dashboard Unificado (substituir Relatorios)

### 2.1 Renomear pagina

- Mudar `ClienteRelatorios.tsx` para `ClienteDashboard.tsx`
- Atualizar sidebar: "Relatorios" -> "Dashboard" com mesmo icone `BarChart3`
- Atualizar rota de `/cliente/relatorios` para `/cliente/dashboard`

### 2.2 Abas do Dashboard

Tres abas principais usando `Tabs`:

**Aba "CRM" (padrao):**
- KPIs: Receita total, Leads captados, Taxa de conversao, Ticket medio (ja existem)
- Grafico radial de conversao (ja existe)
- Grafico de barras: leads por etapa do funil
- Grafico de barras: leads por origem
- Grafico de linha: evolucao de leads no tempo (7d/30d/90d)
- Tabela: top leads por valor
- Card: propostas em aberto (quantidade e valor total)

**Aba "Chat":**
- KPIs: Total de conversas, Mensagens hoje, Tempo medio de resposta, Conversas ativas
- Dados vindos de `whatsapp_contacts` e `whatsapp_messages`
- Grafico: volume de mensagens por dia
- Lista: ultimas conversas

**Aba "Agentes IA":**
- KPIs: Total de agentes, Agentes ativos, Mensagens processadas pela IA, Tokens utilizados
- Dados vindos de `client_ai_agents` e `ai_conversation_logs`
- Grafico: uso por agente
- Lista: ultimos logs de conversa IA

### 2.3 Exportacao de Relatorios

Em cada aba, botao "Exportar" que gera um CSV com os dados filtrados pelo periodo selecionado.

---

## Arquivos a criar/editar

| Acao | Arquivo |
|------|---------|
| Migration | Criar `crm_products`, `crm_partner_companies`; alterar `crm_proposals` |
| Criar | `src/hooks/useCrmProposals.ts` |
| Criar | `src/hooks/useCrmProducts.ts` |
| Criar | `src/hooks/useCrmPartners.ts` |
| Reescrever | `src/pages/cliente/ClienteRelatorios.tsx` -> `src/pages/cliente/ClienteDashboard.tsx` |
| Editar | `src/components/crm/CrmLeadDetailSheet.tsx` -- adicionar aba Propostas |
| Editar | `src/components/crm/CrmConfigPage.tsx` -- adicionar abas Produtos e Parceiros |
| Editar | `src/components/ClienteSidebar.tsx` -- renomear Relatorios para Dashboard |
| Editar | `src/App.tsx` -- atualizar rota |
| Editar | `src/hooks/useClienteCrm.ts` -- exportar novos hooks |

## Detalhes Tecnicos

- A tabela `crm_proposals` ja existe com campos basicos (`title`, `value`, `status`, `content`, `lead_id`). As novas colunas (`items`, `partner_company_id`, `notes`, `valid_until`, `payment_terms`, `discount_total`) serao adicionadas via migration
- O campo `items` e um array jsonb onde cada item referencia um `product_id` mas tambem salva `name` e `unit_price` para historico (snapshot do preco no momento da proposta)
- O calculo do `value` total da proposta e feito automaticamente somando os itens menos o desconto
- Os dados de Chat e Agentes IA no Dashboard usam as tabelas `whatsapp_contacts`, `whatsapp_messages`, `client_ai_agents` e `ai_conversation_logs` que ja existem
- As queries de mensagens usam cast `as any` no supabase client (padrao ja estabelecido em `useWhatsApp.ts`)
- O CSV de exportacao e gerado no frontend com `Blob` + download (mesmo padrao do import de contatos)
- RLS das novas tabelas segue o padrao multi-tenant com `is_member_of_org` e `has_role`


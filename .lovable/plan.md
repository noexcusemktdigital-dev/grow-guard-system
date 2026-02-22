

# Agentes de IA -- CRUD Completo

## Resumo

Criar o modulo de Agentes de IA para o cliente SaaS, permitindo criar, editar, visualizar e excluir agentes inteligentes. Cada agente tera configuracoes organizadas em 6 abas: Identidade, Persona, Base de Conhecimento, Engenharia de Prompt, Simulador e Diagnostico.

## O que sera construido

### 1. Tabela no banco de dados

Criar a tabela `client_ai_agents` com os campos:

- `id` (uuid, PK)
- `organization_id` (uuid, FK para organizations)
- `created_by` (uuid)
- `name` (text) -- nome do agente
- `avatar_url` (text, nullable) -- foto/icone
- `status` (text, default 'draft') -- draft, active, paused
- `description` (text, nullable)
- `persona` (jsonb, default '{}') -- tom de voz, estilo, personalidade
- `knowledge_base` (jsonb, default '[]') -- documentos/URLs de referencia
- `prompt_config` (jsonb, default '{}') -- system prompt, temperatura, modelo
- `channel` (text, default 'whatsapp') -- canal onde atua
- `tags` (text[], default '{}')
- `created_at`, `updated_at` (timestamps)

RLS: membros da organizacao podem CRUD; isolamento por `organization_id` via `is_member_of_org`.

### 2. Hook `useClienteAgents`

- `useClienteAgents()` -- lista todos os agentes da organizacao
- `useClienteAgentById(id)` -- agente individual para edicao
- `useClienteAgentMutations()` -- create, update, delete

Seguindo o padrao existente em `useClienteContent.ts`.

### 3. Pagina principal (listagem)

Substituir o placeholder atual por:

- Header com botao "+ Novo Agente"
- Cards dos agentes com nome, status (badge), descricao curta, canal
- Acoes: Editar, Duplicar, Excluir
- Estado vazio estilizado quando nao ha agentes

### 4. Dialog/Sheet de criacao e edicao

Um dialog amplo (Sheet) com 6 abas (Tabs):

- **Identidade**: nome, descricao, avatar, canal, tags, status
- **Persona**: tom de voz, estilo de comunicacao, personalidade (campos em jsonb)
- **Base de Conhecimento**: lista de URLs/textos de referencia que o agente deve usar
- **Engenharia de Prompt**: system prompt customizado, temperatura, modelo preferido
- **Simulador**: area para testar o agente (placeholder visual por ora, sem backend de IA conectado ainda)
- **Diagnostico**: metricas e status do agente (placeholder visual)

### 5. Tipo TypeScript

Adicionar interface `AiAgent` em `src/types/cliente.ts`.

## Arquivos envolvidos

| Acao | Arquivo |
|------|---------|
| Criar | `src/hooks/useClienteAgents.ts` |
| Criar | `src/components/cliente/AgentCard.tsx` |
| Criar | `src/components/cliente/AgentFormSheet.tsx` |
| Editar | `src/pages/cliente/ClienteAgentesIA.tsx` |
| Editar | `src/types/cliente.ts` |
| Migration | Nova tabela `client_ai_agents` |

## Detalhes Tecnicos

- A tabela usa `jsonb` para persona, knowledge_base e prompt_config, permitindo flexibilidade sem migracoes futuras para cada campo novo
- O Simulador e Diagnostico serao abas visuais com placeholder -- a integracao real com Lovable AI sera feita em um passo posterior
- RLS usa `is_member_of_org(auth.uid(), organization_id)` para ALL, consistente com as demais tabelas do cliente
- Delete restrito a `cliente_admin` via `has_role`




# Modulo Comercial Completo do Franqueado

Desenvolvimento do nucleo comercial integrado: CRM robusto, Prospeccao IA, Criador de Estrategia e Gerador de Proposta -- todos interconectados.

---

## Visao Geral do Fluxo

```text
CRM (Lead) --> Prospeccao IA --> Criador de Estrategia --> Gerador de Proposta --> Contrato
     ^              |                    |                        |
     |              v                    v                        v
     +---- Gestao de etapas, vinculo por lead_id em todas as tabelas
```

O CRM e o hub central. Prospeccao, Estrategia e Proposta sao vinculados a leads e arquivados independentemente.

---

## 1. CRM de Vendas (Robusto)

### O que muda
O CRM atual e basico (kanban simples, sem detalhe de lead). Sera reescrito para ser o centro comercial.

### Funcionalidades
- Kanban com 8 etapas: Novo Lead, Primeiro Contato, Follow-up, Diagnostico, Apresentacao de Estrategia, Proposta, Venda, Oportunidade Perdida
- Cards com indicadores visuais (checkmarks coloridos): Prospeccao feita, Diagnostico/Estrategia feito, Proposta gerada, Proposta aceita
- Detalhe do lead em Sheet lateral com:
  - Timeline de historico (atividades, mudancas de etapa)
  - Notas editaveis
  - Gestao de tarefas vinculadas ao lead
  - Botoes de acao rapida: "Criar Prospeccao IA", "Criar Estrategia", "Gerar Proposta"
- Visao Lista e Kanban
- Filtros: busca, etapa, origem, responsavel
- Mover lead entre etapas via drag-and-drop ou select
- Marcar como Ganho/Perdido com motivo

### Arquivos
- `src/pages/franqueado/FranqueadoCRM.tsx` -- reescrita completa
- `src/components/franqueado/CrmLeadDetailSheet.tsx` -- novo, detalhe do lead
- `src/components/franqueado/CrmKanbanCard.tsx` -- novo, card com indicadores

---

## 2. Prospeccao IA

### O que muda
Pagina atual e um placeholder. Sera reescrita com IA real (edge function) e persistencia.

### Funcionalidades
- 3 abas: **Nova Prospeccao**, **Historico**, **Scripts Comerciais**
- Nova Prospeccao: formulario com campos (regiao, nicho, porte do prospect, desafio principal, objetivo da abordagem)
- A IA gera um plano completo: estrategia de abordagem, avaliacao inicial, roteiro de primeiro contato, quebra de objecoes, passo a passo para agendar reuniao de diagnostico
- Resultado exibido em formato estruturado (secoes com icones)
- Botao "Vincular ao Lead" para associar ao CRM
- Historico: lista de prospeccoes geradas, com busca e filtro, podendo reabrir/editar
- Scripts Comerciais: reutiliza a logica existente do `generate-script` para gerar roteiros por etapa

### Banco de dados
- Nova tabela `franqueado_prospections`:
  - id, organization_id, lead_id (nullable), title, inputs (jsonb -- regiao, nicho, etc.), result (jsonb -- plano gerado), status (draft/completed), created_by, created_at, updated_at

### Edge Function
- `generate-prospection` -- nova edge function usando Lovable AI (Gemini 3 Flash) para gerar plano de prospeccao completo

### Arquivos
- `src/pages/franqueado/FranqueadoProspeccaoIA.tsx` -- reescrita completa
- `src/hooks/useFranqueadoProspections.ts` -- novo, CRUD prospeccoes
- `supabase/functions/generate-prospection/index.ts` -- nova edge function

---

## 3. Criador de Estrategia (antigo Diagnostico NOE)

### O que muda
Renomear "Diagnostico NOE" para "Criador de Estrategia" na sidebar e em todo o sistema.

### Funcionalidades
- Formulario de diagnostico profundo com ~25 perguntas em 7 secoes:
  - Sobre o Negocio (segmento, tempo de mercado, faturamento, equipe)
  - Marketing Atual (presenca digital, investimento, canais)
  - Comercial (processo de vendas, ticket medio, ciclo de venda)
  - Receita e Objetivos (meta de faturamento, crescimento desejado)
  - Concorrencia (principais concorrentes, diferenciais)
  - Dores e Desafios (principais problemas relatados)
  - Objetivos do Projeto (o que espera alcançar)

- Resultado gerado pela IA:
  - **Termometro de Maturidade**: 4 niveis (Caotico 0-25%, Reativo 26-50%, Estruturado 51-75%, Analitico 76-100%)
  - **Radar Chart**: eixos por area (Marketing, Comercial, Receita, Gestao de Dados, Presenca Digital)
  - **Plano de Acao em 3 fases**: Estruturacao (mes 1-2), Crescimento (mes 3-4), Escala (mes 5-6+)
  - **Projecoes**: graficos de Leads e Receita (com vs sem estrategia) usando Recharts
  - **Entregas Recomendadas**: lista de servicos/produtos NOEXCUSE que fazem sentido para a estrategia, vinculados ao catalogo de servicos da calculadora

- Botao "Gerar Proposta" que leva direto para o Gerador de Proposta com os servicos pre-selecionados
- Estrategias ficam arquivadas e podem ser editadas/duplicadas
- Vinculo com lead do CRM (opcional)

### Banco de dados
- Nova tabela `franqueado_strategies`:
  - id, organization_id, lead_id (nullable), title, diagnostic_answers (jsonb), result (jsonb -- termometro, radar, plano, projecoes, entregas), status (draft/completed), created_by, created_at, updated_at

### Edge Function
- `generate-strategy` -- nova edge function que recebe as respostas do diagnostico e gera a estrategia completa com calculos, projecoes e entregas recomendadas

### Arquivos
- `src/pages/franqueado/FranqueadoEstrategia.tsx` -- novo (substituindo FranqueadoDiagnostico)
- `src/components/franqueado/StrategyDiagnosticForm.tsx` -- formulario de diagnostico
- `src/components/franqueado/StrategyResult.tsx` -- resultado com graficos
- `src/hooks/useFranqueadoStrategies.ts` -- novo, CRUD estrategias
- `supabase/functions/generate-strategy/index.ts` -- nova edge function
- `src/components/FranqueadoSidebar.tsx` -- renomear "Diagnostico NOE" para "Criador de Estrategia"
- `src/App.tsx` -- atualizar rota de /diagnostico para /estrategia

---

## 4. Gerador de Proposta (com Calculadora NOE)

### O que muda
Pagina atual e uma lista basica. Sera reescrita com calculadora integrada e vinculo com estrategia.

### Funcionalidades
- 2 abas: **Propostas** (lista existentes) e **Nova Proposta** (calculadora)
- Nova Proposta em 3 etapas:
  1. **Selecao de Servicos**: catalogo NOE com ~35 servicos em 5 modulos (Branding, Social Media, Performance, Web, CRM). Cada servico tem tipo (unitario/mensal), preco base e quantidade editavel. Se vindo de uma estrategia, servicos ja vem pre-selecionados.
  2. **Configuracao de Pagamento**: duracao do projeto (1, 6 ou 12 meses), parcelamento do setup (1x, 3x, 6x), visualizacao mes a mes do fluxo de pagamento
  3. **Preview e Geracao**: resumo completo, dados do cliente (nome, empresa, CNPJ), botao gerar PDF e botao "Enviar para Contratos"

- Lista de propostas com filtros, status (Rascunho, Enviada, Aceita, Rejeitada), duplicar, editar
- Proposta pode ser criada sem vinculo com estrategia (calculadora livre)
- Vinculo com lead do CRM

### Banco de dados
- Usar tabela existente `crm_proposals` (ja tem items, value, status, lead_id)
- Nova tabela `noe_service_catalog`:
  - id, organization_id, module (text), name (text), type (text -- unitario/mensal), base_price (numeric), unit (text), is_active (boolean), sort_order (integer)
- Seed com servicos padrao NOEXCUSE

### Arquivos
- `src/pages/franqueado/FranqueadoPropostas.tsx` -- reescrita completa
- `src/components/franqueado/PropostaCalculadora.tsx` -- wizard 3 etapas
- `src/components/franqueado/PropostaServiceSelector.tsx` -- selecao de servicos
- `src/components/franqueado/PropostaPaymentConfig.tsx` -- configuracao pagamento
- `src/components/franqueado/PropostaPreview.tsx` -- preview com PDF
- `src/hooks/useFranqueadoServiceCatalog.ts` -- novo, catalogo de servicos
- `src/constants/noeServices.ts` -- catalogo padrao de servicos NOE

---

## 5. Integracao entre Modulos

### Fluxo no CRM
- No detalhe do lead, botoes de acao:
  - "Prospeccao IA" -- abre Prospeccao ja vinculada ao lead
  - "Criar Estrategia" -- abre Criador de Estrategia ja vinculado ao lead
  - "Gerar Proposta" -- abre Gerador de Proposta ja vinculado ao lead
- Indicadores visuais no card do Kanban mostram quais etapas o lead ja completou

### Vinculo por lead_id
- `franqueado_prospections.lead_id` -- vincula prospeccao ao lead
- `franqueado_strategies.lead_id` -- vincula estrategia ao lead
- `crm_proposals.lead_id` -- ja existe, vincula proposta ao lead

---

## Detalhes Tecnicos

### Migracao SQL

```sql
-- Tabela de prospeccoes
CREATE TABLE franqueado_prospections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  lead_id uuid REFERENCES crm_leads(id) ON DELETE SET NULL,
  title text NOT NULL,
  inputs jsonb NOT NULL DEFAULT '{}',
  result jsonb DEFAULT NULL,
  status text NOT NULL DEFAULT 'draft',
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE franqueado_prospections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members can manage prospections"
  ON franqueado_prospections FOR ALL
  USING (is_member_of_org(auth.uid(), organization_id));

-- Tabela de estrategias
CREATE TABLE franqueado_strategies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  lead_id uuid REFERENCES crm_leads(id) ON DELETE SET NULL,
  title text NOT NULL,
  diagnostic_answers jsonb NOT NULL DEFAULT '{}',
  result jsonb DEFAULT NULL,
  status text NOT NULL DEFAULT 'draft',
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE franqueado_strategies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members can manage strategies"
  ON franqueado_strategies FOR ALL
  USING (is_member_of_org(auth.uid(), organization_id));

-- Catalogo de servicos NOE
CREATE TABLE noe_service_catalog (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  module text NOT NULL,
  name text NOT NULL,
  type text NOT NULL DEFAULT 'mensal',
  base_price numeric NOT NULL DEFAULT 0,
  unit text NOT NULL DEFAULT 'un',
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE noe_service_catalog ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members can view catalog"
  ON noe_service_catalog FOR SELECT
  USING (is_member_of_org(auth.uid(), organization_id));
CREATE POLICY "Admins can manage catalog"
  ON noe_service_catalog FOR ALL
  USING (
    has_role(auth.uid(), 'super_admin') OR
    has_role(auth.uid(), 'admin') OR
    has_role(auth.uid(), 'franqueado')
  );
```

### Edge Functions

**generate-prospection**: Recebe inputs (regiao, nicho, porte, desafio, objetivo), retorna plano estruturado em JSON com secoes: estrategia_abordagem, avaliacao_inicial, roteiro_contato, quebra_objecoes, passo_a_passo_reuniao.

**generate-strategy**: Recebe respostas do diagnostico (~25 campos), retorna JSON com: maturidade (score 0-100, nivel), radar_data (5 eixos com scores), plano_acao (3 fases com acoes), projecoes (6 meses de leads e receita, com e sem estrategia), entregas_recomendadas (lista de servicos NOE com justificativa).

### Ordem de Implementacao
Dada a complexidade, sugiro implementar em etapas:

1. **Etapa 1**: Migracao SQL (todas as tabelas) + Sidebar renomeada
2. **Etapa 2**: CRM robusto (Kanban 8 etapas + detalhe do lead + indicadores)
3. **Etapa 3**: Prospeccao IA (edge function + UI + historico)
4. **Etapa 4**: Criador de Estrategia (edge function + diagnostico + graficos)
5. **Etapa 5**: Gerador de Proposta (calculadora + preview + vinculo estrategia)
6. **Etapa 6**: Integracao final (botoes entre modulos, indicadores no kanban)

Cada etapa sera implementada e testavel separadamente. Recomendo aprovar e comecar pela Etapa 1 + 2 (banco de dados e CRM), depois seguir modulo por modulo.


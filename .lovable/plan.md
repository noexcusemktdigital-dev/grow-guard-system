

# Sistema de Avaliacao, Gamificacao Completa e Checklist Automatico

## Visao Geral

Tres funcionalidades interligadas para engajamento e gestao de desempenho dos usuarios do cliente final.

---

## 1. Avaliacao de Usuarios pelo Admin/Gestor

O `cliente_admin` podera avaliar cada membro da equipe periodicamente com notas e comentarios.

### Nova tabela: `user_evaluations`

```text
id, organization_id, evaluator_id, user_id, period (ex: "2026-02"), 
score (1-5), categories (jsonb: {comercial: 4, atendimento: 5, engajamento: 3}),
comment, created_at, updated_at
```

### Nova pagina: `/cliente/avaliacoes`
- Visivel apenas para `cliente_admin`
- Lista membros da equipe com cards mostrando: nome, pontuacao media, ultima avaliacao
- Botao "Avaliar" abre formulario com:
  - Categorias de avaliacao (Comercial, Atendimento, Engajamento, Proatividade) com nota 1-5 cada
  - Comentario geral
  - Periodo (mes/ano)
- Historico de avaliacoes por usuario
- Media das avaliacoes contribui para pontos de gamificacao (+20 pts por estrela media)

### Integracao com Gamificacao
- A media das avaliacoes do gestor sera visivel na pagina de Gamificacao de cada usuario
- Nova secao "Avaliacao do Gestor" no card de gamificacao individual

---

## 2. Gamificacao e Evolucao do Usuario (melhorias)

### Atualizacoes na tabela `client_gamification`
- Adicionar coluna `xp` (integer, default 0) -- experiencia acumulada separada de pontos
- Adicionar coluna `title` (text) -- titulo atual do usuario (ex: "Novato", "Vendedor Bronze")

### Sistema de niveis e titulos

```text
Nivel 1: Novato (0-499 XP)
Nivel 2: Aprendiz (500-1499 XP)
Nivel 3: Profissional (1500-3499 XP)
Nivel 4: Especialista (3500-6999 XP)
Nivel 5: Mestre (7000-11999 XP)
Nivel 6: Lenda (12000+ XP)
```

### Fontes de XP
- Checklist completo no dia: +50 XP
- Lead criado: +10 XP
- Lead ganho: +50 XP
- Avaliacao positiva do gestor (media >= 4): +100 XP
- Sequencia de 7 dias de checklist: +200 XP bonus

### Nova secao "Evolucao" na pagina de Gamificacao
- Barra de progresso visual mostrando XP atual vs proximo nivel
- Titulo atual destacado
- Historico de conquistas recentes

---

## 3. Checklist Automatico com Tarefas Geradas pelo Sistema

### Nova tabela: `checklist_templates`

```text
id, organization_id, title, description, category (comercial/marketing/operacional),
frequency (daily/weekly), conditions (jsonb), is_active, created_by, created_at
```

### Logica de geracao automatica

Uma Edge Function `generate-daily-checklist` sera executada via cron diariamente (ou no primeiro acesso do dia) e criara tarefas automaticas baseadas em:

**Tarefas fixas diarias (sempre geradas):**
- "Verificar leads novos no CRM"
- "Responder mensagens pendentes"
- "Atualizar pipeline de vendas"

**Tarefas condicionais (baseadas no estado):**
- Se tem leads parados ha mais de 2 dias: "Fazer follow-up em leads parados"
- Se tem tarefas do CRM vencidas: "Resolver tarefas vencidas do CRM"
- Se nao postou conteudo essa semana: "Criar conteudo para redes sociais"
- Se tem propostas pendentes: "Acompanhar propostas enviadas"

### Diferenciar tarefas manuais de automaticas
- Adicionar coluna `source` na tabela `client_checklist_items`: `manual` ou `system`
- Adicionar coluna `category`: `comercial`, `marketing`, `operacional`
- Tarefas do sistema aparecem com icone diferente (engrenagem) e nao podem ser excluidas pelo usuario

### Atualizacao da pagina de Checklist
- Separar tarefas por categoria com badges coloridas
- Tarefas do sistema com badge "Auto" e icone de engrenagem
- Ao completar todas as tarefas do dia, somar XP na gamificacao
- Calculo real do streak (dias consecutivos com 100% do checklist)

### Sidebar do Cliente
- Adicionar item "Gamificacao" com icone Trophy na secao global
- Adicionar item "Avaliacoes" visivel apenas para `cliente_admin`

---

## Detalhes Tecnicos

### Migracoes SQL

**1. Tabela `user_evaluations`:**
```sql
CREATE TABLE user_evaluations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id),
  evaluator_id uuid NOT NULL,
  user_id uuid NOT NULL,
  period text NOT NULL,
  score integer NOT NULL CHECK (score >= 1 AND score <= 5),
  categories jsonb DEFAULT '{}',
  comment text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
-- RLS: cliente_admin pode inserir/atualizar; membros veem proprias avaliacoes
```

**2. Tabela `checklist_templates`:**
```sql
CREATE TABLE checklist_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id),
  title text NOT NULL,
  description text,
  category text DEFAULT 'operacional',
  frequency text DEFAULT 'daily',
  conditions jsonb DEFAULT '{}',
  is_active boolean DEFAULT true,
  created_by uuid,
  created_at timestamptz DEFAULT now()
);
-- RLS: cliente_admin pode gerenciar; membros podem ler
```

**3. Alterar `client_checklist_items`:**
```sql
ALTER TABLE client_checklist_items 
  ADD COLUMN source text DEFAULT 'manual',
  ADD COLUMN category text DEFAULT 'operacional';
```

**4. Alterar `client_gamification`:**
```sql
ALTER TABLE client_gamification 
  ADD COLUMN xp integer DEFAULT 0,
  ADD COLUMN title text DEFAULT 'Novato';
```

### Edge Function: `generate-daily-checklist`
- Recebe `user_id` e `organization_id`
- Verifica se ja gerou tarefas hoje (evita duplicatas)
- Consulta `checklist_templates` ativos da org
- Consulta estado do CRM (leads parados, tarefas vencidas, etc.)
- Insere tarefas com `source = 'system'` na `client_checklist_items`
- Atualiza streak e XP na `client_gamification`

### Arquivos novos

| Arquivo | Descricao |
|---------|-----------|
| `src/pages/cliente/ClienteAvaliacoes.tsx` | Pagina de avaliacoes (admin) |
| `src/hooks/useEvaluations.ts` | Hook para CRUD de avaliacoes |
| `src/hooks/useChecklistTemplates.ts` | Hook para templates de checklist |
| `supabase/functions/generate-daily-checklist/index.ts` | Edge Function para gerar tarefas |

### Arquivos modificados

| Arquivo | Mudanca |
|---------|---------|
| `src/pages/cliente/ClienteChecklist.tsx` | Separar por categoria, icones, completar soma XP |
| `src/pages/cliente/ClienteGamificacao.tsx` | Adicionar secao Evolucao e Avaliacao do Gestor |
| `src/components/ClienteSidebar.tsx` | Adicionar "Gamificacao" e "Avaliacoes" |
| `src/hooks/useClienteContent.ts` | Adicionar toggle de completar checklist com XP |
| `src/App.tsx` | Adicionar rota `/cliente/avaliacoes` |
| Migracao SQL | 4 migracoes (tabelas + alteracoes) |



## Reestruturacao Completa do Modulo de Marketing

### Visao Geral

Reorganizar o fluxo de marketing para: Estrategia primeiro (obrigatoria) → Conteudos (puxa da estrategia) → Redes Sociais (identidade visual obrigatoria). Adicionar tooltips de duvida, historico de estrategias, melhorar prompts de geracao de artes e tornar tudo mais claro e objetivo.

---

### 1. Estrategia — Persistencia e Historico

**Problema atual**: A estrategia salva no `localStorage` e se perde. Nao tem historico.

**Solucao**: Criar tabela `marketing_strategies` no banco para persistir a estrategia ativa e o historico.

**Migracao SQL**:
```sql
CREATE TABLE public.marketing_strategies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  answers JSONB NOT NULL DEFAULT '{}',
  score_percentage INT NOT NULL DEFAULT 0,
  nivel TEXT NOT NULL DEFAULT 'Iniciante',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.marketing_strategies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Membros da org podem ler estrategias"
  ON public.marketing_strategies FOR SELECT
  USING (is_member_of_org(auth.uid(), organization_id));

CREATE POLICY "Membros da org podem inserir estrategias"
  ON public.marketing_strategies FOR INSERT
  WITH CHECK (is_member_of_org(auth.uid(), organization_id));

CREATE POLICY "Membros da org podem atualizar estrategias"
  ON public.marketing_strategies FOR UPDATE
  USING (is_member_of_org(auth.uid(), organization_id));
```

**Arquivo**: `src/pages/cliente/ClientePlanoMarketing.tsx`

Alteracoes:
- Ao completar a estrategia, salvar no banco (nao mais localStorage) com `is_active = true`
- Ao refazer, marcar a anterior como `is_active = false` (vai para historico)
- Na aba de resultados, a estrategia fica sempre visivel e editavel
- Adicionar aba "Historico" com lista de estrategias anteriores (data, score, nivel)
- Adicionar botao "Refazer Estrategia" que abre o wizard novamente
- Ao carregar a pagina, buscar a estrategia ativa do banco

**Novo hook**: `src/hooks/useMarketingStrategy.ts`
- `useActiveStrategy()` — busca a estrategia ativa da org
- `useSaveStrategy()` — mutation para salvar nova estrategia
- `useStrategyHistory()` — lista historico de estrategias anteriores

---

### 2. Tooltips de Duvida em Todos os Modulos

**Componente reutilizavel**: `src/components/HelpTooltip.tsx`

```text
[?] ← icone discreto ao lado de labels
     └─ Tooltip com texto explicativo
```

Sera usado em:
- **Estrategia**: ao lado de cada pergunta (ex: "CAC e o custo medio para adquirir um novo cliente")
- **Conteudos**: ao lado de campos do wizard (ex: "O funil de conteudo ajuda a atrair, engajar e converter")
- **Redes Sociais**: ao lado de campos da identidade visual (ex: "A paleta de cores define a personalidade visual da marca")

Cada pergunta/campo tera um `helpText` opcional no tipo.

---

### 3. Conteudos — Multi-objetivo e Anexos

**Arquivo**: `src/pages/cliente/ClienteConteudos.tsx`

Alteracoes no wizard de briefing:
- **Multi-objetivo**: campo de objetivo passa de `Select` para `multi-choice` (checkboxes). O usuario pode marcar "Gerar leads" + "Aumentar engajamento" ao mesmo tempo
- **Anexos/Links**: Novo campo "Materiais de apoio" com:
  - Input de URL (para links de referencia)
  - Upload de arquivo (PDF, imagem) para o bucket `social-arts`
  - Lista de anexos adicionados com botao de remover
- **Puxa da estrategia**: Ao abrir o wizard, buscar a estrategia ativa e pre-preencher campos relevantes (persona, segmento, tom, diferenciais). Injetar esses dados no prompt da IA
- **Tooltips**: Adicionar `HelpTooltip` em cada campo do wizard

**Arquivo**: `supabase/functions/generate-content/index.ts`

Alteracoes no prompt:
- Receber `estrategia` como parametro com dados completos da estrategia ativa
- Receber `objetivos` como array (multi-select)
- Receber `materiais` como array de URLs/descricoes de anexos
- Injetar contexto da estrategia no system prompt para gerar conteudos mais alinhados

---

### 4. Redes Sociais — Identidade Visual Obrigatoria

**Arquivo**: `src/pages/cliente/ClienteRedesSociais.tsx`

**Bloqueio de geracao**: Se a secao "Identidade Visual" nao estiver preenchida (paleta, fontes, estilo), exibir um overlay/card bloqueando o botao "Nova Criacao Mensal" com mensagem: "Preencha a Identidade Visual antes de gerar artes."

**Identidade Visual aprimorada**: Adicionar campos na secao:
- Logo (upload para bucket)
- Cores primarias e secundarias (inputs de cor)
- Fontes (texto livre)
- Links de referencia visual (URLs de perfis/sites inspiradores)
- Banco de imagens (upload multiplo)

**Persistencia**: Salvar identidade visual na tabela `marketing_strategies` (campo JSONB `visual_identity`) ou criar tabela separada `marketing_visual_identities`.

**Calendario de postagens**: Renomear a aba "Calendario" para "Calendario de Postagens". Mostrar mes a mes as artes ja criadas/aprovadas em formato de calendario visual.

**Saldo de artes claro**: Exibir card fixo no topo com:
```text
Artes do mes: 3/8 usadas | Plano Growth
[Recarregar Artes] [Ver Planos]
```

---

### 5. Melhoria Drastica nos Prompts de Geracao de Artes

**Arquivo**: `supabase/functions/generate-social-image/index.ts`

O problema atual e que os prompts sao genericos demais. A correcao:

1. **Injetar identidade visual completa** no prompt (cores HEX exatas, estilo, tom, referencias)
2. **Ser mais especifico no estilo**: ao inves de "Modern design", usar "Flat design with geometric shapes, color blocks using #E63946 and #1D3557, negative space, no gradients"
3. **Adicionar exemplos de composicao**: "Layout similar to Apple advertising: minimal elements, single focal point, vast negative space"
4. **Separar tipos de arte**: produto, servico, promocao, institucional — cada um com template de prompt diferente
5. **Usar o tipo de post** para definir composicao (ex: produto = foto clean com fundo solido; promocao = bold com destaque de preco)

Novo formato do prompt:
```text
STYLE: [estilo da identidade] (ex: Minimalist flat design)
COLORS: Use ONLY these colors: [paleta HEX]
COMPOSITION: [regras de composicao por tipo]
MOOD: [tom visual da marca]
SUBJECT: [descricao do visual brief]
FORMAT: [feed 1:1 ou story 9:16]

ABSOLUTE RULES:
- NO text, letters, numbers or watermarks
- Use ONLY the specified color palette
- Maintain consistent visual style across all generated images
- Leave 25% clear space for text overlay
```

6. **Nivel de qualidade** mais detalhado com instrucoes de iluminacao, textura e profundidade

---

### 6. Tabela de Identidade Visual Persistente

**Migracao SQL**:
```sql
CREATE TABLE public.marketing_visual_identities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) UNIQUE,
  palette JSONB DEFAULT '[]',
  fonts JSONB DEFAULT '[]',
  style TEXT,
  tone TEXT,
  logo_url TEXT,
  reference_links JSONB DEFAULT '[]',
  image_bank_urls JSONB DEFAULT '[]',
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.marketing_visual_identities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Membros da org podem ler identidade"
  ON public.marketing_visual_identities FOR SELECT
  USING (is_member_of_org(auth.uid(), organization_id));

CREATE POLICY "Membros da org podem inserir identidade"
  ON public.marketing_visual_identities FOR INSERT
  WITH CHECK (is_member_of_org(auth.uid(), organization_id));

CREATE POLICY "Membros da org podem atualizar identidade"
  ON public.marketing_visual_identities FOR UPDATE
  USING (is_member_of_org(auth.uid(), organization_id));
```

---

### Resumo de Arquivos

| Arquivo | Tipo | Descricao |
|---------|------|-----------|
| Migracao SQL (2 tabelas) | Novo | `marketing_strategies` + `marketing_visual_identities` |
| `src/hooks/useMarketingStrategy.ts` | Novo | Hook para estrategia ativa e historico |
| `src/hooks/useVisualIdentity.ts` | Novo | Hook para identidade visual persistente |
| `src/components/HelpTooltip.tsx` | Novo | Componente de tooltip de duvida |
| `src/pages/cliente/ClientePlanoMarketing.tsx` | Editar | Persistencia, historico, tooltips |
| `src/pages/cliente/ClienteConteudos.tsx` | Editar | Multi-objetivo, anexos, puxar estrategia, tooltips |
| `src/pages/cliente/ClienteRedesSociais.tsx` | Editar | Identidade obrigatoria, calendario postagens, saldo claro, tooltips |
| `supabase/functions/generate-social-image/index.ts` | Editar | Prompts drasticamente melhores |
| `supabase/functions/generate-content/index.ts` | Editar | Receber estrategia e multi-objetivos |

### Ordem de Implementacao

1. Migracoes SQL (tabelas + RLS)
2. Hooks novos (useMarketingStrategy, useVisualIdentity)
3. HelpTooltip componente
4. Estrategia (persistencia + historico)
5. Identidade Visual (persistencia + campos aprimorados)
6. Redes Sociais (bloqueio, calendario, saldo, prompts)
7. Conteudos (multi-objetivo, anexos, contexto da estrategia)
8. Edge functions (prompts melhorados)

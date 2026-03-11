

## Plano: Ajustes 7 e 8 — IA Dinâmica no Plano de Vendas + Correção da Estratégia de Marketing

---

### Resumo

Três frentes principais:
1. **Plano de Vendas**: Melhorar perguntas (recorrência, etapas de funil abertas) + criar funil CRM automático + gerar scripts iniciais
2. **Estratégia de Marketing**: Corrigir erro de geração + incluir plano de vendas como contexto na IA
3. **Base de conhecimento unificada**: Sales Plan + Marketing Strategy alimentam todas as ferramentas

---

### 1. Perguntas do Plano de Vendas — Melhoria

**Arquivo:** `src/components/cliente/briefingAgents.ts` (RAFAEL_STEPS)

**1a. Pergunta de recorrência** (linha ~432)
- Substituir `receita_novos` (select fechado com 4 opções de percentual) por duas perguntas mais didáticas:
  - `tem_recorrencia` (select): "Você tem clientes que compram mais de uma vez?" → Sim/Não/Parcialmente
  - `ciclo_recompra` (textarea): "Qual o ciclo médio de recompra dos seus clientes? Descreva como funciona a fidelização." → campo aberto

**1b. Etapas do funil** (linha ~524)
- Mudar `etapas_funil` de `multi-select` com opções fixas para `textarea` com placeholder sugestivo
- Nova mensagem: "Descreva as etapas do seu processo de vendas, da prospecção ao fechamento. Pode ser como quiser!"
- Placeholder: "Ex: Prospecção → Qualificação → Reunião → Proposta → Negociação → Fechamento"
- O scoring de `computeScores` em `ClientePlanoVendas.tsx` precisa ser ajustado para aceitar texto (contar etapas separadas por →, vírgula ou quebra de linha)

**Arquivos:** `src/components/cliente/briefingAgents.ts`, `src/pages/cliente/ClientePlanoVendas.tsx` (scoring)

---

### 2. Criação Automática do Primeiro Funil CRM

**Arquivo:** `src/pages/cliente/ClientePlanoVendas.tsx` (handleChatComplete)

Ao salvar o plano de vendas:
1. Verificar se a org já tem funis CRM via `useCrmFunnels`
2. Se não tem, parsear as etapas do campo `etapas_funil` (texto livre)
3. Criar automaticamente o primeiro funil com nome "Funil Principal" e as etapas parseadas como `stages`
4. Usar `useCrmFunnelMutations().createFunnel`

Lógica de parsing:
```text
Input: "Prospecção → Qualificação → Reunião → Proposta → Fechamento"
Output: [
  { id: "1", name: "Prospecção", color: "#8b5cf6" },
  { id: "2", name: "Qualificação", color: "#0ea5e9" },
  ...
]
```

---

### 3. Scripts Iniciais Baseados no Plano

**Arquivo:** `src/pages/cliente/ClientePlanoVendas.tsx`

Após salvar o plano de vendas com sucesso:
1. Chamar a edge function `generate-script` com contexto do plano (produtos, diferenciais, dor_principal, etapas do funil)
2. Gerar 2-3 scripts automáticos: Prospecção, Qualificação, Fechamento
3. Os scripts são salvos na tabela `client_scripts` via o hook existente

Isso acontece como ação de background — o usuário vê uma notificação "3 scripts de exemplo foram criados".

---

### 4. Correção da Geração de Estratégia de Marketing

**Arquivo:** `supabase/functions/generate-strategy/index.ts`

**Problemas identificados:**
- A function usa `tool_choice` com `type: "function"` — alguns modelos Gemini retornam o resultado em `message.content` em vez de `tool_calls`. Precisa de fallback para parsear JSON do content.
- Não há log de erro detalhado quando o tool call falha
- Falta tratamento de timeout (a requisição pode ser longa)

**Correções:**
1. Adicionar fallback: se `tool_calls` é vazio, tentar parsear `message.content` como JSON
2. Adicionar log detalhado do response completo quando falha
3. Melhorar mensagens de erro no frontend (402/429/500) com toasts mais claros

---

### 5. Base de Conhecimento Unificada — Sales Plan como Contexto

**Arquivo:** `supabase/functions/generate-strategy/index.ts`

Ao gerar a estratégia de marketing, incluir o plano de vendas como contexto:
1. Buscar `sales_plans` da organização no edge function
2. Incluir as respostas do plano de vendas no prompt como contexto adicional
3. Isso dá à IA conhecimento sobre: produtos, diferenciais, equipe, canais, funil, dores do cliente

**Arquivo:** `src/hooks/useStrategyData.ts`

Expandir o hook para também expor dados do plano de vendas:
- Importar `useSalesPlan`
- Retornar `salesPlanAnswers` e `hasSalesPlan`
- Ferramentas downstream (conteúdos, scripts, tráfego) já consomem `useStrategyData` e automaticamente terão acesso ao contexto unificado

**Arquivo:** Edge functions que usam contexto (generate-content, generate-script, generate-traffic-strategy, generate-social-concepts):
- Buscar `sales_plans.answers` no início da function
- Incluir no prompt como "CONTEXTO DO PLANO DE VENDAS"

---

### Ordem de Execução

1. Atualizar perguntas do RAFAEL_STEPS (recorrência + funil aberto)
2. Ajustar scoring no ClientePlanoVendas para aceitar texto
3. Implementar criação automática de funil CRM no handleChatComplete
4. Corrigir fallback de tool_calls no generate-strategy
5. Incluir sales_plan como contexto no generate-strategy
6. Expandir useStrategyData com dados do plano de vendas
7. Gerar scripts iniciais após conclusão do plano


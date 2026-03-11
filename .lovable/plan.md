

## Ajustes do SaaS — Plano de Implementação

Este plano cobre os 8 pontos levantados, organizados por prioridade.

---

### 1. Nome "Allure" no Onboarding de Empresa

**Causa:** No signup por email, o sistema usa `fullName + "'s Company"` como nome da org (linha 117, SaasAuth.tsx). No signup por Google, o `signup-saas` recebe `company_name` do metadata do Google. Se o navegador tem autocomplete ativo, pode preencher o campo `fullName` com dados salvos — "Allure" vem do autocomplete do seu navegador, não é um padrão do sistema.

**Correção:** No `ClienteOnboardingCompany.tsx`, o campo "Nome da empresa" vem pré-preenchido do `org.name` (que é `"Allure's Company"` ou similar). O campo já é editável, mas para evitar confusão, vamos limpar o nome padrão se ele contiver "'s Company", mostrando o campo vazio para forçar o preenchimento.

**Arquivo:** `src/pages/cliente/ClienteOnboardingCompany.tsx`

---

### 2. Comunicados de Teste na Conta Nova do SaaS

**Causa:** A RPC `get_announcements_with_parent` retorna comunicados da org pai (franqueadora `4206c8f4`), que tem 6 comunicados de teste ativos. Qualquer cliente SaaS vinculado a essa org vê esses comunicados.

**Correção:** Deletar os 6 comunicados de teste do banco de dados (IDs: `596a2263`, `7176a78b`, `5c5e848f`, `932c1196`, `b6620367`, `63030e82`) via ferramenta de dados.

**Ação:** DELETE dos registros diretamente.

---

### 3. HelpTooltip (?) sobrepostos/escondidos atrás do sidebar

**Causa:** O `TooltipContent` usa `side="top"` e pode ficar atrás de elementos com `z-index` alto (sidebar, headers). O componente não tem `z-index` explícito e não usa `portal`.

**Correção:** Adicionar `className="z-[100]"` e `sideOffset={8}` ao `TooltipContent` do `HelpTooltip.tsx`. Também considerar usar `side="right"` como fallback com `avoidCollisions`. Além disso, o Radix Tooltip já renderiza via portal, então o problema real é que o `z-index` é insuficiente.

**Arquivo:** `src/components/HelpTooltip.tsx`

---

### 4. Perguntas do Plano de Vendas — IA dinâmica + Funil automático + Scripts iniciais

**Escopo grande — dividido em sub-tarefas:**

**4a. Pergunta de recorrência melhorada:** Substituir a pergunta `receita_novos` (percentual novos vs recorrente) por perguntas mais úteis: "Você tem clientes recorrentes?", "Qual o ciclo de recompra?", "Qual % da receita vem de clientes que já compraram?". Formato mais didático com texto aberto.

**4b. Etapas do funil — campo aberto + criação automática do primeiro funil CRM:** Mudar a pergunta `etapas_funil` de multi-choice para um campo híbrido: sugestões pré-definidas + campo aberto para o usuário digitar suas próprias etapas. Ao salvar o plano de vendas, se o usuário não tem funil CRM, criar automaticamente o primeiro funil com as etapas definidas.

**4c. Scripts iniciais baseados no plano:** Após conclusão do plano de vendas, gerar automaticamente 2-3 scripts de exemplo (prospecção, qualificação, fechamento) usando os dados do plano como contexto.

**Arquivos:** `src/pages/cliente/ClientePlanoVendas.tsx`, `src/components/cliente/briefingAgents.ts`, `src/hooks/useSalesPlan.ts`, `src/hooks/useCrmFunnels.ts`

---

### 5. Projeções de Leads e Receita — Comparativo dinâmico

**Problema atual:** Os gráficos mostram "Sem Estratégia" e "Com Estratégia" em gráficos separados lado a lado, sem comparativo direto nem destaque visual.

**Correção:** Unificar em um único gráfico de área com ambas as linhas sobrepostas + cards de resumo com deltas ("+120% leads", "+R$45k receita"). Adicionar indicadores de diferença absoluta e percentual entre cenários.

**Arquivo:** `src/pages/cliente/ClientePlanoVendas.tsx` (seção de projeções, linhas 973-1045)

---

### 6. Contatos — Filtros e criação direta de lead

**6a. Filtros:** Já existem filtros por tag, origem, datas, empresa, cargo e vinculação a leads. Falta o filtro por "responsável" (quem adicionou). Adicionar filtro por `created_by` ou campo similar.

**6b. Criar lead direto do contato:** Atualmente `onCreateLeadFromContact` apenas navega para a aba pipeline e abre o dialog genérico. Corrigir para já preencher automaticamente os dados do contato (nome, telefone, email, empresa) e criar o lead diretamente com `contact_id` vinculado, sem abrir o dialog vazio.

**Arquivos:** `src/components/crm/CrmContactsView.tsx`, `src/pages/cliente/ClienteCRM.tsx`, `src/components/crm/CrmNewLeadDialog.tsx`

---

### 7. Relatórios de Vendas — Exportação PDF/Excel

Adicionar botões de exportação na aba de Metas/Relatórios do Plano de Vendas:
- **PDF visual:** Usar `html2pdf.js` (já instalado) para gerar relatório formatado
- **Excel:** Gerar CSV com dados tabulares dos leads, conversões e metas

**Arquivo:** `src/pages/cliente/ClientePlanoVendas.tsx` (aba metas)

---

### 8. Estratégia de Marketing — Erro na geração + IA dinâmica

**8a. Erro na geração:** Verificar logs do edge function `generate-strategy`. Possíveis causas: créditos insuficientes (402), rate limit (429), ou falha no parsing do tool call. Melhorar mensagens de erro no frontend.

**8b. Perguntas dinâmicas com IA:** Similar ao plano de vendas, as perguntas da estratégia de marketing devem ser conduzidas por IA conversacional, adaptando-se às respostas. Isso já está parcialmente implementado no padrão `ChatBriefing`. Aplicar o mesmo padrão ao fluxo de estratégia de marketing.

**8c. Base de conhecimento unificada:** A estratégia + plano de vendas devem alimentar todas as ferramentas subsequentes (conteúdos, postagens, sites, tráfego) como contexto. Isso já funciona parcialmente via `strategy_id` — garantir que o plano de vendas também seja incluído como contexto nos prompts de IA.

**Arquivos:** `supabase/functions/generate-strategy/index.ts`, páginas de marketing, hooks de estratégia

---

### Ordem de Execução

1. Limpar comunicados de teste (dados)
2. Corrigir HelpTooltip z-index
3. Corrigir nome "Allure" no onboarding
4. Criar lead direto do contato
5. Projeções comparativas unificadas
6. Exportação PDF/Excel dos relatórios
7. Melhorar perguntas do plano de vendas + funil automático
8. Corrigir erro da estratégia de marketing + base de conhecimento


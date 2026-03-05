

# Reestruturação Completa da Ferramenta de Estratégia de Marketing

## Visão

A Estratégia é a **base central** do sistema. Objetivo: coletar informações do negócio → gerar estratégia completa via IA → apresentar de forma visual e dinâmica → criar links diretos para aplicar cada parte nas ferramentas (Conteúdos, Artes, Scripts, Tráfego, CRM). A estratégia é **mensal** mas não obrigatória — o sistema controla quando foi a última geração e sugere renovação.

## Problemas Atuais

1. **Botão "Regenerar" some após aprovação** — não há como criar nova estratégia
2. **`useStrategyData` existe mas NÃO é importado por nenhuma ferramenta** — zero integração real
3. **Apresentação estática** — tabs sem CTAs claros vinculando às ferramentas
4. **Sem controle temporal** — não mostra quando foi gerada, não sugere renovação mensal
5. **Sem fluxo de "aplicar"** — o usuário vê a estratégia mas não sabe o próximo passo

## Plano de Implementação

### 1. Controle temporal e regeneração (`ClientePlanoMarketing.tsx`)

- Adicionar botão **"Nova Estratégia"** visível **sempre** (inclusive após aprovação), com confirmação de que vai desativar a atual
- Mostrar **badge com data da última geração** e um alerta suave quando passaram 30+ dias ("Sua estratégia tem X dias. Considere atualizar!")
- Manter contador de gerações e histórico

### 2. Dashboard visual com CTAs de ação (`ClientePlanoMarketing.tsx`)

Reestruturar o `StrategyDashboard` para que cada seção tenha **CTAs diretos** para aplicar na ferramenta correspondente:

| Seção | CTA |
|---|---|
| Tom de Voz / Persona | → "Gerar Scripts com esse tom" (link `/cliente/scripts`) |
| Pilares de Conteúdo | → "Criar Conteúdo" (link `/cliente/conteudos`) |
| Calendário Editorial | → "Criar Arte para esse dia" (link `/cliente/redes-sociais`) |
| Estratégia de Tráfego | → "Configurar Tráfego Pago" (link `/cliente/trafego-pago`) |
| Funil de Aquisição | → "Abrir CRM" (link `/cliente/crm`) |
| Ideias de Conteúdo | Cada ideia com botão "Gerar" que leva à ferramenta com o tema pré-preenchido |

Adicionar um **card de "Próximos Passos"** no topo do dashboard com as 3 ações prioritárias baseadas no `plano_execucao[0]` (mês 1).

### 3. Integrar `useStrategyData` nas ferramentas

Conectar o hook nas 4 ferramentas principais para que consumam dados da estratégia aprovada:

| Ferramenta | Arquivo | Dado consumido |
|---|---|---|
| Conteúdos | `ClienteConteudos.tsx` | Pilares, ICP, tom de voz → injetar no prompt de geração |
| Redes Sociais (Artes) | `ClienteRedesSociais.tsx` | Tom, persona, estilo visual → preencher campos sugeridos |
| Scripts | `ClienteScripts.tsx` | ICP (dores, objeções, gatilhos), proposta de valor |
| Tráfego Pago | `ClienteTrafegoPago.tsx` | Canais prioritários, funil, público-alvo |

Em cada ferramenta, mostrar um **banner contextual** quando há estratégia ativa: "Dados da sua estratégia estão sendo usados para personalizar esta ferramenta ✓"

### 4. Melhorias visuais no dashboard

- **Card hero** no topo com score animado + data da geração + badge de status + botão "Nova Estratégia"
- Substituir badge "Estratégia aprovada" isolada por uma **barra de ações** completa
- Cada tab com **animações de entrada** nos cards (já tem parcialmente, padronizar)
- Na tab "Execução", marcar visualmente os passos já executados (se o usuário já usou a ferramenta correspondente)

## Arquivos Modificados

| Arquivo | Mudança |
|---|---|
| `src/pages/cliente/ClientePlanoMarketing.tsx` | Adicionar botão "Nova Estratégia" sempre visível, alerta de 30+ dias, CTAs em cada tab, card de próximos passos |
| `src/hooks/useStrategyData.ts` | Sem mudanças — já está pronto |
| `src/pages/cliente/ClienteConteudos.tsx` | Importar `useStrategyData`, injetar contexto no prompt |
| `src/pages/cliente/ClienteRedesSociais.tsx` | Importar `useStrategyData`, sugerir campos baseados na estratégia |
| `src/pages/cliente/ClienteScripts.tsx` | Importar `useStrategyData`, usar ICP e proposta de valor |
| `src/pages/cliente/ClienteTrafegoPago.tsx` | Importar `useStrategyData`, usar canais e funil |


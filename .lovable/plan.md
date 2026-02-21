

# Rebrand para NOEXCUSE Gestao Comercial + Refresh UX/UI inspirado no Kivo Sales Compass

## Resumo

Renomear a plataforma do cliente final para "NOEXCUSE Gestao Comercial" em todos os pontos de contato e aplicar melhorias de UX/UI inspiradas nos padroes do projeto [Kivo Sales Compass](/projects/4b336cff-125b-45ed-9bee-c56939c50db5), incluindo: sidebar com secoes colapsaveis (Collapsible), header de logo mais expressivo, StatsCards com skeleton loading, CRM com Kanban drag-and-drop real, Checklist com botoes de acao, e Quick Actions no dashboard.

---

## 1. Rebrand -- NOEXCUSE Gestao Comercial

Todos os pontos onde aparece "SaaS NoExcuse" ou "Empresa Demo" serao atualizados:

| Arquivo | De | Para |
|---------|-----|------|
| `ClienteSidebar.tsx` | "SaaS NoExcuse" | "NOEXCUSE" + subtitulo "Gestao Comercial" |
| `ClienteInicio.tsx` | "SaaS NoExcuse" no subtitle | "NOEXCUSE Gestao Comercial" |
| `TopSwitch.tsx` | "CLIENTE FINAL" | "CLIENTE FINAL" (manter -- e o label do switch) |
| `index.html` | "Lovable App" | "NOEXCUSE Gestao Comercial" |

---

## 2. Sidebar Redesenhada (inspirada no Kivo)

Atualmente a sidebar e uma lista plana com secoes separadas por label. O Kivo usa Collapsible com chevrons para abrir/fechar cada secao.

Mudancas:
- Adicionar Collapsible em cada secao (Vendas, Marketing) com chevron de abrir/fechar
- Secao Global (Principal) permanece sempre aberta
- Header da sidebar: logo quadrado com "N" + "NOEXCUSE" + "Gestao Comercial" (como o Kivo faz com "K" + "KIVO" + "Copiloto de Vendas")
- Footer: barra de creditos/plano similar ao Kivo (barra de progresso de uso)
- Secao Sistema adicionada na base: Integracoes, Plano e Creditos, Configuracoes

---

## 3. Dashboard (ClienteInicio) -- UX melhorada

Inspiracoes do Kivo Dashboard:
- Saudacao com nome + emoji e contagem de tarefas pendentes no subtitulo
- StatsCards com icone posicionado no canto superior direito (como o Kivo StatsCard)
- Quick Actions section no final: 4 botoes grandes (Abrir Chat, Novo Lead, Ver Relatorios, Plano de Vendas)
- Metas do Mes: card lateral com barras de progresso (Vendas, Leads Qualificados, Conversao) -- inspirado no MonthlyGoals do Kivo

---

## 4. CRM -- Kanban com Drag-and-Drop

O CRM atual usa cards estaticos sem drag. O Kivo usa `@dnd-kit/core` + `@dnd-kit/sortable` que ja estao instalados neste projeto.

Mudancas:
- Implementar DndContext + useDroppable nas colunas
- Implementar useSortable nos LeadCards
- DragOverlay com rotacao sutil (como o Kivo: `rotate-3 scale-105`)
- Header de cada coluna com bolinha colorida + contagem + valor total da coluna
- Toggle Kanban/Lista (como o Kivo LeadFilters)
- Barra de busca para filtrar leads
- Empty state: "Arraste leads aqui"

---

## 5. Checklist -- Interacao melhorada

Inspirado no DailyChecklist do Kivo:
- Icones de prioridade (AlertCircle vermelho para alta, Clock amarelo para media)
- Icone CheckCircle2 verde para concluidas
- Botao "Fazer" em cada tarefa pendente (ao inves de apenas checkbox)
- Empty state com icone grande e mensagem positiva

---

## 6. Secao Adicional no Sidebar -- Sistema

Adicionar 3 itens na base da sidebar (como o Kivo):
- Integracoes (icon: Link)
- Plano e Creditos (icon: CreditCard)
- Configuracoes (icon: Settings)

Essas paginas serao placeholders por enquanto.

---

## Secao Tecnica

### Arquivos modificados

```
src/components/ClienteSidebar.tsx       -- Redesenhar com Collapsible, logo expressivo, footer com creditos
src/pages/cliente/ClienteInicio.tsx     -- QuickActions, MonthlyGoals, StatsCards melhorados
src/pages/cliente/ClienteCRM.tsx        -- DnD Kanban com @dnd-kit, filtros, toggle kanban/lista
src/pages/cliente/ClienteChecklist.tsx  -- Icones de prioridade, botao "Fazer", empty state
index.html                              -- Titulo NOEXCUSE Gestao Comercial
```

### Arquivos criados

```
src/pages/cliente/ClienteIntegracoes.tsx    -- Placeholder
src/pages/cliente/ClientePlanoCreditos.tsx   -- Placeholder
src/pages/cliente/ClienteConfiguracoes.tsx   -- Placeholder
```

### Atualizacao de rotas (App.tsx)

Adicionar 3 novas rotas:
- `/cliente/integracoes`
- `/cliente/plano-creditos`
- `/cliente/configuracoes`

### Dependencias

Nenhuma nova -- `@dnd-kit/core` e `@dnd-kit/sortable` ja estao instalados.

### Ordem de implementacao

1. Rebrand: `index.html`, `ClienteSidebar.tsx` (logo + nome + Collapsible + footer + secao Sistema)
2. Dashboard: `ClienteInicio.tsx` (QuickActions, MonthlyGoals, StatsCards)
3. CRM: `ClienteCRM.tsx` (DnD Kanban completo)
4. Checklist: `ClienteChecklist.tsx` (UX melhorada)
5. Rotas: `App.tsx` (3 novas rotas) + 3 paginas placeholder

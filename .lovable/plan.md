

## Plano: 3 Correções no CRM

### 1. Contatos → Leads com seleção de funil e etapa

**Problema**: Ao selecionar contatos e clicar "Criar Leads", a ação atual apenas abre o dialog de novo lead (sem funil/etapa) ou chama `onCreateLeadFromContact` por contato sem criar leads de fato no banco.

**Solução**: Ao clicar "Criar Leads" em massa (bulk), abrir um **dialog intermediário** que permite:
- Selecionar o funil de destino
- Selecionar a etapa inicial
- Confirmar a criação

O dialog mostrará quantos contatos serão convertidos e criará todos via `createLead.mutate()` com o `funnel_id` e `stage` escolhidos.

**Arquivos**:
- `src/components/crm/CrmContactsView.tsx` — adicionar dialog de seleção de funil/etapa no bulk action; remover dependência de `onCreateLeadFromContact` para bulk e usar `useCrmLeadMutations` + `useCrmFunnels` diretamente
- Para o botão individual (menu de contexto), também abrir o mesmo dialog com 1 contato

### 2. Paginação de 25 em 25 nos contatos

**Problema**: A lista de contatos renderiza todos de uma vez.

**Solução**: Adicionar paginação client-side de 25 por página na lista de contatos.

**Arquivo**: `src/components/crm/CrmContactsView.tsx`
- Adicionar estado `page` (começa em 0)
- Fatiar `filtered` em `filtered.slice(page * 25, (page + 1) * 25)`
- Controles de navegação (Anterior/Próximo) no rodapé da tabela
- Resetar página ao mudar filtros/busca

### 3. Scroll independente por etapa no Kanban

**Problema**: Cada coluna do kanban se expande verticalmente sem limite, empurrando a página.

**Solução**: Limitar a altura da área de cards de cada coluna e adicionar scroll vertical independente.

**Arquivo**: `src/pages/cliente/ClienteCRM.tsx`
- No container de cada coluna (onde fica o `DroppableColumn`), adicionar `max-h-[calc(100vh-280px)] overflow-y-auto` para criar scroll independente por coluna
- Manter o scroll horizontal existente entre colunas

### Resumo de mudanças

| Arquivo | Mudança |
|---------|---------|
| `src/components/crm/CrmContactsView.tsx` | Dialog de funil/etapa para criar leads em massa + paginação 25/página |
| `src/pages/cliente/ClienteCRM.tsx` | Scroll vertical independente por coluna do kanban |
| `src/pages/CrmExpansao.tsx` | Mesma correção de scroll no kanban (se usar o mesmo componente) |
| `src/pages/franqueado/FranqueadoCRM.tsx` | Mesma correção de scroll |




# Arquitetura de Aprovação Unificada — Conteúdos, Redes Sociais e Sites

## Diagnóstico Atual

Hoje cada ferramenta trata aprovações de forma isolada e inconsistente:

| Ferramenta | Status possíveis | Onde vê pendentes? | Aprovação em lote? | Filtro por status? |
|---|---|---|---|---|
| **Conteúdos** | `pending` / `approved` | Aba "Meus Conteúdos" (sem destaque) | Sim (com custo de créditos) | Sim (filtro simples) |
| **Redes Sociais** | `pending` / `approved` | Galeria com filtro | Não | Sim |
| **Sites** | `Rascunho` / `Aprovado` / `Publicado` | Lista simples | Não | Não |

**Problemas identificados:**
- Não existe visão consolidada de "o que preciso aprovar"
- Status inconsistentes entre ferramentas (`pending` vs `Rascunho`)
- Não há painel de progresso cross-tool
- Falta feedback visual claro de itens pendentes vs aprovados
- Sites não usa o `ApprovalPanel` de forma integrada na listagem

---

## Proposta: Central de Aprovações + Melhorias por Ferramenta

### 1. Dashboard de Aprovação (novo componente)

Um card/seção na Home ou como header compartilhado nas ferramentas de marketing, mostrando:

```text
┌─────────────────────────────────────────────────┐
│  📋 Central de Aprovações                       │
│                                                 │
│  Conteúdos    ██████░░░░  6 pendentes / 2 ok    │
│  Artes        ████░░░░░░  4 pendentes / 9 ok    │
│  Sites        █░░░░░░░░░  1 pendente  / 0 ok    │
│                                                 │
│  [Aprovar Pendentes]    Total: 11 pendentes     │
└─────────────────────────────────────────────────┘
```

- Componente `ApprovalDashboard.tsx` reutilizável
- Puxa dados de `client_content`, `client_posts` e `client_sites` com contadores
- Links diretos para cada ferramenta filtrada por "pendentes"

### 2. Melhorias em Conteúdos

- Adicionar contadores visuais no header da aba "Meus Conteúdos" (`3 pendentes · 5 aprovados`)
- Badge de status colorido em cada card do `BatchFolderView` (verde=aprovado, amarelo=pendente)
- Botão "Aprovar" inline em cada card pendente na listagem (hoje só aparece na tela de resultado)
- Filtro padrão abrir em "pendentes primeiro"

### 3. Melhorias em Redes Sociais

- Adicionar contadores no header da `PostGallery` (`4 pendentes · 9 aprovados`)
- Aprovação em lote: checkbox de seleção + botão "Aprovar Selecionados"
- Badge de status mais proeminente no `PostCard` (hoje é discreto)
- Ordenação padrão: pendentes primeiro

### 4. Melhorias em Sites

- Normalizar status para lowercase (`pending` / `approved` / `published`)
- Adicionar `ApprovalPanel` integrado na listagem do `SiteHistory`
- Badge visual de status com cores consistentes
- Filtro por status na lista de sites

### 5. Padronização Visual

- Status badges unificados usando `ApprovalStatusBadge` (já existe) em todas as ferramentas
- Cores consistentes: verde=aprovado, amarelo=pendente, azul=publicado
- Componente `ApprovalCountBar` compartilhado (barra de progresso mini)

---

## Arquivos Afetados

| Arquivo | Ação |
|---|---|
| `src/components/cliente/ApprovalDashboard.tsx` | **Novo** — Painel consolidado |
| `src/components/cliente/ApprovalCountBar.tsx` | **Novo** — Barra de contagem reutilizável |
| `src/components/cliente/content/BatchFolderView.tsx` | Editar — Adicionar aprovação inline + badges |
| `src/components/cliente/social/PostGallery.tsx` | Editar — Aprovação em lote + contadores |
| `src/components/sites/SiteHistory.tsx` | Editar — Status badges + filtro |
| `src/pages/cliente/ClienteConteudos.tsx` | Editar — Integrar ApprovalDashboard |
| `src/pages/cliente/ClienteRedesSociais.tsx` | Editar — Integrar ApprovalDashboard |
| `src/pages/cliente/ClienteSites.tsx` | Editar — Normalizar status + integrar painel |
| `src/hooks/useApprovalStats.ts` | **Novo** — Hook que agrega contadores das 3 tabelas |

---

## Detalhes Técnicos

- O hook `useApprovalStats` faz 3 queries paralelas com `select("id, status", { count: "exact", head: true })` para performance
- Nenhuma mudança de schema necessária — os campos `status` já existem
- A normalização de status em Sites será feita no frontend (mapear "Rascunho" para "pending", "Aprovado" para "approved")
- Aprovação em lote de posts reutiliza o padrão já implementado em conteúdos


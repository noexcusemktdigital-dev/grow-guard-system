

## Plano: Corrigir Comunicados + Melhorar Dashboards (Franqueadora e Franqueado)

### Problema 1: Comunicados não aparecem para Franqueado e Cliente

**Causa raiz**: Incompatibilidade de valores entre a criação (Franqueadora) e a leitura (Franqueado).
- A Franqueadora salva `priority` como `"Normal"`, `"Alta"`, `"Crítica"` e `type` como `"Informativo"`, `"Urgente"`, etc.
- O `FranqueadoComunicados.tsx` filtra por `priority === "critical"` (inglês, minúsculo) — nunca vai encontrar nada.
- A RPC `get_announcements_with_parent` funciona corretamente (retorna anúncios da org + parent), mas **não filtra por `published_at`**, então rascunhos também aparecem.
- O cliente final **não tem página de comunicados** nem rota para isso.

**Correções**:

1. **`FranqueadoComunicados.tsx`** — Ajustar os labels/filtros de prioridade para usar os valores reais em português (`"Normal"`, `"Alta"`, `"Crítica"`) e tipos (`"Informativo"`, etc.) que a Franqueadora salva no banco.

2. **`get_announcements_with_parent` (RPC)** — Adicionar filtro `WHERE published_at IS NOT NULL` para excluir rascunhos da visualização de unidades filhas.

3. **Criar página `ClienteComunicados`** — Reutilizar a mesma lógica do `FranqueadoComunicados` (read-only, com confirmação de leitura para críticos), registrar rota `/cliente/comunicados` no `App.tsx` e adicionar link no sidebar do cliente.

---

### Problema 2: Dashboards não entregam valor

**Dashboard Franqueadora (`Home.tsx`)** — Melhorias:
- Adicionar **KPIs numéricos** no topo (Total Unidades, Leads Rede, Contratos Ativos, Chamados Abertos) com cards visuais
- Substituir o card "Ações Pendentes" vazio por um **resumo inteligente** tipo "Hoje eu preciso de..." com as 3 prioridades mais urgentes da rede
- Melhorar o card de **Visão Comercial** com mini-gráfico de tendência (últimos 6 meses) usando Recharts
- Adicionar widget de **Unidades que precisam de atenção** (unidades com leads parados, sem atividade, ou com chamados urgentes)

**Dashboard Franqueado (`FranqueadoDashboard.tsx`)** — Melhorias:
- Adicionar **alertas inteligentes** no topo (leads sem contato, comunicados pendentes de confirmação, chamados abertos)
- Incluir **Mensagem do Dia** da matriz (já consome via hook mas mostra só no hero, pode ter destaque maior)
- Adicionar widget de **Metas** com progresso visual (barra/anel) das metas herdadas da matriz
- Incluir **Comunicados não lidos** com badge de contagem e destaque para críticos

---

### Arquivos alterados

| Arquivo | Ação |
|---------|------|
| `src/pages/franqueado/FranqueadoComunicados.tsx` | Corrigir labels de prioridade/tipo (pt-BR) |
| `src/pages/cliente/ClienteComunicados.tsx` | Criar (read-only, com confirmação) |
| `src/App.tsx` | Adicionar rota `/cliente/comunicados` |
| `src/components/ClienteSidebar.tsx` | Adicionar link Comunicados |
| `src/pages/Home.tsx` | Redesenhar com KPIs, resumo inteligente, unidades que precisam de atenção |
| `src/pages/franqueado/FranqueadoDashboard.tsx` | Adicionar alertas, metas, comunicados não lidos |
| Migration SQL | Atualizar RPC `get_announcements_with_parent` para filtrar `published_at IS NOT NULL` |


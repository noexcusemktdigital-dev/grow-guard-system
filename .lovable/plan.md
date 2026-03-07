

## Plano: Otimização Final — Início, Agenda, Comunicados e Atendimento/Suporte

### Escopo

Padronizar e finalizar 4 módulos em ambos os portais (Franqueadora + Franqueado), garantindo usabilidade real, layout consistente e integração funcional.

---

### 1. Início (Dashboard → renomear para "Início")

**Mudanças comuns:**
- Sidebar Franqueadora: `"Dashboard"` → `"Início"`, path `/franqueadora/dashboard` → `/franqueadora/inicio`
- Sidebar Franqueado: `"Dashboard"` → `"Início"`, path `/franqueado/dashboard` → `/franqueado/inicio`
- Rotas no `App.tsx`: atualizar paths e redirects
- Ambos terão o mesmo layout base (Hero com saudação + Mensagem do Dia inline, KPIs, Smart Alerts, Visão Comercial, Metas, Agenda, Comunicados)

**Franqueadora — "Início":**
- Hero Section com saudação + Mensagem do Dia (igual ao franqueado, que já tem esse formato)
- KPIs: Unidades, Leads da Rede, Contratos Ativos, Chamados Abertos, Clientes SaaS Ativos
- Smart Alerts (chamados urgentes, comunicados críticos, leads parados)
- Cards: Visão Comercial, Metas da Rede, Performance SaaS, Próximos Eventos, Comunicados Recentes
- O layout será alinhado visualmente ao do Franqueado (que já está mais polido com Hero gradient)

**Franqueado — "Início" (já se chama Dashboard):**
- Manter o layout atual (já está bom) — apenas renomear na sidebar e nas rotas
- Garantir que Smart Alerts, KPIs e cards mantêm paridade visual com a Franqueadora

**Arquivos alterados:**
- `src/components/FranqueadoraSidebar.tsx` — renomear label e path
- `src/components/FranqueadoSidebar.tsx` — renomear label e path
- `src/App.tsx` — atualizar rotas e redirects
- `src/pages/Home.tsx` — alinhar layout Hero com o do franqueado

---

### 2. Agenda

**Estado atual:** Ambas as agendas já possuem calendário mês/semana/dia, Google Calendar, criação de eventos. A diferença principal é a **visibilidade**.

**Franqueadora — Agenda:**
- Formulário de evento: adicionar campo "Visibilidade" com opções:
  - `pessoal` — só o criador vê
  - `matriz` — apenas equipe interna da matriz
  - `rede` — visível para franqueados (já existe)
  - `clientes` — visível para clientes finais
- Já salva `visibility` no banco — apenas expor no formulário as opções novas
- Legenda da sidebar: atualizar com todas as categorias de visibilidade

**Franqueado — Agenda:**
- Formulário de evento: adicionar campo "Visibilidade" com opções:
  - `pessoal` — só o criador
  - `unidade` — todos da unidade
  - `clientes` — compartilhado com clientes vinculados
- Já funciona com Google Calendar

**Ambas:**
- Garantir que a integração Google Calendar funciona corretamente em ambos os portais (já implementada)
- Revisar que o `redirectUri` está correto para cada portal

**Arquivos alterados:**
- `src/pages/Agenda.tsx` — expandir opções de visibilidade no formulário
- `src/pages/franqueado/FranqueadoAgenda.tsx` — adicionar campo de visibilidade

---

### 3. Comunicados

**Franqueadora — Comunicados (já cria/edita):**
- Já funcional com `ComunicadoForm` + `ComunicadosList` + `ComunicadoDetail`
- Revisar: segmentação de público alvo deve incluir:
  - "Internos (Matriz)" — apenas equipe interna
  - "Franqueados" — todas ou unidades específicas
  - "Clientes Finais" — todos os clientes SaaS da rede
- Garantir que edição completa funciona (alterar título, conteúdo, público, prioridade, tipo)
- Verificar que anexo (storage bucket) funciona

**Franqueado — Comunicados (somente recebe):**
- Já funcional com `FranqueadoComunicados.tsx`
- Tabs "Novos" / "Lidos", filtros por prioridade/tipo, confirmação de leitura para críticos
- Nenhuma mudança de código necessária — apenas teste de usabilidade

**Cliente Final — Comunicados:**
- Recebe avisos como pop-up ou no dashboard (não tem aba dedicada de comunicados)
- Confirmar que a RPC `get_announcements_with_parent` já entrega comunicados da matriz e franqueado para clientes vinculados
- Se necessário, adicionar um banner/widget no `ClienteInicio.tsx` para mostrar comunicados ativos

**Arquivos alterados:**
- `src/pages/Comunicados.tsx` — revisar segmentação de público
- `src/components/comunicados/ComunicadoForm.tsx` — garantir que "Internos" é uma opção de público

---

### 4. Atendimento / Suporte

**Franqueadora — "Atendimento" (na sidebar seção "Rede"):**
- Estado atual: Kanban básico com `useSupportTicketsNetwork` (vê tickets próprios + de orgs filhas)
- **Melhorias necessárias:**
  - Layout completo com: lista/kanban, detalhe do chamado com mensagens, criar novo chamado
  - Identificar a origem: "Franqueado" ou "Cliente SaaS" via `org_name`
  - Responder diretamente no chamado (usar `sendMessage` do hook)
  - Atualizar status dos chamados
  - O módulo atual (252 linhas) é básico demais — precisa ser expandido para ter paridade com o `FranqueadoSuporte.tsx` (662 linhas) que já tem kanban, mensagens, upload de anexos, filtros

**Franqueado — "Suporte":**
- Já robusto (662 linhas): Kanban, detalhe com chat de mensagens, upload de anexos, filtros
- Envia mensagens para a Matriz e recebe respostas
- Nenhuma mudança estrutural necessária — apenas teste

**Cliente — "Suporte":**
- Já funcional (317 linhas): lista, detalhe com chat, criação de chamados
- Os chamados vão para a organização do cliente — com `parent_org_id`, a Matriz pode ver via `get_network_tickets`
- Nenhuma mudança estrutural necessária

**Ação principal:** Reescrever `src/pages/Atendimento.tsx` (Franqueadora) para ter o mesmo nível de funcionalidade do `FranqueadoSuporte.tsx`:
- Kanban com colunas de status
- Detalhe do chamado com thread de mensagens
- Upload de anexos
- Filtros por status, prioridade, origem (franqueado vs cliente)
- Responder e mudar status inline

**Arquivos alterados:**
- `src/pages/Atendimento.tsx` — reescrever com funcionalidade completa

---

### Resumo de alterações

| Arquivo | Ação |
|---------|------|
| `FranqueadoraSidebar.tsx` | Renomear "Dashboard" → "Início", path → `/franqueadora/inicio` |
| `FranqueadoSidebar.tsx` | Renomear "Dashboard" → "Início", path → `/franqueado/inicio` |
| `App.tsx` | Atualizar rotas e redirects para `/inicio` |
| `Home.tsx` | Alinhar layout Hero com o do franqueado |
| `Agenda.tsx` | Expandir opções de visibilidade (pessoal, matriz, rede, clientes) |
| `FranqueadoAgenda.tsx` | Adicionar campo de visibilidade (pessoal, unidade, clientes) |
| `Atendimento.tsx` | Reescrever com kanban, mensagens, anexos, filtros |
| `Comunicados.tsx` / `ComunicadoForm.tsx` | Revisar segmentação de público |

### Ordem de execução

1. Renomear rotas e sidebar (rápido, sem risco)
2. Alinhar layout do Home.tsx
3. Expandir formulários de visibilidade na Agenda
4. Revisar segmentação de Comunicados
5. Reescrever Atendimento.tsx da Franqueadora


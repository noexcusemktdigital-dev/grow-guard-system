

## Plano: Melhorias no Sistema Franqueado

### Resumo das Mudancas

8 alteracoes solicitadas, organizadas por area.

---

### 1. Agenda — Visualizacao Semana, Mes e Dia

A agenda atual so tem visualizacao mensal. Adicionar toggle com 3 modos:
- **Mes**: grid atual (ja funcional)
- **Semana**: grid de 7 colunas com slots de hora (7h-22h), mostrando eventos posicionados no horario correto
- **Dia**: coluna unica com slots de hora detalhados

Alteracoes:
- `FranqueadoAgenda.tsx`: adicionar state `viewMode` ("month" | "week" | "day"), botoes de toggle no header, componentes `WeekView` e `DayView` internos com navegacao (anterior/proximo semana ou dia)

---

### 2. Suporte — Chamados direto ao Atendimento da Franqueadora

O suporte do franqueado ja cria tickets na tabela `support_tickets` que a franqueadora le via `Atendimento.tsx`. Os chamados ja sao compartilhados pela `organization_id` pai. Preciso confirmar que o fluxo esta conectado — se necessario, garantir que ao criar ticket o franqueado envia para a org da franqueadora.

Alteracoes:
- Verificar se `useSupportTickets` filtra corretamente para que a franqueadora veja os tickets criados pelas unidades
- Se necessario, adicionar campo `parent_org_id` ou ajustar filtro no Atendimento da franqueadora para agregar tickets de todas as unidades da rede

---

### 3. CRM de Vendas — Mesma estrutura do ClienteCRM (SaaS)

Substituir o CRM atual do franqueado pelo nivel completo do `ClienteCRM.tsx`:
- Drag-and-drop com `@dnd-kit` (DragOverlay, useDraggable, useDroppable)
- Selecao em massa com checkboxes e bulk actions (mover, tags, excluir, marcar perdido)
- Filtros avancados em Popover (responsavel, tag, status, temperatura, valor, data)
- Temperature cycling nos cards
- Dropdown de acoes por card (copiar telefone, WhatsApp, marcar perdido, excluir)
- Gestao de funis (CrmFunnelManager)
- Import CSV
- Aba Contatos integrada

Alteracoes:
- `FranqueadoCRM.tsx`: reescrever baseado no `ClienteCRM.tsx`, adaptando imports para hooks do franqueado (`useCrmLeads` de `@/hooks/useCrmLeads`, `useCrmFunnels` de `@/hooks/useCrmFunnels`)

---

### 4. Retirar aba Diagnostico

Remover o modulo Diagnostico como item separado da sidebar. A funcionalidade de diagnostico ja esta incorporada dentro do Criador de Estrategia (primeira aba "Novo Diagnostico").

Alteracoes:
- `FranqueadoSidebar.tsx`: remover `{ label: "Diagnostico", ... }` do `comercialSection`
- A rota pode ser mantida no App.tsx para retrocompatibilidade, mas nao aparece no menu

---

### 5. Criador de Estrategia — Salvar historico completo

O historico ja esta implementado! A aba "Historico" no `FranqueadoEstrategia.tsx` lista todas as estrategias salvas com busca, edicao de titulo, vinculacao a lead e regeneracao. As estrategias ja sao persistidas na tabela via `useStrategies/useCreateStrategy`.

**Nao precisa de mudancas aqui** — ja funciona conforme solicitado.

---

### 6. Estrategias e Propostas vinculadas aos Leads do CRM

As estrategias ja tem campo `lead_id` e vinculacao no historico. As propostas tambem tem `lead_id` via `CrmProposals`.

O que falta: garantir que no **CrmLeadDetailSheet** do franqueado (a sheet de detalhe do lead) exista abas mostrando estrategias e propostas vinculadas ao lead.

Alteracoes:
- `CrmLeadDetailSheet.tsx` (franqueado): adicionar abas/secoes para "Estrategias" e "Propostas" vinculadas ao lead, com links para visualizar e botoes para criar nova estrategia/proposta vinculada

---

### 7. Contratos — Obrigatorio vincular Lead + Proposta Aceita

Ao criar novo contrato:
- **Lead do CRM** e **Proposta aceita** sao **obrigatorios** (nao opcionais como hoje)
- Ao selecionar proposta aceita, puxar automaticamente: valores, servicos, forma de pagamento
- O unico campo que o franqueado precisa preencher manualmente alem disso: **dia de pagamento**
- Contratos ativos devem mostrar: status de assinatura (assinado/nao), status de envio (enviado/nao), proximidade de vencimento (badge "Vence em X dias")
- Gerar **arquivo PDF A4** profissional do contrato (usando html2pdf.js ja instalado), com layout formal de contrato

Alteracoes:
- `FranqueadoContratos.tsx`: 
  - Tornar lead_id e proposal_id obrigatorios no formulario
  - Simplificar formulario: ao selecionar proposta, pre-preencher tudo, so pedir dia de pagamento + dados do cliente
  - Na listagem, adicionar badges de status (Assinado/Nao assinado, Enviado, Vence em X dias)
  - Melhorar funcao `downloadContractPdf` para gerar layout A4 profissional com secoes de contrato formais

---

### 8. Financeiro — Vincular pagamentos dos clientes

No financeiro do franqueado:
- Mostrar pagamentos dos clientes vinculados aos contratos
- Calcular automaticamente a participacao de 20% do franqueado
- Quando o cliente paga (status "pago" no contrato/payment), atualizar o valor liquido do franqueado

Alteracoes:
- `FranqueadoFinanceiro.tsx`:
  - Na aba "Visao Geral", adicionar KPI "Participacao (20%)" calculada sobre o MRR
  - Na aba "Controle de Pagamentos", adicionar coluna "Sua Participacao (20%)" e status de recebimento
  - Adicionar toggle "Marcar como Recebido" nos pagamentos para controle do franqueado

---

### Resumo de Arquivos

| Arquivo | Acao |
|---|---|
| `src/pages/franqueado/FranqueadoAgenda.tsx` | Reescrever — adicionar views Semana e Dia |
| `src/pages/franqueado/FranqueadoCRM.tsx` | Reescrever — copiar estrutura do ClienteCRM |
| `src/pages/franqueado/FranqueadoContratos.tsx` | Editar — obrigatoriedade Lead+Proposta, PDF A4, badges de status |
| `src/pages/franqueado/FranqueadoFinanceiro.tsx` | Editar — participacao 20%, pagamentos vinculados |
| `src/components/FranqueadoSidebar.tsx` | Editar — remover Diagnostico |
| `src/components/franqueado/CrmLeadDetailSheet.tsx` | Editar — adicionar abas Estrategias e Propostas |

### Sequencia de Implementacao

1. Sidebar (remover Diagnostico)
2. Agenda (views semana/dia)
3. CRM de Vendas (reescrever completo)
4. Lead Detail Sheet (vincular estrategias/propostas)
5. Contratos (obrigatoriedade + PDF A4 + badges)
6. Financeiro (participacao 20%)



# Correcoes e Novas Funcionalidades

## 1. Exclusao de Agente IA -- Foreign Key Constraint (Bug Fix)

O erro real e HTTP 409: a tabela `ai_conversation_logs` referencia `client_ai_agents.id` com `NO ACTION` on delete. Quando existem logs de conversa associados ao agente, a exclusao falha.

**Correcao**: Migracao SQL para alterar a foreign key para `ON DELETE CASCADE`, fazendo com que os logs sejam removidos automaticamente ao excluir o agente.

```sql
ALTER TABLE public.ai_conversation_logs
  DROP CONSTRAINT ai_conversation_logs_agent_id_fkey,
  ADD CONSTRAINT ai_conversation_logs_agent_id_fkey
    FOREIGN KEY (agent_id) REFERENCES public.client_ai_agents(id)
    ON DELETE CASCADE;
```

---

## 2. Edicao de Metas (Feature)

Atualmente o `GoalCard` tem um botao "Editar" mas o `onEdit` no `ClientePlanoVendas.tsx` faz `{ /* TODO */ }` (linha 1309).

**Correcao**: Implementar um dialog de edicao reutilizando o mesmo formulario do "Nova Meta", pre-preenchido com os dados da meta selecionada.

### Mudancas em `ClientePlanoVendas.tsx`:
- Adicionar estado `editingGoal` (null ou goal object)
- Ao clicar "Editar" no GoalCard, preencher `editingGoal` e abrir o dialog
- Reusar o dialog de Nova Meta, adaptando titulo para "Editar Meta" e usando `updateGoal.mutate` ao inves de `createGoal.mutate`
- Limpar `editingGoal` ao fechar

---

## 3. Gamificacao -- Avaliacoes e Pontuacao (Feature)

Melhorar o sistema de gamificacao em `ClienteGamificacao.tsx`:

- Adicionar secao "Avaliacoes" que mostra um resumo de acoes do usuario (leads criados, contratos fechados, dias de sequencia)
- Calcular pontos baseados em acoes reais do CRM: cada lead criado = 10pts, lead ganho = 50pts, checklist completo = 5pts
- Mostrar ranking entre membros da organizacao (se houver mais de 1)
- Adicionar animacao visual ao ganhar pontos

### Dados utilizados:
- `useCrmLeads` para contar leads do usuario
- `useClienteChecklist` para streak de checklist
- `client_gamification` tabela existente para persistir pontos

---

## 4. Alertas de Acoes Importantes (Feature)

Criar um sistema de alertas globais que aparece como banner no topo do layout do cliente.

### Novo componente: `src/components/cliente/ActionAlertsBanner.tsx`
- Verifica condicoes criticas e mostra banners de alerta:
  - Leads sem contato ha mais de 48h
  - Metas abaixo de 30% do ritmo ideal
  - Conversas WhatsApp nao respondidas ha mais de 24h
  - Creditos baixos (wallet < 50)
- Cada alerta tem icone, mensagem e botao de acao que navega para o modulo relevante
- Alerta pode ser dispensado temporariamente (sessionStorage)
- Maximo de 3 alertas visiveis por vez

### Integracao em `ClienteLayout.tsx`:
- Adicionar `<ActionAlertsBanner />` acima do `<Outlet />`

### Hooks utilizados:
- `useCrmLeads`, `useActiveGoals`, `useGoalProgress`, `useClienteWallet`

---

## 5. Efeitos Sonoros (Feature)

Criar um utilitario de sons para acoes importantes do cliente.

### Novo arquivo: `src/lib/sounds.ts`
- Funcao `playSound(type)` que toca sons curtos usando Web Audio API (osciladores sinteticos, sem arquivos externos)
- Tipos de som:
  - `success`: tom agudo ascendente (meta batida, lead ganho, agente criado)
  - `notification`: bip duplo curto (novo lead, nova mensagem)
  - `warning`: tom grave (alerta, erro)
  - `click`: click suave (toggle, botao importante)

### Integracao nos componentes:
- `ClienteAgentesIA.tsx`: som `success` ao criar/duplicar agente
- `ClientePlanoVendas.tsx`: som `success` ao criar meta
- `GoalCard.tsx`: som `success` quando meta atinge 100%
- `ChatConversation.tsx`: som `notification` ao receber nova mensagem
- Toast de erro: som `warning`

---

## Detalhes Tecnicos

| Arquivo | Acao |
|---------|------|
| Migracao SQL | ALTER FK `ai_conversation_logs_agent_id_fkey` para ON DELETE CASCADE |
| `src/pages/cliente/ClientePlanoVendas.tsx` | Implementar edicao de metas (dialog + updateGoal) |
| `src/pages/cliente/ClienteGamificacao.tsx` | Melhorar com dados reais do CRM e avaliacoes |
| `src/components/cliente/ActionAlertsBanner.tsx` | **NOVO** - sistema de alertas globais |
| `src/components/ClienteLayout.tsx` | Adicionar ActionAlertsBanner |
| `src/lib/sounds.ts` | **NOVO** - utilitario de efeitos sonoros (Web Audio API) |
| `src/pages/cliente/ClienteAgentesIA.tsx` | Adicionar efeitos sonoros |
| `src/components/cliente/ChatConversation.tsx` | Adicionar som de notificacao |

### Nenhuma dependencia externa necessaria
- Sons sao gerados via Web Audio API (nativa do browser)
- Todos os dados ja existem nas tabelas e hooks atuais


# Auditoria Completa: Vinculo Franqueadora-Franqueado

## Resumo da Analise

Revisei em profundidade todos os modulos compartilhados entre Franqueadora e Franqueado. Abaixo esta o diagnostico completo, separando o que **funciona corretamente**, o que tem **problemas** e as **otimizacoes recomendadas**.

---

## Modulos que FUNCIONAM corretamente (vinculo ativo)

### 1. Comunicados
- **Status: OK**
- Franqueadora cria comunicados com `organization_id` da matriz
- Franqueado consome via RPC `get_announcements_with_parent`, que busca comunicados da propria org + org pai
- Confirmacao de leitura (criticos) funciona independente por usuario
- Segmentacao por unidade (`target_unit_ids`) funciona

### 2. Marketing / Drive de Materiais
- **Status: OK**
- Franqueado usa `useContentSourceOrgId()` que resolve para `parent_org_id` via RPC `get_parent_org_id`
- Pastas e assets sao lidos da org da franqueadora
- Franqueado so visualiza e baixa, nao edita — correto

### 3. Academy / Treinamentos
- **Status: OK**
- Modulos e aulas vem da org pai (via `sourceOrgId`)
- Progresso, certificados e quiz attempts sao salvos por `user_id` — isolamento correto
- Ranking e evolucao funcionam por usuario individual

### 4. Suporte / Atendimento
- **Status: OK**
- Franqueado cria tickets na propria `organization_id`
- Franqueadora ve todos os tickets da rede via RPC `get_network_tickets` (busca por `parent_org_id`)
- Mensagens bidirecionais funcionam

### 5. Unidades (gestao pela franqueadora)
- **Status: OK**
- Provisionamento via Edge Function `provision-unit` cria org filha com `parent_org_id`
- Dados, usuarios, documentos e financeiro da unidade funcionam

---

## Problemas e Falhas Encontradas

### PROBLEMA 1: Mensagem do Dia NAO chega ao Franqueado
- **Gravidade: ALTA**
- `useDailyMessages()` filtra por `organization_id = orgId` (org do franqueado)
- A franqueadora cria a mensagem na org DELA
- O franqueado nunca ve a mensagem porque o `organization_id` nao bate
- **Correcao**: Criar uma RPC similar a `get_announcements_with_parent` ou usar `get_parent_org_id` para buscar mensagens da org pai tambem

### PROBLEMA 2: Metas e Ranking NAO sao compartilhados
- **Gravidade: ALTA**
- `useGoals()` filtra por `organization_id = orgId` (org do franqueado)
- Quando a franqueadora cria metas globais ou por unidade, ela salva na org DELA
- O franqueado nao ve essas metas — o modulo fica vazio
- **Correcao**: Metas globais da franqueadora precisam ser visiveis para unidades filhas. Criar uma query que busque metas da org pai (metas globais) + metas especificas da unidade

### PROBLEMA 3: Agenda NAO tem visibilidade cruzada
- **Gravidade: MEDIA**
- `useCalendarEvents()` filtra por `organization_id = orgId`
- Eventos criados pela franqueadora com visibilidade "Rede" ou "Unidade especifica" nao aparecem para o franqueado
- **Correcao**: Criar uma RPC que retorne eventos da org propria + eventos da org pai que tenham visibilidade de rede (similar ao padrao de comunicados)

### PROBLEMA 4: Fechamentos financeiros NAO chegam ao Franqueado
- **Gravidade: ALTA**
- `useFinanceClosings()` filtra por `organization_id = orgId`
- Fechamentos (DRE) sao gerados pela franqueadora na org dela
- O franqueado ve "Nenhum fechamento disponivel" — nunca recebe os arquivos
- **Correcao**: Buscar fechamentos da org pai que sejam publicados (`status = 'published'`) e destinados a unidade especifica ou a toda a rede

### PROBLEMA 5: Contratos de Franquia na aba Configuracoes do Franqueado
- **Gravidade: MEDIA**
- `useContracts()` filtra por `organization_id = orgId` (org do franqueado)
- Contratos de franquia sao criados pela franqueadora na org DELA, com `unit_org_id` apontando para a unidade
- O franqueado nao ve esses contratos na aba "Contrato de Franquia"
- **Correcao**: Adicionar busca por contratos onde `unit_org_id = orgId` (contratos que a franqueadora fez para aquela unidade)

### PROBLEMA 6: Templates de Contrato nao compartilhados
- **Gravidade: BAIXA**
- Se o franqueado precisa gerar contratos para seus clientes, ele so ve templates da propria org
- Templates criados pela franqueadora nao sao herdados
- **Correcao**: Buscar templates da org pai tambem (como no Marketing)

---

## Otimizacoes Recomendadas

### OTIMIZACAO 1: Criar RPC `get_data_with_parent` generica
Em vez de criar RPCs separadas para cada tabela, criar uma funcao reutilizavel ou aplicar o mesmo padrao (buscar da org propria + org pai) nos hooks que precisam de visibilidade cruzada.

### OTIMIZACAO 2: Padronizar campo `visibility` nos eventos de agenda
Adicionar um campo `visibility` ('own', 'network', 'specific_units') na tabela `calendar_events` para que a franqueadora possa controlar quais eventos aparecem para a rede.

### OTIMIZACAO 3: Campo `target_unit_ids` nas metas
Permitir que metas da franqueadora sejam direcionadas a unidades especificas (como ja funciona em comunicados), com filtro no lado do franqueado.

---

## Plano de Implementacao

### Fase 1 — Correcoes Criticas (Problemas 1, 2, 4, 5)

1. **Mensagem do Dia**: Alterar `useDailyMessages()` para buscar tambem da org pai via `get_parent_org_id`
2. **Metas**: Criar RPC `get_goals_with_parent` ou alterar `useGoals()` para buscar metas da org pai (scope global) + metas da propria org
3. **Fechamentos**: Criar RPC ou alterar `useFinanceClosings()` para incluir fechamentos da org pai com status `published`
4. **Contratos de Franquia**: Alterar a query na aba Contrato do Franqueado para buscar contratos onde `unit_org_id = orgId`

### Fase 2 — Agenda Cruzada (Problema 3)

5. **Migrar tabela**: Adicionar coluna `visibility` em `calendar_events` (default 'own')
6. **RPC de eventos**: Criar funcao que retorna eventos proprios + eventos da org pai com visibilidade 'network'
7. **UI da franqueadora**: Adicionar seletor de visibilidade ao criar eventos

### Fase 3 — Polimento (Problema 6 e Otimizacoes)

8. **Templates de contrato**: Buscar templates da org pai
9. **Padronizacao**: Revisar todos os hooks para garantir consistencia no padrao parent_org

---

## Detalhes Tecnicos

**Hooks a modificar:**
- `src/hooks/useDailyMessages.ts` — adicionar busca na org pai
- `src/hooks/useGoals.ts` — adicionar busca na org pai para metas globais
- `src/hooks/useFinance.ts` (`useFinanceClosings`) — buscar fechamentos da org pai
- `src/hooks/useContracts.ts` (`useContracts`) — adicionar filtro por `unit_org_id`
- `src/hooks/useCalendar.ts` — implementar visibilidade cruzada

**Novas RPCs SQL a criar:**
- `get_daily_message_with_parent(_org_id)` — retorna msg do dia da org ou da org pai
- `get_goals_with_parent(_org_id)` — retorna metas globais da org pai + metas locais
- `get_closings_with_parent(_org_id)` — retorna fechamentos publicados da org pai

**Migracao de banco:**
- Adicionar coluna `visibility text default 'own'` em `calendar_events`
- Adicionar coluna `target_unit_ids uuid[]` em `goals` (se nao existir)

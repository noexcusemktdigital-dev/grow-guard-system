

# Plano: Vincular Sistema Franqueadora ao Franqueado

## Contexto

Atualmente, a Agenda da Franqueadora e bastante simples (apenas um calendario basico), enquanto a do Franqueado e bem mais completa (sidebar de calendarios, Google Sync, formulario detalhado, visualizacao de detalhes). Alem disso, o modulo de Comunicados da Franqueadora precisa de melhorias na segmentacao de publico para permitir envio direcionado a unidades especificas.

---

## 1. Agenda da Franqueadora -- Upgrade Completo

### Problema atual
A pagina `Agenda.tsx` da Franqueadora e um calendario minimalista sem:
- Sidebar de calendarios
- Formulario completo (descricao, local, cor, dia inteiro)
- Sheet de detalhes do evento
- Opcao de convidar/associar unidades franqueadas ao evento
- Google Calendar sync

### Solucao
Reescrever `src/pages/Agenda.tsx` baseando-se na estrutura do `FranqueadoAgenda.tsx`, adicionando:

- **Formulario completo**: titulo, descricao, data/hora inicio e fim, local, dia inteiro, cor, calendario
- **Campo "Unidades Convidadas"**: seletor multi-select de unidades (da tabela `units`) para associar ao evento
- **Sidebar de calendarios**: mostrando calendarios da organizacao
- **Sheet de detalhes**: ao clicar em evento, abrir painel lateral com todas as informacoes
- **Campo `visibility`**: permitir definir se o evento e visivel para "Rede" (todos franqueados), "Unidades selecionadas" ou "Apenas matriz"
- **Google Calendar Sync**: mesma integracao ja implementada no franqueado

### Campos do banco ja existentes utilizados
- `calendar_events.visibility` (ja existe: "private", pode ser expandido)
- `calendar_events.unit_id` (ja existe, para associar a uma unidade)
- `calendar_event_invites` (ja existe para convites)

### Arquivos modificados
- `src/pages/Agenda.tsx` -- reescrever com a versao completa

---

## 2. Comunicados da Franqueadora -- Segmentacao Aprimorada

### Problema atual
O formulario de criacao de comunicados (`ComunicadoForm.tsx`) ja tem campos de publico, mas o hook `useAnnouncementMutations` nao salva `target_unit_ids` e o formulario nao tem seletor de unidades especificas.

### Solucao
Aprimorar o fluxo de criacao/edicao de comunicados:

- **No formulario**: adicionar seletor multi-select de unidades quando "Unidades especificas" for selecionado como publico
- **No hook**: passar `target_unit_ids` ao criar/atualizar comunicado
- **Na listagem**: exibir badge indicando se e para "Toda a rede", "Matriz" ou "X unidades"

### Arquivos modificados
- `src/components/comunicados/ComunicadoForm.tsx` -- adicionar campo de selecao de unidades
- `src/hooks/useAnnouncements.ts` -- incluir `target_unit_ids` nas mutations
- `src/pages/Comunicados.tsx` -- mapear `target_unit_ids` no objeto comunicado
- `src/components/comunicados/ComunicadosList.tsx` -- exibir badge de segmentacao

---

## Resumo de Alteracoes

```text
Arquivos a modificar:
+----------------------------------------------+---------------------------+
| Arquivo                                      | Tipo de alteracao         |
+----------------------------------------------+---------------------------+
| src/pages/Agenda.tsx                         | Reescrita completa        |
| src/components/comunicados/ComunicadoForm.tsx| Adicionar seletor unidade |
| src/hooks/useAnnouncements.ts                | Incluir target_unit_ids   |
| src/pages/Comunicados.tsx                    | Mapear target_unit_ids    |
| src/components/comunicados/ComunicadosList.tsx| Badge de segmentacao     |
+----------------------------------------------+---------------------------+

Nenhuma migracao de banco necessaria:
- Os campos target_unit_ids (announcements) e unit_id/visibility (calendar_events) ja existem
- A tabela calendar_event_invites ja suporta convites
```




# Acoes em Massa no CRM e Contatos + Filtros Avancados

## Resumo

Adicionar selecao multipla com checkbox e acoes em massa tanto na aba Pipeline (leads) quanto na aba Contatos do CRM. Tambem expandir os filtros e opcoes de edicao nos contatos.

---

## 1. Acoes em Massa nos Leads (Pipeline)

### Selecao

- Adicionar um estado `selectedLeadIds: Set<string>` no `ClienteCRM.tsx`
- Na view **lista**: adicionar coluna de Checkbox em cada linha + checkbox "selecionar todos" no header
- Na view **kanban**: adicionar checkbox discreto no canto superior esquerdo de cada card de lead (visivel on hover ou sempre quando ha selecao ativa)

### Barra de Acoes em Massa

Quando ha leads selecionados, exibir uma barra fixa no topo (sticky) com:
- Contador: "X leads selecionados"
- **Mover etapa** -- Select para mover todos os selecionados para uma etapa
- **Atribuir responsavel** -- Select com membros da equipe
- **Adicionar tag** -- Input para adicionar tag em massa
- **Marcar como perdido** -- Botao com confirmacao
- **Excluir** -- Botao com confirmacao (AlertDialog)
- **Limpar selecao** -- Botao X

### Hook `useCrmLeadMutations`

Adicionar uma mutation `bulkUpdateLeads` que recebe um array de IDs e os campos a atualizar. Usa `supabase.from("crm_leads").update(fields).in("id", ids)`.

Adicionar uma mutation `bulkDeleteLeads` que recebe um array de IDs. Usa `supabase.from("crm_leads").delete().in("id", ids)`.

---

## 2. Acoes em Massa nos Contatos

### Selecao

- Adicionar estado `selectedContactIds: Set<string>` no `CrmContactsView.tsx`
- Adicionar checkbox em cada linha da lista de contatos + checkbox "selecionar todos" no header

### Barra de Acoes em Massa

Quando ha contatos selecionados, exibir barra com:
- Contador: "X contatos selecionados"
- **Adicionar tag** -- Input para adicionar tag em massa
- **Alterar origem** -- Input para definir origem em massa
- **Alterar empresa** -- Input para definir empresa em massa
- **Criar leads** -- Criar um lead para cada contato selecionado (com Dialog de confirmacao mostrando em qual funil/etapa)
- **Excluir** -- Botao com confirmacao
- **Limpar selecao** -- Botao X

### Hook `useCrmContactMutations`

Adicionar mutations:
- `bulkUpdateContacts(ids: string[], fields)` -- update em massa
- `bulkDeleteContacts(ids: string[])` -- delete em massa

---

## 3. Filtros Avancados nos Contatos

Expandir o Popover de filtros em `CrmContactsView.tsx` para incluir:

- **Tag** (ja existe)
- **Origem** (ja existe)
- **Empresa** (ja existe)
- **Cargo** -- Select com cargos unicos extraidos dos contatos
- **Periodo de criacao** -- Inputs date "De" e "Ate"
- **Com leads vinculados** -- Toggle sim/nao/todos (filtra contatos que tem ou nao leads)
- Badge com contagem de filtros ativos
- Botao "Limpar tudo"

---

## 4. Mais Opcoes de Edicao nos Contatos

### Sheet de Edicao Expandido

Adicionar ao `ContactForm` e ao Sheet de edicao:
- Campo **CPF/CNPJ** (novo campo `document` na tabela -- requer migration)
- Campo **Endereco** (novo campo `address` na tabela -- requer migration)
- Campo **Data de nascimento** (novo campo `birth_date` na tabela -- requer migration)
- Separar o formulario em secoes visuais: "Dados Pessoais", "Dados Profissionais", "Informacoes Adicionais"

### Migration

Adicionar colunas na tabela `crm_contacts`:
- `document` text nullable (CPF/CNPJ)
- `address` text nullable
- `birth_date` date nullable

### Acoes individuais no contato (menu de contexto)

Adicionar um menu de 3 pontos em cada contato na lista com:
- Editar
- Criar Lead
- Copiar telefone
- Copiar email
- Excluir

---

## Arquivos a editar

| Acao | Arquivo |
|------|---------|
| Migration | Adicionar `document`, `address`, `birth_date` em `crm_contacts` |
| Editar | `src/hooks/useCrmContacts.ts` -- adicionar `bulkUpdateContacts`, `bulkDeleteContacts`, atualizar interface |
| Editar | `src/hooks/useCrmLeads.ts` -- adicionar `bulkUpdateLeads`, `bulkDeleteLeads` |
| Reescrever | `src/components/crm/CrmContactsView.tsx` -- checkbox, barra de acoes em massa, filtros avancados, formulario expandido, menu de contexto |
| Editar | `src/pages/cliente/ClienteCRM.tsx` -- checkbox nos leads (kanban + lista), barra de acoes em massa para leads |

## Detalhes Tecnicos

- Bulk update usa `supabase.from("table").update(fields).in("id", ids)` -- uma unica query
- Bulk delete usa `supabase.from("table").delete().in("id", ids)`
- A barra de acoes em massa usa `position: sticky` com `z-index` alto para ficar visivel ao rolar
- O checkbox "selecionar todos" seleciona apenas os itens filtrados/visiveis, nao todos os dados
- As acoes em massa usam `AlertDialog` para confirmacao antes de excluir ou alterar em massa
- Os novos campos `document`, `address`, `birth_date` sao nullable para compatibilidade
- O filtro "com leads vinculados" faz join local usando o `leadsCountByContact` ja computado


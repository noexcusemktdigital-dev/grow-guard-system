

# CRM — Exclusão de Funil, Kanban Imediato e Transferência de Leads entre Funis

## Problemas

1. **Não é possível excluir um funil** — O `CrmFunnelManager` tem o botão de delete, mas ele só aparece para funis que NÃO são padrão, e a lógica de `deleteFunnel` existe no hook. Preciso verificar se o botão está realmente renderizando e se há confirmação antes de excluir.

2. **Funil recém-criado não exibe colunas vazias** — Quando o Kanban não tem leads, mostra "Nenhum lead cadastrado" ao invés das colunas vazias do funil. O Kanban precisa sempre mostrar as etapas, mesmo sem leads.

3. **Não há opção de transferir leads entre funis** — Nem no detalhe do lead, nem na seleção em massa, existe a opção de mover leads para outro funil (alterar `funnel_id`).

---

## Correções

### 1. Garantir exclusão de funil com confirmação
**Arquivo**: `src/components/crm/CrmFunnelManager.tsx`

- Adicionar `AlertDialog` de confirmação antes de excluir um funil
- Informar quantos leads estão vinculados ao funil (se possível)
- O botão de delete já existe para funis não-padrão — garantir que está visível e funcional

### 2. Kanban mostra colunas vazias mesmo sem leads
**Arquivo**: `src/pages/cliente/ClienteCRM.tsx`

- Na linha ~819, o estado vazio `allLeads.length === 0` mostra um card genérico. Alterar para que, quando há um funil selecionado com etapas definidas, o Kanban renderize as colunas vazias normalmente (com header de cada etapa), e apenas mostre a mensagem "Adicione seu primeiro lead" dentro de cada coluna ou como um banner acima
- Mover a verificação de empty state para dentro do Kanban, mostrando colunas vazias com um botão "Novo Lead" na primeira coluna

### 3. Transferir leads entre funis — Individual e em massa
**Arquivos**: `src/pages/cliente/ClienteCRM.tsx`, `src/components/crm/CrmLeadDetailSheet.tsx`

**Bulk Actions (ClienteCRM.tsx)**:
- Adicionar um `Select` na barra de ações em massa para "Transferir para funil"
- Listar todos os funis disponíveis (exceto o atual)
- Ao selecionar, chamar `bulkUpdateLeads` com `{ funnel_id: novoFunnelId, stage: primeiraEtapaDoNovoFunil }`
- Os leads transferidos são movidos para a primeira etapa do funil destino

**Lead Detail (CrmLeadDetailSheet.tsx)**:
- Adicionar um campo "Funil" no detalhe do lead com um Select dos funis disponíveis
- Ao trocar o funil, atualizar `funnel_id` e resetar o `stage` para a primeira etapa do funil destino
- Necessário passar `funnels` como prop (lista de funis acessíveis)

**Hook (useCrmLeads.ts)**:
- O `updateLead` já aceita qualquer campo, incluindo `funnel_id` — não precisa de alteração no hook

---

## Arquivos Afetados

| Arquivo | Ação |
|---|---|
| `src/components/crm/CrmFunnelManager.tsx` | Adicionar confirmação de exclusão com AlertDialog |
| `src/pages/cliente/ClienteCRM.tsx` | Kanban com colunas vazias + ação bulk "Transferir funil" |
| `src/components/crm/CrmLeadDetailSheet.tsx` | Adicionar seletor de funil no detalhe do lead |


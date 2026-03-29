

## Melhorias no CRM — 5 Correções

### 1. Sincronizar valor da proposta com valor do lead

Quando uma proposta é criada ou atualizada no `ProposalsTab`, o valor dela deve ser automaticamente copiado para o campo `value` do lead.

**Arquivo:** `src/components/crm/CrmLeadDetailHelpers.tsx`
- O `ProposalsTab` recebe apenas `leadId`. Precisa receber também um callback ou usar `useCrmLeadMutations` diretamente
- Após `createProposal.mutate(...)` com sucesso, chamar `updateLead.mutate({ id: leadId, value: parseFloat(value) })` para sincronizar
- Fazer o mesmo no `handleStatusChange` se o valor mudar
- Adicionar `useCrmLeadMutations` no componente

### 2. Feedback ao importar planilha CSV

Quando a importação termina no `CrmCsvImportDialog`, mostrar uma mensagem mais clara.

**Arquivo:** `src/components/crm/CrmCsvImportDialog.tsx`
- Na tela de resultado (step 3), alterar o texto do toast e a UI para dizer: **"Sua planilha foi aceita e os contatos foram gerados na aba de Contatos"**
- Manter o contador de sucesso/erros

### 3. UX do detalhe do contato — botão Voltar/Fechar

O detalhe do contato abre inline na view de contatos sem botão claro de fechar.

**Arquivo:** `src/components/crm/CrmContactsViewDialogs.tsx`
- Verificar como o `editContact` é exibido (Dialog ou inline)
- Se for Dialog, garantir que tem X no header
- Se for inline, adicionar botão de seta ← ou X para fechar

### 4. Ícone de Configurações com texto

O botão de configurações usa `Settings2` sem texto, apenas tooltip.

**Arquivo:** `src/pages/cliente/ClienteCRMHeader.tsx`
- Trocar de ícone-only (`w-8 p-0`) para botão com texto
- Usar ícone `Settings` (engrenagem) + texto "Configurações"
- Manter o tooltip

### 5. Indicador de negociação na lista de contatos

Na aba de contatos, diferenciar visualmente quais contatos já têm leads associados.

**Arquivo:** `src/components/crm/CrmContactsViewList.tsx`
- Já existe `leadsCountByContact` sendo passado e exibido como badge `{count} leads`
- Melhorar: se `leadsCountByContact[c.id] > 0`, mostrar badge verde **"Em negociação"**; se 0, badge cinza **"Sem negociação"**
- Isso dá clareza visual imediata

### Arquivos afetados

| Arquivo | Mudança |
|---------|---------|
| `src/components/crm/CrmLeadDetailHelpers.tsx` | Sync proposal value → lead value |
| `src/components/crm/CrmCsvImportDialog.tsx` | Mensagem clara pós-importação |
| `src/components/crm/CrmContactsViewDialogs.tsx` | UX fechar contato |
| `src/pages/cliente/ClienteCRMHeader.tsx` | Engrenagem + texto "Configurações" |
| `src/components/crm/CrmContactsViewList.tsx` | Badge "Em negociação" vs "Sem negociação" |


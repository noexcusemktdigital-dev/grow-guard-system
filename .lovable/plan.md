

## Corrigir Formulario de Franquia e Servico

### Mudancas no arquivo `src/pages/ContratosGerador.tsx`

**1. FranchiseContractForm -- Remover obrigatoriedade da proposta**
- Remover todo o card "Proposta Vinculada *" (linhas 476-532)
- Remover `useCrmProposals`, `selectedProposalId`, `selectedProposal` e variaveis derivadas da proposta
- Remover a validacao `if (!selectedProposalId)` no `handleSave` (linha 440)
- Remover `disabled={... || !selectedProposalId}` dos botoes Salvar/Gerar (linhas 617-618)
- Remover badge "Preenchido pela proposta" do card de Taxas
- Manter os campos de taxas (adesao, manutencao) como inputs livres editaveis
- No `handleSave`, usar valores digitados diretamente (sem depender de proposta)

**2. ServiceContractForm -- Quando tem proposta, esconder campos que vem dela**
- Manter a proposta obrigatoria como esta
- Quando `selectedProposal` existe: esconder os cards "Servicos e Prazo" e "Valores e Pagamento" (linhas 308-360), pois esses dados ja vem da proposta exibida no resumo
- Os campos continuam sendo preenchidos via `useEffect` para o `buildContent` funcionar, mas o usuario nao precisa ve-los nem edita-los
- Manter apenas o card "Dados do Contratante" e o card "Proposta Vinculada" visiveis quando ha proposta selecionada

**3. Ajuste na inicializacao**
- Quando vem `proposal_id` pela URL, o tipo default ja e `"assessoria"` (correto, linha 632)
- Passar `initialProposalId` para `FranchiseContractForm` nao e mais necessario (ja removido na linha 748)

### Resumo

| Franquia | Antes | Depois |
|---|---|---|
| Proposta | Obrigatoria | Removida |
| Taxas | Preenchidas pela proposta | Input livre |
| Botoes | Bloqueados sem proposta | Sempre habilitados |

| Assessoria | Antes | Depois |
|---|---|---|
| Proposta | Obrigatoria | Obrigatoria (sem mudanca) |
| Servicos/Valores | Campos editaveis visiveis | Escondidos quando tem proposta |


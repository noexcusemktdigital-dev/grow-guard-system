

## Corrigir: Proposta obrigatoria para Prestacao de Servico, nao Franquia

### Problema atual
A proposta vinculada esta obrigatoria no formulario de **Franquia**, mas deveria ser obrigatoria no formulario de **Prestacao de Servico (Assessoria)** — pois e nesse tipo que os campos de Servicos, Prazo e Valores vem da proposta.

### Mudancas

**Arquivo**: `src/pages/ContratosGerador.tsx`

1. **ServiceContractForm** — Adicionar selecao obrigatoria de proposta vinculada
   - Adicionar select de propostas (igual ao que existe hoje no FranchiseContractForm)
   - Exibir resumo da proposta selecionada (valor, duracao, itens/servicos, pagamento)
   - Auto-preencher campos: `servicos_descricao`, `prazo_meses`, `valor_setup`, `valor_mensal`, `dia_vencimento` a partir da proposta
   - Tornar esses campos somente-leitura ou pre-preenchidos (editaveis para ajustes finos)
   - Bloquear botoes "Salvar" e "Gerar" sem proposta selecionada
   - Remover os inputs manuais de servicos/valores que agora vem da proposta (ou mante-los como readonly com badge "Da proposta")

2. **FranchiseContractForm** — Remover obrigatoriedade da proposta
   - Remover a validacao que exige `selectedProposalId`
   - Tornar a proposta opcional (util mas nao obrigatoria)
   - Habilitar botoes de salvar/gerar independentemente de proposta
   - Manter os campos de taxas (adesao, manutencao) como inputs livres, pois franquia nao depende de proposta

3. **Logica de inicializacao** — Corrigir o default do tipo de contrato
   - Quando vem `proposal_id` pela URL, o tipo default deve ser `"assessoria"` (nao `"franquia"`)

### Resumo de impacto

| Item | Antes | Depois |
|---|---|---|
| Proposta obrigatoria em | Franquia | Prestacao de Servico |
| Franquia sem proposta | Bloqueado | Permitido |
| Assessoria sem proposta | Permitido | Bloqueado |
| URL com proposal_id abre | Franquia | Prestacao de Servico |


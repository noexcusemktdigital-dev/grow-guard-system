

## Plano: Criar Templates Padrao de Contrato (Franquia + Prestacao de Servico)

### Objetivo

Inserir 2 templates padrao na tabela `contract_templates` com o conteudo completo dos PDFs enviados, usando variaveis (placeholders) para todas as informacoes editaveis do cliente/franqueado. Esses templates ficam disponiveis na pagina de Templates de Contratos para uso e edicao.

---

### Template 1: Contrato de Franquia Empresarial

**Tipo**: `franquia`
**Placeholders editaveis**:
- `{{numero_contrato}}` — Numero do contrato
- `{{franqueada_nome}}` — Nome completo / Razao Social
- `{{franqueada_nacionalidade}}` — Nacionalidade
- `{{franqueada_estado_civil}}` — Estado civil
- `{{franqueada_cpf}}` — CPF
- `{{franqueada_rg}}` — RG
- `{{franqueada_email}}` — Email
- `{{franqueada_endereco}}` — Endereco completo
- `{{franqueada_bairro}}` — Bairro
- `{{franqueada_cep}}` — CEP
- `{{franqueada_cidade}}` — Cidade
- `{{franqueada_estado}}` — Estado
- `{{franqueada_cnpj}}` — CNPJ (se PJ)
- `{{franqueada_razao_social}}` — Razao Social (se PJ)
- `{{operador_nome}}` — Nome do socio operador
- `{{taxa_adesao_valor}}` — Valor da taxa de adesao
- `{{taxa_adesao_forma}}` — Forma de pagamento da adesao
- `{{taxa_manutencao_valor}}` — Valor taxa mensal manutencao
- `{{data_assinatura}}` — Data (dia, mes, ano)

### Template 2: Contrato de Prestacao de Servico

**Tipo**: `assessoria`
**Placeholders editaveis**:
- `{{contratante_razao_social}}` — Razao Social
- `{{contratante_cnpj}}` — CNPJ
- `{{contratante_endereco}}` — Endereco completo
- `{{contratante_bairro}}` — Bairro
- `{{contratante_cep}}` — CEP
- `{{contratante_cidade}}` — Cidade
- `{{contratante_estado}}` — Estado
- `{{servicos_descricao}}` — Lista de servicos contratados
- `{{prazo_meses}}` — Duracao em meses
- `{{valor_setup}}` — Valor de setup
- `{{valor_mensal}}` — Valor mensal
- `{{valor_setup_extenso}}` — Valor setup por extenso
- `{{valor_mensal_extenso}}` — Valor mensal por extenso
- `{{dia_vencimento}}` — Dia de vencimento
- `{{data_assinatura}}` — Data (dia, mes, ano)

---

### Implementacao

**1. Atualizar pagina ContratosTemplates.tsx**:
- Adicionar botao "Carregar Templates Padrao" que insere os 2 templates se nao existirem
- Melhorar o editor de conteudo com uma barra lateral de placeholders clicaveis (ao clicar, insere no cursor)
- Adicionar preview do contrato renderizado (substituindo placeholders por dados de exemplo)

**2. Criar arquivo de constantes com o conteudo dos templates**:
- `src/constants/contractTemplates.ts` — conteudo completo dos 2 contratos com placeholders
- Cada template tem: nome, tipo, descricao, conteudo, lista de placeholders

**3. Atualizar hook useContracts.ts**:
- Adicionar mutation `seedDefaultTemplates` que insere os templates padrao se nao existirem (verifica por nome antes de inserir)

**4. Melhorar editor de template**:
- Sidebar com lista de placeholders disponiveis, agrupados por categoria (Dados do Cliente, Valores, Datas)
- Clicar no placeholder insere no textarea na posicao do cursor
- Preview tab que mostra o contrato com dados fictícios preenchidos

---

### Resumo de Arquivos

| Arquivo | Acao |
|---|---|
| `src/constants/contractTemplates.ts` | Criar: conteudo completo dos 2 contratos com placeholders |
| `src/pages/ContratosTemplates.tsx` | Editar: botao seed + editor melhorado com placeholders clicaveis + preview |
| `src/hooks/useContracts.ts` | Editar: adicionar mutation seedDefaultTemplates |


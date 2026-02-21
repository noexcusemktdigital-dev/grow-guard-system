

# Atualizar Templates de Contrato com Base nos Documentos Reais

## Resumo

Atualizar o template de contrato de Assessoria e criar um template de Proposta Comercial baseados nos documentos reais da NOEXCUSE. O contrato real possui 7 clausulas estruturadas (Objeto, Alteracoes, Entregas, Prazo, Pagamento, Rescisao, LGPD, Foro) e a proposta tem um layout com servicos selecionados, resumo financeiro e forma de pagamento.

---

## Alteracoes

### 1. Novos placeholders (`contratosData.ts`)

Adicionar variaveis que existem nos documentos reais mas faltam no sistema:

- `{{cliente_endereco}}` -- endereco completo do contratante
- `{{cliente_telefone}}` -- telefone do contratante
- `{{cliente_rg}}` -- RG/CI do contratante
- `{{duracao_meses}}` -- duracao em meses (ex: "06 (seis)")
- `{{qtd_parcelas}}` -- numero de parcelas
- `{{valor_parcela}}` -- valor de cada parcela
- `{{servicos_descricao}}` -- descricao dos servicos contratados (tabela de produtos)
- `{{data_cidade}}` -- cidade e data por extenso (ex: "Maringa 16 de fevereiro de 2026")
- `{{contratada_nome}}` -- nome da empresa contratada (franqueado/unidade)
- `{{contratada_cnpj}}` -- CNPJ da contratada
- `{{contratada_endereco}}` -- endereco da contratada

### 2. Template de Assessoria -- reescrever (`tpl-1`)

Substituir o conteudo generico atual pelo contrato real estruturado com todas as 7 clausulas:

- Cabecalho com identificacao das partes (CONTRATANTE e CONTRATADA)
- CLAUSULA PRIMEIRA -- DO OBJETO (servicos conforme tabela de produtos)
- CLAUSULA SEGUNDA -- DAS ALTERACOES (prazo para aprovacao, grupos de alteracao)
- CLAUSULA TERCEIRA -- DAS ENTREGAS (prazos, prorrogacao, penalidades)
- CLAUSULA QUARTA -- DO PRAZO (duracao contratual, renovacao por aditivo)
- CLAUSULA QUINTA -- DO PAGAMENTO (valor total, parcelas, juros 2%/mes, protesto, condicoes)
- CLAUSULA SEXTA -- DA RESCISAO (inatividade 60 dias, notificacao 30 dias, quitacao)
- CLAUSULA SETIMA -- DA LGPD (conformidade Lei 13.709/2018, sigilo, notificacao 24h)
- CLAUSULA OITAVA -- DO FORO
- Bloco de assinaturas (contratante, contratada, 2 testemunhas)

### 3. Novo template: Proposta Comercial (`tpl-5`)

Criar template baseado na proposta real:

- Cabecalho: "Proposta Comercial" + data
- "Preparado para:" + nome do cliente
- "Duracao do Projeto:" + duracao
- Secao "Servicos Selecionados" com tabela (Servico | Tipo | Qtd | Valor)
- "Resumo Financeiro" (Total Unitario | Total Mensal)
- "Investimento em Marketing" com forma de pagamento e valores por periodo
- Rodape: "Proposta gerada automaticamente" + validade 30 dias

### 4. Atualizar Gerador (`ContratosGerador.tsx`)

- Adicionar campos no Step 3 (Dados do Cliente): Endereco, RG
- Adicionar campos no Step 4 (Contratacao): Duracao em meses, Qtd parcelas, Valor parcela, Descricao dos servicos (textarea)
- Atualizar `getPreview()` para substituir os novos placeholders
- Adicionar campo "Cidade" no Step 4

### 5. Atualizar Templates page (`ContratosTemplates.tsx`)

- Atualizar o painel lateral de placeholders com as novas variaveis

---

## Detalhes Tecnicos

### Arquivos modificados

```text
src/data/contratosData.ts        -- novos placeholders, reescrever tpl-1, criar tpl-5
src/pages/ContratosGerador.tsx   -- novos campos no wizard, atualizar getPreview
src/pages/ContratosTemplates.tsx -- atualizar painel de placeholders
```

### Interface Contrato -- novos campos opcionais

```text
clienteEndereco?: string
clienteRg?: string
clienteTelefone?: string  (ja existe no Gerador mas nao no tipo)
duracaoMeses?: number
qtdParcelas?: number
valorParcela?: number
servicosDescricao?: string
cidade?: string
```

### Ordem de implementacao
1. contratosData.ts (placeholders, templates, interface)
2. ContratosGerador.tsx (novos campos + preview)
3. ContratosTemplates.tsx (painel atualizado)


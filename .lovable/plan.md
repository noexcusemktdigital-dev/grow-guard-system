

# Puxar Todos os Pagamentos do Asaas (sem filtro por cliente)

## Problema Atual

A funcao `asaas-list-payments` filtra pagamentos por `customer` (ID do cliente Asaas de cada organizacao). Como nenhuma organizacao tem `asaas_customer_id` preenchido, o resultado e sempre vazio (`payments: []`).

O que voce precisa e puxar **todos os pagamentos** da conta Asaas da NoExcuse, independente de qual cliente e — ou seja, listar tudo que foi cobrado/recebido no mes.

## Solucao

### 1. Edge Function `asaas-list-payments/index.ts`

Adicionar um modo `all: true` que busca todos os pagamentos da conta sem filtrar por customer:

```text
Se body.all == true:
  GET /payments?limit=100&offset=0&dateCreated[ge]=startDate&dateCreated[le]=endDate
  (sem parametro customer — retorna TUDO da conta)
Senao:
  comportamento atual (filtra por customer)
```

Tambem buscar o nome do cliente no Asaas para cada pagamento (via campo `customer` retornado pela API) para exibir na tabela.

### 2. Hook `useAsaasNetworkPayments` em `useClientPayments.ts`

Alterar a chamada para enviar `all: true` ao inves de `network: true`, removendo a necessidade de `asaas_customer_id` nas organizacoes.

### 3. Nenhuma mudanca na UI

A tabela de Entradas ja esta pronta para exibir os dados do Asaas. Apenas os dados estavam vazios. Com a correcao, os pagamentos reais vao aparecer automaticamente.

## Detalhes Tecnicos

A API do Asaas no endpoint `GET /payments` sem o parametro `customer` retorna todos os pagamentos da conta. Os filtros de data (`dateCreated[ge]` e `dateCreated[le]`) continuam funcionando normalmente.

Para exibir o nome do cliente, a resposta da API ja inclui o campo `customer` (ID) em cada pagamento. Faremos um segundo request para buscar os nomes dos clientes unicos (`GET /customers/{id}`) e associar ao pagamento.


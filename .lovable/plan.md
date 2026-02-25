
## Corrigir compra de Pacotes de Creditos Avulsos

### Problema identificado

A funcao `asaas-create-charge` nao consegue criar cobranças porque ela exige que a organizacao ja tenha um `asaas_customer_id` cadastrado. Se o cliente nunca fez uma assinatura antes (ou se o ID foi limpo), a funcao retorna erro "No billing customer configured".

A funcao `asaas-create-subscription` ja resolve isso automaticamente criando o cliente no Asaas quando necessario, mas a `asaas-create-charge` nao tem essa logica.

### Solucao

Adicionar auto-criacao do cliente Asaas na funcao `asaas-create-charge`, replicando a mesma logica que ja existe em `asaas-create-subscription`:

1. Quando `asaas_customer_id` for `null`, buscar os dados da organizacao (name, email, cnpj)
2. Criar o cliente na API do Asaas
3. Salvar o `asaas_customer_id` de volta na tabela `organizations`
4. Prosseguir com a criacao da cobranca normalmente

### Detalhes tecnicos

**Arquivo**: `supabase/functions/asaas-create-charge/index.ts`

- Alterar a query do org para incluir `name, cnpj, email, phone` alem de `id, asaas_customer_id`
- Substituir o bloco que retorna erro quando `asaas_customer_id` e null por logica de auto-criacao via `POST /customers` na API Asaas
- Salvar o novo `asaas_customer_id` na org com `UPDATE`
- Usar o ID recem-criado para prosseguir com a cobranca

Nenhuma alteracao de banco de dados, frontend ou outras funcoes e necessaria. O frontend ja chama corretamente a funcao com todos os parametros necessarios.

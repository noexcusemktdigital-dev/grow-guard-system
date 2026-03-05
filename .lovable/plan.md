

## Plano: Atualizar chave Asaas e testar conexão

### O que será feito
1. **Atualizar o secret `ASAAS_API_KEY`** com a chave de produção fornecida
2. **Executar o teste de conexão** via `asaas-test-connection` para validar

### Observação
A chave fornecida segue o padrão correto (`$aact_prod_...`). O sistema já está configurado com o header `access_token` (não Bearer), então basta atualizar o valor e testar.


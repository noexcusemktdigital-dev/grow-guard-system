
# Puxar Pagamentos do Asaas no Controle Financeiro

## O que sera feito

Adicionar uma nova aba **"Pagamentos Asaas"** no Controle Financeiro que busca os pagamentos reais do mes atual direto da API do Asaas, mostrando status, valor, data de vencimento e links de fatura.

## Mudancas

### 1. Edge Function `asaas-list-payments/index.ts`
- Adicionar suporte a filtros opcionais de data (`startDate`, `endDate`) na query para a API do Asaas
- Aceitar `organization_id` como array ou buscar todas as orgs filhas quando receber `network: true`
- Buscar as orgs filhas via `organizations.parent_org_id` para listar pagamentos de toda a rede
- Aumentar o limite de 20 para 100 pagamentos

### 2. Hook `src/hooks/useClientPayments.ts`
- Adicionar um novo hook `useAsaasNetworkPayments()` que:
  - Busca o `orgId` do usuario logado
  - Chama `asaas-list-payments` com `network: true` e filtros do mes atual
  - Retorna a lista de pagamentos formatada

### 3. Pagina `src/pages/FinanceiroControle.tsx`
- Adicionar nova aba **"Pagamentos Asaas"** ao lado das abas existentes
- Tabela mostrando: Cliente, Valor, Vencimento, Data Pagamento, Metodo, Status, Link Fatura
- Badges coloridos para status (CONFIRMED/RECEIVED = verde, PENDING = amarelo, OVERDUE = vermelho)
- Botao para abrir fatura quando disponivel
- Loading state enquanto busca da API

### Fluxo tecnico
1. Usuario abre aba "Pagamentos Asaas"
2. Hook chama edge function com `network: true` + datas do mes atual
3. Edge function busca todas orgs filhas, coleta `asaas_customer_id` de cada uma
4. Faz requisicoes paralelas a API do Asaas para cada customer
5. Retorna lista unificada com nome da org associada
6. UI renderiza tabela com os pagamentos

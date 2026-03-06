

## Plano: Corrigir customer ID inválido e ativar webhook Asaas

### Problema raiz
A organização NOEXCUSE tem `asaas_customer_id = cus_000007603914` salvo no banco — esse é um ID de **sandbox**. A API agora aponta para **produção** (`api.asaas.com/v3`), então o Asaas rejeita como `invalid_customer`.

### Ações

**1. Limpar o customer ID de sandbox do banco**
- UPDATE na tabela `organizations` para setar `asaas_customer_id = NULL` onde o valor começa com padrão sandbox
- Na próxima tentativa de assinatura, o `getOrCreateAsaasCustomer` vai criar um cliente novo na API de produção automaticamente

**2. Sobre o webhook**
- O webhook (`asaas-webhook`) precisa estar ativo no painel Asaas para receber notificações de pagamento (confirmação, vencimento, estorno)
- A URL do webhook é: `https://gxrhdpbbxfipeopdyygn.supabase.co/functions/v1/asaas-webhook`
- Você precisa ativá-lo no painel do Asaas (Integrações → Webhooks) apontando para essa URL
- Isso **não** bloqueia a criação de cobranças, mas sem ele os status de pagamento não serão atualizados automaticamente

### Resultado esperado
Após limpar o customer ID sandbox, a próxima tentativa de assinatura vai criar um cliente de produção válido e a cobrança será gerada com sucesso.


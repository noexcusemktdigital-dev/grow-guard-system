

## Fix: Cartão de Crédito — "Conexão recusada" no iframe

### Problema
O Asaas bloqueia carregamento via iframe (cabeçalhos `X-Frame-Options` / CSP), então a `invoice_url` para pagamento com cartão de crédito não renderiza dentro do dialog. PIX e Boleto funcionam porque usam dados inline (QR code / PDF do boleto), mas o cartão depende da página do Asaas.

### Solução
Substituir o iframe por um botão que abre a `invoice_url` em nova aba. Mostrar uma mensagem clara ao usuário.

### Arquivos a editar

**1. `src/pages/cliente/ClientePlanoCreditos.tsx`** (linhas 277-287)
- Remover o `<iframe>` do fallback (CREDIT_CARD)
- Adicionar botão "Abrir página de pagamento" com `window.open(invoice_url, "_blank")`
- Mostrar texto explicativo: "Clique abaixo para completar o pagamento com cartão"

**2. `src/components/franqueado/SystemPaymentTab.tsx`** (linhas ~163-170)
- Mesmo fix: trocar iframe por botão para CREDIT_CARD
- Manter iframe apenas para BOLETO (que funciona via PDF)

### Resultado
Cartão de crédito abrirá o checkout do Asaas em nova aba em vez de tentar carregar dentro de um iframe bloqueado.


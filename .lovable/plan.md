

## Pagamento inline de Creditos Avulsos

### Problema
Ao comprar creditos avulsos, o sistema redireciona para uma pagina externa do Asaas (`window.open(invoice_url)`). O usuario quer ver o PIX, boleto ou dados do cartao diretamente dentro da plataforma.

### Solucao

Transformar o `CreditPackDialog` em um fluxo de 2 etapas: primeiro o usuario escolhe a forma de pagamento e confirma, depois o sistema mostra os dados de pagamento inline (sem sair da plataforma).

### Etapas do fluxo

**Etapa 1 - Selecao** (ja existe):
- Escolher forma de pagamento (PIX, Boleto, Cartao)
- Clicar em "Comprar"

**Etapa 2 - Exibicao do pagamento** (nova):
- **PIX**: Exibir o QR Code como imagem (`pix_qr_code` retornado pela API) + codigo copia-e-cola + botao "Copiar codigo"
- **Boleto**: Exibir o boleto em um iframe inline (`bank_slip_url`) + botao para baixar PDF
- **Cartao de Credito**: Como o Asaas nao oferece tokenizacao direta sem SDK JS, exibir o link de pagamento inline em iframe (`invoice_url`)

O dialog permanece aberto apos a criacao da cobranca, mostrando as instrucoes de pagamento. Um botao "Fechar" permite sair quando quiser.

### Detalhes tecnicos

**Arquivo**: `src/pages/cliente/ClientePlanoCreditos.tsx`

Alteracoes no componente `CreditPackDialog`:

1. Adicionar estado `paymentResult` para armazenar os dados retornados pela API (`invoice_url`, `bank_slip_url`, `pix_qr_code`, `value`)
2. No `onSuccess` da mutation, em vez de `window.open()`, salvar o resultado em `paymentResult`
3. Renderizar condicionalmente:
   - Se `paymentResult` e null: mostrar tela de selecao (atual)
   - Se `paymentResult` tem dados: mostrar tela de pagamento inline
4. Na tela de pagamento inline:
   - PIX: tag `<img>` com `src={paymentResult.pix_qr_code}` + texto "Escaneie o QR Code ou copie o codigo"
   - Boleto: `<iframe>` com `src={paymentResult.bank_slip_url}` + botao "Abrir Boleto"
   - Cartao: `<iframe>` com `src={paymentResult.invoice_url}` para checkout hosted
5. Resetar `paymentResult` ao fechar o dialog

**Arquivo**: `supabase/functions/asaas-create-charge/index.ts`

Adicionar o campo `pix_transaction` na resposta para obter o codigo copia-e-cola do PIX:
- Apos criar o pagamento com `billingType: "PIX"`, fazer uma chamada adicional `GET /payments/{id}/pixQrCode` na API do Asaas para obter o `encodedImage` (base64 do QR code) e `payload` (codigo copia-e-cola)
- Retornar esses campos na resposta: `pix_qr_code_base64`, `pix_copy_paste`

Nenhuma alteracao de banco de dados necessaria.

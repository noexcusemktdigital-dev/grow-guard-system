

# PIX QR Code Inline para Cobranças de Franqueados

## Situacao Atual

As funcoes `asaas-charge-client` e `asaas-create-charge` ja buscam o QR Code PIX inline apos criar a cobranca, e as UIs de `FinanceiroControle`, `SystemPaymentTab` e `ClientePlanoCreditos` ja exibem o QR code. A unica lacuna esta no fluxo de cobranca de franqueados:

- `asaas-charge-franchisee` nao importa nem usa `fetchPixQrCode`
- `FinanceiroRepasse.tsx` nao tem UI para exibir QR Code PIX individual por cobranca

## Alteracoes

### 1. Edge Function `asaas-charge-franchisee`
- Importar `fetchPixQrCode` do shared helper
- Apos criar cada cobranca com `billingType === "PIX"`, chamar `fetchPixQrCode` para obter `encodedImage` e `payload`
- Retornar `pix_qr_code` e `pix_copy_paste` no resultado de cada franqueado

### 2. Pagina `FinanceiroRepasse.tsx`
- Adicionar seletor de metodo de pagamento (PIX / BOLETO) antes de gerar cobranças
- Adicionar dialog para visualizar QR Code PIX inline ao clicar em uma cobranca pendente na tabela
- Botao "Ver PIX" nas linhas da tabela que tenham `asaas_payment_id` e `billing_type === "PIX"`
- O dialog faz uma chamada a uma nova edge function `asaas-get-pix` para buscar o QR code de uma cobranca existente
- Inclui botao "Copiar codigo" para o copia-e-cola

### 3. Nova Edge Function `asaas-get-pix`
- Recebe `payment_id` (Asaas payment ID)
- Usa `fetchPixQrCode` para buscar e retornar o QR code
- Permite visualizar QR code de cobranças ja geradas anteriormente

## Arquivos

| Arquivo | Acao |
|---------|------|
| `supabase/functions/asaas-charge-franchisee/index.ts` | Importar e usar `fetchPixQrCode` para cobranças PIX |
| `supabase/functions/asaas-get-pix/index.ts` | Nova funcao para buscar QR code de cobranca existente |
| `src/pages/FinanceiroRepasse.tsx` | Seletor de billing type + dialog com QR code inline |


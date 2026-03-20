

# Cobrar Créditos na Geração (não na aprovação)

## Problema

Hoje os créditos são debitados apenas quando o cliente clica "Aprovar". Porém, o botão "Baixar" está disponível antes da aprovação, permitindo que o cliente use a arte sem nunca aprovar — gerando artes de graça.

## Solução

Cobrar os créditos **no momento da geração** (antes de chamar a edge function). A aprovação passa a ser apenas um marcador de status interno (sem custo adicional).

## Mudanças

### 1. Edge function `generate-social-image` — debitar antes de gerar

Adicionar chamada `debit_credits` no início da edge function, antes de chamar a IA. Se o saldo for insuficiente, retornar erro 402 sem gerar nada. Isso garante que mesmo chamadas diretas à API cobram créditos.

### 2. `useClientePosts.ts` — remover débito do `useApprovePost`

O hook `useApprovePost` deixa de chamar `debit_credits`. Passa apenas a atualizar o status do post para `approved` (sem custo).

### 3. `PostResult.tsx` — remover menção a créditos no botão Aprovar

- Botão "Aprovar (X créditos)" → "Aprovar" (sem custo, já foi cobrado)
- Botão "Baixar" continua disponível (agora já foi pago na geração)
- Botão "Regenerar" mostra aviso de que será cobrado novamente

### 4. `PostResult.tsx` — aviso no Regenerar

O botão "Regenerar" exibe um confirm dialog: "Regenerar custará X créditos. Deseja continuar?" — pois cada geração agora é cobrada.

### 5. Validação pré-geração no frontend

No `ClienteRedesSociais.tsx`, antes de chamar `generatePost.mutateAsync`, verificar se `postQuota.canAffordArt` (ou vídeo). Se não puder, mostrar o `InsufficientCreditsDialog` sem chamar a edge function.

## Arquivos modificados

| Arquivo | Mudança |
|---------|---------|
| `supabase/functions/generate-social-image/index.ts` | Adicionar `debit_credits` via service role antes da geração |
| `src/hooks/useClientePosts.ts` | Remover débito do `useApprovePost`, invalidar wallet após geração |
| `src/components/cliente/social/PostResult.tsx` | Remover custo do botão Aprovar, adicionar confirm no Regenerar |
| `src/pages/cliente/ClienteRedesSociais.tsx` | Validação pré-geração de saldo |

## Fluxo final

```text
Cliente clica "Gerar"
  → Frontend valida saldo
  → Edge function debita créditos
  → Edge function gera imagem
  → Resultado exibido (já pago)
  → "Baixar" disponível (sem problema)
  → "Aprovar" apenas marca status
  → "Regenerar" avisa que cobra novamente
```


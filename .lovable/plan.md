

# Corrigir Filtragem de Grupos no WhatsApp Webhook

## Problema

O webhook recebe mensagens de grupo com `chatId` no formato `XXXXX@g.us`. O codigo atual (linha 76) remove `@g.us` antes de verificar se e grupo (linha 84), resultando num telefone como `5511999-1609459200` que nao bate com nenhum filtro. Assim, mensagens de grupo sao salvas como contatos individuais.

## Solucao

Verificar se o `chatId` contem `@g.us` ou `@broadcast` **antes** de limpar o telefone. Tambem adicionar uma segunda camada de protecao no frontend.

## Alteracoes

### 1. `supabase/functions/whatsapp-webhook/index.ts`

Mover a verificacao de grupo para **antes** da limpeza do phone:

```typescript
// Linha 76 - Detectar grupo/broadcast pelo chatId ORIGINAL
const rawChatId = body.chatId || "";
const isGroup = rawChatId.includes("@g.us");
const isBroadcast = rawChatId.includes("@broadcast");

const phone = body.phone || rawChatId.replace("@c.us", "").replace("@g.us", "");
if (!phone) { ... }

// Linha 84 - Expandir filtro
if (isGroup || isBroadcast || phone.includes("-")) {
  return new Response(JSON.stringify({ ok: true, skipped: "group_or_broadcast" }), { ... });
}
```

### 2. `src/hooks/useWhatsApp.ts` (frontend - defesa extra)

Melhorar o filtro de contatos no frontend para tambem excluir telefones com formato de grupo (numeros com hifen seguido de numeros longos):

```typescript
const filtered = (data || []).filter((c: any) => {
  const phone = c.phone || "";
  return !phone.endsWith("-group") 
    && !phone.includes("@broadcast")
    && !phone.includes("@g.us")
    && !/^\d+-\d{10,}$/.test(phone);  // formato grupo Z-API
});
```

## Arquivos modificados

| Arquivo | Alteracao |
|---------|-----------|
| `supabase/functions/whatsapp-webhook/index.ts` | Detectar `@g.us` antes de limpar chatId |
| `src/hooks/useWhatsApp.ts` | Filtro extra no frontend |


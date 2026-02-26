

## Fotos de Perfil dos Contatos WhatsApp

### Problema
O campo `photo_url` existe na tabela `whatsapp_contacts`, mas nunca e preenchido. O webhook salva o contato sem buscar a foto de perfil no WhatsApp.

### Solucao

**Arquivo**: `supabase/functions/whatsapp-webhook/index.ts`

Apos criar ou atualizar um contato, buscar a foto de perfil via Z-API usando o endpoint:
```
GET https://api.z-api.io/instances/{id}/token/{token}/profile-picture?phone={phone}
```

Logica:
1. Apos o upsert do contato, verificar se `photo_url` ja existe (para nao buscar toda vez)
2. Se nao existir, chamar o endpoint da Z-API para obter a URL da foto
3. Atualizar o campo `photo_url` do contato com a URL retornada
4. Fazer isso de forma "fire and forget" para nao atrasar o webhook

### Detalhes tecnicos

- O endpoint retorna um JSON com a URL da foto (geralmente `{ "link": "https://..." }`)
- Precisamos do `instance_id`, `token` e `client_token` da instancia (ja disponivel no webhook)
- A busca sera feita apenas quando `photo_url` for null (primeira vez ou contato novo)
- Para contatos existentes sem foto, tambem busca na primeira interacao apos o deploy

### Alteracoes no webhook (~linha 113-145)

```typescript
// Apos upsert, buscar foto se nao tiver
const needsPhoto = !existingContact || !(existingContact as any).photo_url;
if (needsPhoto) {
  try {
    const picUrl = `https://api.z-api.io/instances/${instance.instance_id}/token/${instance.token}/profile-picture?phone=${phone}`;
    const picRes = await fetch(picUrl, {
      headers: { "Client-Token": instance.client_token },
    });
    if (picRes.ok) {
      const picData = await picRes.json();
      const photoUrl = picData.link || picData.url || null;
      if (photoUrl) {
        await adminClient
          .from("whatsapp_contacts")
          .update({ photo_url: photoUrl })
          .eq("id", contactId);
      }
    }
  } catch (e) {
    console.error("Failed to fetch profile picture:", e);
  }
}
```

Tambem preciso atualizar o `select` do contato existente (linha 115) para incluir `photo_url`:
```typescript
.select("id, unread_count, photo_url")
```

### UI
A interface ja usa `contact.photo_url` no `ChatContactItem` e no `ChatConversation` (Avatar components). Assim que a URL for salva no banco, as fotos aparecerao automaticamente.

### Impacto
- 1 arquivo alterado (webhook)
- Fotos aparecem automaticamente na lista de contatos e no cabecalho da conversa
- Sem mudancas no frontend (ja preparado)
- Deploy automatico


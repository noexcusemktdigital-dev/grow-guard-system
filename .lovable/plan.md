

## Problema Identificado

Dois problemas concretos:

1. **Instância NOEXCUSE está `disconnected` no banco** — O `check-status` chama `http://129.121.44.154:8080/instance/connectionState/NOEXCUSE` e a Evolution API retorna 404 (`"The NOEXCUSE instance does not exist"`). Isso pode ser por diferença de case ou porque a instância foi recriada com outro nome no Evolution. O status no banco fica `disconnected` mesmo que no painel da Easytec apareça conectado.

2. **`whatsapp-sync-photos` só suporta Z-API** — Quando não encontra nenhuma instância com `status = connected`, retorna erro 400. Mesmo que encontrasse, usa URLs da Z-API (hardcoded), não funciona com Evolution.

---

## Plano de Correção

### 1. Corrigir `whatsapp-sync-photos` para suportar Evolution ou pular graciosamente
**Arquivo:** `supabase/functions/whatsapp-sync-photos/index.ts`
- Ao buscar instância conectada, filtrar por `provider = 'zapi'` (já que sync-photos usa endpoints Z-API)
- Se não encontrar instância Z-API conectada, retornar `{ success: true, photos_updated: 0, skipped: "no_zapi_instance" }` em vez de erro 400
- Isso elimina o erro na tela

### 2. Adicionar botão "Reconectar" na UI para Evolution
**Arquivo:** `src/pages/cliente/ClienteIntegracoes.tsx`
- No `InstanceCard`, quando `status === "disconnected"` e `provider === "evolution"`, mostrar botão "Reconectar" que chama `action: "connect"` com os dados existentes da instância
- Isso tenta recriar/reconectar a instância no Evolution sem precisar abrir o dialog de edição

### 3. Melhorar check-status do Evolution no edge function
**Arquivo:** `supabase/functions/whatsapp-setup/index.ts`
- No bloco `check-status` para Evolution, quando `connectionState` retorna 404, tentar endpoint alternativo `/instance/fetchInstances` para listar todas as instâncias e encontrar pelo nome (case-insensitive)
- Logar o erro detalhado para facilitar debug

### 4. Adicionar "Listar instâncias" no Diagnóstico
**Arquivo:** `src/pages/cliente/ClienteIntegracoes.tsx` (DiagnosticsDialog)
- Para instâncias Evolution com erro, chamar a Evolution API via edge function para listar instâncias disponíveis no servidor e mostrar ao usuário, permitindo corrigir o nome

---

### Detalhes Técnicos

**whatsapp-sync-photos** — Mudança na query:
```sql
.eq("provider", "zapi")  -- adicionar filtro
```
E retornar sucesso vazio em vez de 400.

**whatsapp-setup check-status** — Fallback:
```typescript
// Se connectionState retorna 404, tentar listar instâncias
const listRes = await fetch(`${inst.base_url}/instance/fetchInstances`, {
  headers: { apikey: inst.client_token }
});
// Procurar instância pelo nome (case-insensitive)
```

**UI Reconectar** — No InstanceCard, novo botão que chama:
```typescript
setupMutation.mutateAsync({
  action: "connect",
  provider: "evolution", 
  baseUrl: instance.base_url,
  apiKey: instance.client_token,
  instanceName: instance.instance_id,
  label: instance.label
});
```


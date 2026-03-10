

## Criar instância Evolution antes de configurar

### Problema
Os logs confirmam: `The "NOEXCUSE" instance does not exist` (404). O fluxo de connect nunca cria a instância no servidor Evolution.

### Correção

**`supabase/functions/whatsapp-setup/index.ts`** — No bloco Evolution connect (após linha 178), adicionar criação da instância antes de configurar webhooks:

1. **Criar instância** via `POST {baseUrl}/instance/create` com body:
```json
{
  "instanceName": "<instanceName>",
  "token": "<apiKey>",
  "qrcode": true
}
```

2. **Ignorar se já existir** (status 403/409) — logar e continuar normalmente.

3. Manter fluxo existente: webhook → connectionState → upsert DB.

### Fluxo corrigido
```text
1. POST /instance/create          ← NOVO
2. POST /webhook/set/{name}       (existente)
3. GET /instance/connectionState  (existente)
4. Upsert no banco                (existente)
```

Apenas 1 arquivo modificado.


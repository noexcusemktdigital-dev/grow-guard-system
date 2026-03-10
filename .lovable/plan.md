

## Integração Dual: Evolution API como segundo fornecedor WhatsApp

### Resumo
Adicionar suporte à **Evolution API** como alternativa ao Z-API. Na tela de setup, o usuário escolhe entre Z-API ou Evolution antes de inserir credenciais. O sistema roteia chamadas (envio, webhook, status) de acordo com o `provider` salvo na instância.

### Mudanças no Banco de Dados

**Migração**: Adicionar coluna `provider` à tabela `whatsapp_instances`:
```sql
ALTER TABLE whatsapp_instances 
  ADD COLUMN IF NOT EXISTS provider TEXT NOT NULL DEFAULT 'zapi';

-- Para Evolution: armazena a base_url (ex: http://129.121.44.154:8080)
-- e api_key global no campo client_token (reaproveitado)
ALTER TABLE whatsapp_instances 
  ADD COLUMN IF NOT EXISTS base_url TEXT DEFAULT NULL;
```

### Nova Edge Function: `evolution-webhook`
- Recebe eventos da Evolution API (MESSAGES_UPSERT, CONNECTION_UPDATE, etc.)
- Mapeia o formato de payload da Evolution para o mesmo schema do banco (`whatsapp_messages`, `whatsapp_contacts`)
- Rota: `/functions/v1/evolution-webhook/{org_id}`

### Alterações em Edge Functions Existentes

1. **`whatsapp-setup/index.ts`**
   - Aceitar `provider` no body (`"zapi"` | `"evolution"`)
   - Para Evolution: validar `baseUrl` + `apiKey` + `instanceName`
   - Configurar webhook da Evolution via `POST {baseUrl}/webhook/set/{instanceName}`
   - Check-status via `GET {baseUrl}/instance/connectionState/{instanceName}`
   - Salvar `provider`, `base_url` na tabela

2. **`whatsapp-send/index.ts`**
   - Verificar `instance.provider` antes de montar a chamada
   - Z-API: lógica atual (inalterada)
   - Evolution: `POST {baseUrl}/message/sendText/{instanceName}` com header `apikey`

3. **`whatsapp-webhook/index.ts`** (Z-API)
   - Sem alterações — continua recebendo apenas webhooks Z-API

### Alterações no Frontend

1. **`WhatsAppSetupWizard.tsx`**
   - Step 1: Adicionar seletor de fornecedor (Z-API vs Evolution API)
   - Steps 2-3: Conteúdo condicional — instruções específicas do fornecedor selecionado
   - Step 4: Campos de credenciais diferentes por provider:
     - Z-API: Instance ID, Token, Client-Token (atual)
     - Evolution: URL da API, API Key, Nome da Instância
   - Step 5: Conexão via mesmo hook, passando `provider`

2. **`useWhatsApp.ts`**
   - `useSetupWhatsApp`: Aceitar params adicionais (`provider`, `baseUrl`, `apiKey`, `instanceName`)
   - Interface `WhatsAppInstance`: Adicionar `provider` e `base_url`

### Arquivos Novos
- `supabase/functions/evolution-webhook/index.ts`

### Arquivos Modificados
- `supabase/functions/whatsapp-setup/index.ts`
- `supabase/functions/whatsapp-send/index.ts`
- `src/components/cliente/WhatsAppSetupWizard.tsx`
- `src/hooks/useWhatsApp.ts`
- 1 migração SQL

### Dados da Evolution API (baseado nos screenshots)
- **Base URL**: configurável (self-hosted), ex: `http://129.121.44.154:8080`
- **Auth**: header `apikey` com chave global
- **Endpoints**:
  - Status: `GET /instance/connectionState/{instanceName}`
  - Envio texto: `POST /message/sendText/{instanceName}`
  - Envio mídia: `POST /message/sendMedia/{instanceName}`
  - Webhook config: `POST /webhook/set/{instanceName}`
- **Webhook events**: `MESSAGES_UPSERT`, `MESSAGES_UPDATE`, `CONNECTION_UPDATE`, `QRCODE_UPDATED`


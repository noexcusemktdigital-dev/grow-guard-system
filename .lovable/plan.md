

## Melhorias na Ferramenta Conversas — Fotos, Áudio e Bloqueio por Plano

### Diagnóstico

1. **Fotos dos contatos não aparecem**: A Edge Function `whatsapp-sync-photos` está hardcoded para usar Z-API (`provider: "zapi"`), mas o sistema agora usa Izitech (Evolution API v1). Resultado: a function retorna `skipped: "no_zapi_instance"` e nunca busca fotos.

2. **Envio de áudio funciona** — o código já tem `startRecording`/`stopRecording` com MediaRecorder completo em `ChatConversation.tsx`. Preciso verificar se existe algum bloqueio visual ou de permissão que impede o botão de aparecer.

3. **Bloqueio para Starter/Trial**: O `FeatureGateOverlay` já existe e funciona para `/cliente/chat` via `plan_locked` (quando `hasWhatsApp: false`). Porém, o overlay bloqueia completamente a tela — o pedido é que o conteúdo fique visível com fundo desfocado e um aviso explicativo sobre a ferramenta + como desbloquear.

### Plano de Ação

**1. Corrigir `whatsapp-sync-photos` para Evolution API** 
- Remover a filtragem `provider: "zapi"` 
- Adicionar suporte a Evolution API: endpoint `GET {baseUrl}/chat/fetchProfilePictureUrl/{instanceId}?number={phone}` para buscar fotos
- Manter fallback gracioso se a API não retornar foto

**2. Melhorar o FeatureGateOverlay para mostrar conteúdo desfocado**
- Em vez de `backdrop-blur-md bg-background/60` cobrindo tudo, manter o conteúdo real da página visível por trás com blur mais leve
- Adicionar descrição contextual por ferramenta (Conversas = "Espelhe seu WhatsApp e gerencie atendimentos...", CRM = "Gerencie leads e pipeline...", etc.)
- Manter botões de upgrade e navegação

**3. Verificar e corrigir envio de áudio**
- O código de gravação já existe; investigar se o botão do microfone está sendo renderizado corretamente no `ChatConversationInput`
- Confirmar que o upload para `chat-media` e envio via Evolution API estão funcionando (o `whatsapp-send` já suporta Evolution para mídia/áudio)

### Arquivos afetados

| Arquivo | Mudança |
|---------|---------|
| `supabase/functions/whatsapp-sync-photos/index.ts` | Suporte a Evolution API para buscar fotos de perfil |
| `src/components/FeatureGateOverlay.tsx` | Redesign: conteúdo desfocado visível + descrição da ferramenta |
| `src/components/cliente/ChatConversation.tsx` | Verificar/corrigir fluxo de áudio se necessário |

### Detalhes técnicos

**Evolution API — Profile Picture**:
```
GET {instance.base_url}/chat/fetchProfilePictureUrl/{instance.instance_id}
Body: { "number": "5511999999999" }
Headers: { "apikey": instance.client_token }
```

A function precisa buscar a instância sem filtrar por `provider: "zapi"`, e usar o endpoint correto dependendo do provider da instância encontrada.


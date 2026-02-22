

# Integracao WhatsApp com Z-API -- Chat + Disparos

## Resumo

Implementar a integracao completa com Z-API para WhatsApp, incluindo: (1) pagina de configuracao guiada na area de Integracoes, onde o cliente conecta sua instancia Z-API; (2) Chat WhatsApp funcional com envio e recebimento de mensagens em tempo real; (3) Disparos conectados a Z-API para envio real de mensagens. O agente de IA sera tratado separadamente, em um passo futuro.

## Entrega dividida em 4 etapas

### Etapa 1 -- Infraestrutura: Tabelas + Edge Functions

**Novas tabelas no banco de dados:**

1. `whatsapp_instances` -- armazena a conexao Z-API de cada organizacao
   - `id` (uuid, PK)
   - `organization_id` (uuid, unique) -- 1 instancia por org
   - `instance_id` (text) -- ID da instancia Z-API
   - `token` (text) -- token da instancia
   - `client_token` (text) -- token de seguranca da conta Z-API
   - `status` (text, default 'disconnected') -- connected, disconnected, qr_pending
   - `phone_number` (text, nullable) -- numero conectado
   - `webhook_url` (text, nullable) -- URL do webhook configurada
   - `created_at`, `updated_at` (timestamps)
   - RLS: membros da org podem SELECT; cliente_admin pode INSERT/UPDATE/DELETE

2. `whatsapp_contacts` -- contatos do WhatsApp
   - `id` (uuid, PK)
   - `organization_id` (uuid)
   - `phone` (text) -- numero do contato
   - `name` (text, nullable) -- nome do contato
   - `photo_url` (text, nullable)
   - `last_message_at` (timestamptz, nullable)
   - `unread_count` (int, default 0)
   - `created_at`, `updated_at`
   - RLS: membros da org

3. `whatsapp_messages` -- historico de mensagens
   - `id` (uuid, PK)
   - `organization_id` (uuid)
   - `contact_id` (uuid, FK -> whatsapp_contacts)
   - `message_id_zapi` (text, nullable) -- ID da mensagem na Z-API
   - `direction` (text) -- 'inbound' ou 'outbound'
   - `type` (text, default 'text') -- text, image, audio, video, document
   - `content` (text, nullable) -- texto da mensagem
   - `media_url` (text, nullable) -- URL da midia
   - `status` (text, default 'pending') -- pending, sent, delivered, read, failed
   - `metadata` (jsonb, default '{}')
   - `created_at` (timestamptz)
   - RLS: membros da org
   - Realtime habilitado para atualizacoes em tempo real

**Edge Functions:**

1. `whatsapp-send` -- envia mensagem via Z-API
   - Recebe: `contactPhone`, `message`, `type`
   - Busca credenciais da instancia Z-API no banco
   - Faz POST para `https://api.z-api.io/instances/{id}/token/{token}/send-text`
   - Salva mensagem na tabela `whatsapp_messages`

2. `whatsapp-webhook` -- recebe webhooks da Z-API (publica, sem JWT)
   - Recebe callbacks de mensagens recebidas (`ReceivedCallback`)
   - Identifica a organizacao pelo `instance_id` no path ou header
   - Cria/atualiza contato em `whatsapp_contacts`
   - Insere mensagem em `whatsapp_messages`
   - Atualiza `unread_count` do contato

3. `whatsapp-setup` -- configura webhooks na Z-API
   - Chamada apos o cliente salvar credenciais
   - Faz PUT para `/update-webhook-received` na Z-API, apontando para a URL do nosso webhook
   - Verifica status da conexao da instancia
   - Atualiza status em `whatsapp_instances`

### Etapa 2 -- Pagina de Integracoes (Setup Guiado)

Substituir o placeholder `ClienteIntegracoes.tsx` por um wizard de configuracao:

- **Card Z-API/WhatsApp** com status da conexao (Conectado/Desconectado)
- Ao clicar "Configurar", abre Sheet com 3 passos:
  1. **Criar conta Z-API**: instrucoes visuais com link para z-api.io, explicando como criar conta e instancia
  2. **Inserir credenciais**: campos para Instance ID, Token e Client-Token
  3. **Conectar**: botao que chama `whatsapp-setup`, configura webhooks automaticamente, mostra status
- Apos conectado, exibe card com numero conectado, status verde, botao de desconectar/reconfigurar

### Etapa 3 -- Chat WhatsApp (UI Funcional)

Substituir o placeholder `ClienteChat.tsx` por um chat completo:

- **Layout duas colunas**:
  - Esquerda: lista de conversas (contatos), busca, filtros por status
  - Direita: area de conversa com bolhas de mensagem, input de texto, botao enviar
- **Funcionalidades**:
  - Lista de contatos ordenada por ultima mensagem
  - Bolhas de mensagem com direcao (enviada/recebida), horario, status (checkmarks)
  - Input de mensagem com envio via `whatsapp-send`
  - Realtime: novas mensagens aparecem instantaneamente via Supabase Realtime
  - Marcacao de leitura ao abrir conversa (zera `unread_count`)
  - Badge de nao lidas na lista de contatos
- **Estado vazio**: quando nao ha instancia conectada, mostra CTA para ir em Integracoes

### Etapa 4 -- Disparos conectados a Z-API

Atualizar `ClienteDisparos.tsx` para enviar mensagens reais:

- Ao criar disparo, verificar se tem instancia Z-API conectada
- Botao "Enviar agora" chama `whatsapp-send` para cada destinatario
- Atualizar status do disparo para "sending" -> "sent"
- Exibir alerta se nao houver instancia conectada

## Arquivos envolvidos

| Acao | Arquivo |
|------|---------|
| Migration | Tabelas `whatsapp_instances`, `whatsapp_contacts`, `whatsapp_messages` |
| Criar | `supabase/functions/whatsapp-send/index.ts` |
| Criar | `supabase/functions/whatsapp-webhook/index.ts` |
| Criar | `supabase/functions/whatsapp-setup/index.ts` |
| Criar | `src/hooks/useWhatsApp.ts` (hook para instancia, contatos, mensagens) |
| Criar | `src/components/cliente/WhatsAppSetupWizard.tsx` |
| Criar | `src/components/cliente/ChatConversation.tsx` |
| Criar | `src/components/cliente/ChatContactList.tsx` |
| Criar | `src/components/cliente/ChatMessageBubble.tsx` |
| Editar | `src/pages/cliente/ClienteIntegracoes.tsx` |
| Editar | `src/pages/cliente/ClienteChat.tsx` |
| Editar | `src/pages/cliente/ClienteDisparos.tsx` |
| Editar | `supabase/config.toml` (adicionar functions) |

## Detalhes Tecnicos

- As credenciais Z-API (instance_id, token, client_token) sao armazenadas na tabela `whatsapp_instances` com RLS restrito. As edge functions acessam via service_role_key para fazer chamadas a Z-API.
- O webhook `whatsapp-webhook` e publico (sem JWT) pois recebe callbacks da Z-API. A autenticidade e validada pelo `client_token` no header.
- Realtime habilitado na tabela `whatsapp_messages` para atualizar o chat instantaneamente.
- A URL do webhook sera: `https://gxrhdpbbxfipeopdyygn.supabase.co/functions/v1/whatsapp-webhook/{org_id}` -- o `org_id` no path permite identificar a organizacao.
- O fluxo de envio: Frontend -> Edge Function `whatsapp-send` -> Z-API API -> WhatsApp. O retorno de status (delivered/read) chega via webhook.
- Nenhuma API key externa precisa ser configurada como secret do projeto -- cada organizacao armazena suas proprias credenciais Z-API no banco.

## Ordem de implementacao sugerida

Como e bastante codigo, sugiro implementar em mensagens separadas:
1. Primeiro: tabelas + edge functions (infraestrutura)
2. Segundo: pagina de Integracoes com setup guiado
3. Terceiro: Chat WhatsApp funcional
4. Quarto: Disparos conectados


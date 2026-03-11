

## Plano: Registrar instância "noexcuse" para envio de mensagens

### Contexto
A instância "noexcuse" já existe e está conectada na Evolution API (`http://129.121.44.154:8080`). O webhook aponta para outro projeto (`mdmhsqcfmpyufohxjsrv`) — isso é correto e não deve ser alterado. Este projeto precisa apenas de um registro local na tabela `whatsapp_instances` para enviar mensagens via `whatsapp-send`.

### O que será feito

**1. Inserir registro na tabela `whatsapp_instances`**

Campos:
- `organization_id`: `adb09618-e9f3-4dbd-a89c-29e3eb1bec9f` (NOEXCUSE)
- `instance_id`: `noexcuse`
- `token`: (vazio — não usado para Evolution)
- `client_token`: `99808b60-2f06-4f00-94b7-89765259b66d` (apikey da Evolution)
- `status`: `connected`
- `provider`: `evolution`
- `base_url`: `http://129.121.44.154:8080`
- `label`: `noexcuse`
- `webhook_url`: `https://mdmhsqcfmpyufohxjsrv.supabase.co/functions/v1/evolution-webhook` (somente referência — não será alterado)

**2. Verificar que `whatsapp-send` já funciona corretamente**

O edge function `whatsapp-send` já:
- Resolve a instância pelo `organization_id`
- Para provider `evolution`, usa `base_url` + `client_token` (apikey header)
- Envia via `POST {base_url}/message/sendText/{instance_id}`
- Não toca no webhook

Nenhuma alteração no código do `whatsapp-send` é necessária.

**3. Garantir que `whatsapp-setup` não reconfigure o webhook**

Já verificado: o `check-status` atual é **read-only** — apenas loga divergência de webhook sem sobrescrever. As ações `reconfigure-webhook` e `check-webhook` são manuais (requerem action explícito), não automáticas.

### Resultado
- A tela `/cliente/chat` vai detectar a instância como `connected`
- O envio de mensagens funcionará via Evolution API
- Mensagens recebidas NÃO chegarão neste projeto (webhook aponta para outro) — isso é esperado
- Nenhum código será alterado, apenas um INSERT no banco


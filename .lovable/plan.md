

# Correcoes: Numero WhatsApp, Canal fixo e Transbordo

## Resumo

Tres ajustes: (1) buscar o numero real do telefone via endpoint `/device` da Z-API, (2) fixar o canal como WhatsApp removendo o seletor, (3) explicar e renomear "transbordo".

---

## 1. Buscar numero real do WhatsApp via endpoint `/device`

O endpoint `/status` da Z-API **nao retorna o numero do telefone**. O campo `phoneConnected` nao existe na resposta. O numero esta disponivel no endpoint `/device`.

**Mudanca em `supabase/functions/whatsapp-setup/index.ts`:**
- Apos verificar que `connected === true` no `/status`, fazer uma segunda chamada a `GET /instances/{id}/token/{token}/device` com o header `Client-Token`
- A resposta do `/device` contem o campo `phone` com o numero real (ex: `"5511999999999"`)
- Salvar esse valor no campo `phone_number` da tabela `whatsapp_instances`

**Mudanca em `src/components/cliente/AgentFormSheet.tsx`:**
- Trocar `window.location.reload()` por `queryClient.invalidateQueries` para UX mais fluida ao clicar "Atualizar numero"

## 2. Canal fixo como WhatsApp

Remover o `Select` de canal (WhatsApp, Instagram, E-mail, Website) da aba Identidade. O campo `channel` sera fixado como `"whatsapp"` no estado do formulario. O seletor nao sera exibido, liberando espaco na interface.

## 3. Transbordo -- o que e e como renomear

**"Solicitar transbordo"** significa que o agente de IA pode pedir para um humano assumir a conversa. Quando o agente percebe que nao consegue resolver (ex: cliente irritado, assunto complexo), ele envia um sinal interno de "transbordo" -- ou seja, transfere o atendimento para uma pessoa real.

**Acao**: Renomear o label de "Solicitar transbordo" para **"Transferir para atendente humano"**, que e mais claro para o usuario.

---

## Arquivos a editar

| Arquivo | Mudanca |
|---------|---------|
| `supabase/functions/whatsapp-setup/index.ts` | Adicionar chamada ao `/device` da Z-API para obter o numero real quando conectado |
| `src/components/cliente/AgentFormSheet.tsx` | Remover Select de canal (fixar "whatsapp"), trocar reload por invalidateQueries, renomear "transbordo" |

## Detalhes Tecnicos

- Endpoint Z-API: `GET https://api.z-api.io/instances/{instanceId}/token/{token}/device` com header `Client-Token: {clientToken}`
- Resposta esperada: `{ phone: "5511999999999", ... }`
- O `phone` sera salvo em `whatsapp_instances.phone_number`
- No formulario, o campo `channel` sera inicializado como `"whatsapp"` e nao tera selector visivel
- O label "Solicitar transbordo" sera trocado por "Transferir para atendente humano"


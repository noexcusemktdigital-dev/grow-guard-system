

# Problema: Conversas do número antigo aparecendo no Chat

## Diagnóstico

A base de dados contém **68 contatos antigos** (sem `instance_id`) do número anterior e apenas **3 contatos novos** vinculados à instância atual (`2f5c0892-...`). O componente `ClienteChat` chama `useWhatsAppContacts(null)`, ou seja, **não filtra por instância** -- mostrando todos os contatos misturados.

## Solução

Duas alterações:

### 1. Filtrar contatos pela instância ativa no ClienteChat
- Passar o `instance.id` (UUID do banco) como `filterInstanceId` em `useWhatsAppContacts`
- Assim, apenas contatos criados pelo número atual aparecem na lista

### 2. Migrar contatos antigos (sem instance_id) 
- Criar uma migração SQL que associa os 68 contatos órfãos (`instance_id IS NULL`) à instância ativa, **ou** removê-los se o usuário preferir começar do zero com o novo número
- Recomendação: associar os contatos antigos à instância atual, já que pertencem à mesma organização e podem ter histórico útil

### Detalhes técnicos

**`ClienteChat.tsx`**: Mudar de `useWhatsAppContacts(null)` para `useWhatsAppContacts(instance?.id ?? null)`, garantindo que só contatos da instância conectada apareçam.

**Migração SQL**: `UPDATE whatsapp_contacts SET instance_id = '2f5c0892-1076-45ea-b126-ec4b47518b97' WHERE organization_id = (org_id) AND instance_id IS NULL` -- isso vincula os contatos antigos à instância atual, permitindo que apareçam no chat filtrado.

**Webhook (`whatsapp-webhook`)**: Verificar se já grava `instance_id` nos novos contatos (os 3 recentes indicam que sim).


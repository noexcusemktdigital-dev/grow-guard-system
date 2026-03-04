

# Fix: Atualizar número do WhatsApp automaticamente ao abrir Conversas

## Problema

Quando o usuário troca o número no Z-API, o banco de dados mantém o `phone_number` antigo porque a atualização só acontece quando o botão "Verificar" é clicado manualmente em Integrações. A página de Conversas apenas lê o valor do banco sem verificar o status real na Z-API.

## Solução

### 1. Auto check-status ao abrir a página de Conversas

Em `ClienteChat.tsx`, adicionar um `useEffect` que chama a edge function `whatsapp-setup` com `action: "check-status"` quando a página carrega e a instância existe. Isso atualiza o `phone_number` e `status` no banco automaticamente, refletindo o número real conectado no Z-API.

### 2. Invalidar cache após check-status

Após o check-status retornar, invalidar a query `whatsapp-instances` para que a UI reflita o número atualizado imediatamente.

## Arquivos

| Arquivo | Ação |
|---------|------|
| `src/pages/cliente/ClienteChat.tsx` | Adicionar auto check-status no mount da página |


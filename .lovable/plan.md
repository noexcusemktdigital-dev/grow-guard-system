

## Diagnóstico: Mensagens não aparecem no Chat

### Problema identificado

Há **dois problemas distintos**:

**1. Mensagens perdidas durante janela de deploy (15:42-15:44 UTC)**
O webhook estava sendo redeployado quando as mensagens chegaram. Testei manualmente e o webhook funciona agora — a mensagem de teste foi salva com sucesso.

**2. Filtro de `instance_id` bloqueando contatos (PROBLEMA PRINCIPAL)**
O hook `useWhatsAppContacts` filtra contatos por `instance_id`. Dos **649 contatos**, apenas **1** tem `instance_id` preenchido (o que recebeu minha mensagem de teste). Os outros 648 ficam invisíveis no chat.

```text
ClienteChat.tsx linha 33:
  useWhatsAppContacts(instance?.id)  →  filtra por instance_id = UUID

whatsapp_contacts no banco:
  649 contatos totais
  648 com instance_id = NULL  →  NÃO aparecem
  1   com instance_id = UUID  →  aparece
```

### Plano de correção

**A. Atualizar contatos sem instance_id (migração SQL)**
```sql
UPDATE whatsapp_contacts 
SET instance_id = '76967807-c7f1-49d3-9d12-e64b9a83320e'
WHERE organization_id = 'adb09618-e9f3-4dbd-a89c-29e3eb1bec9f' 
  AND instance_id IS NULL;
```

**B. Tornar o filtro de instance_id resiliente**
Em `useWhatsAppContacts`, remover o filtro por `instance_id` — como a query já filtra por `organization_id`, o filtro extra é desnecessário e causa esse tipo de problema quando contatos são criados sem vincular à instância.

**C. Garantir que o webhook sempre seta instance_id**
O código já faz isso (linha 167: `instance_id: instance.id`), mas preciso confirmar que funciona para contatos novos e existentes — o que já está implementado.

### Resultado esperado
Todos os 649 contatos voltam a aparecer no chat, e novas mensagens são salvas e exibidas em tempo real.


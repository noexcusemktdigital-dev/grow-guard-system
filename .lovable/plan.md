

# Limpar contatos antigos e começar do zero

## O que será feito

Remover da base de dados todos os contatos e mensagens que **não** pertencem à instância ativa (`2f5c0892-1076-45ea-b126-ec4b47518b97`). Isso inclui os 68 contatos órfãos (sem `instance_id`) que foram migrados anteriormente, além de quaisquer mensagens associadas a eles.

## Passos técnicos

1. **Deletar mensagens órfãs** — remover todas as mensagens cujo `contact_id` aponta para contatos sem `instance_id` ou com `instance_id` diferente da instância ativa
2. **Deletar contatos antigos** — remover contatos da organização que não pertencem à instância ativa (`instance_id != '2f5c0892-...'` ou `instance_id IS NULL`)

### SQL a executar (via insert tool, pois são operações de dados):

```sql
-- 1. Deletar mensagens dos contatos antigos
DELETE FROM whatsapp_messages
WHERE contact_id IN (
  SELECT id FROM whatsapp_contacts
  WHERE organization_id = 'adb09618-e9f3-4dbd-a89c-29e3eb1bec9f'
    AND (instance_id IS NULL OR instance_id != '2f5c0892-1076-45ea-b126-ec4b47518b97')
);

-- 2. Deletar contatos antigos
DELETE FROM whatsapp_contacts
WHERE organization_id = 'adb09618-e9f3-4dbd-a89c-29e3eb1bec9f'
  AND (instance_id IS NULL OR instance_id != '2f5c0892-1076-45ea-b126-ec4b47518b97');
```

**Resultado**: A tela de Conversas mostrará apenas os contatos e mensagens do número **554491129613** (instância atual). Nenhuma alteração de código é necessária — o filtro por `instance_id` já está implementado.


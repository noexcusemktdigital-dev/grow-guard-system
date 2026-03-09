

## Análise da Situação

Identifiquei o problema: **o sistema atualmente filtra grupos propositalmente** em dois lugares:

1. **Edge Function `whatsapp-sync-chats`** (linha 199-208):
   - Verifica `chat.isGroup` e retorna `false`
   - Filtra telefones com padrão de grupo (`@g.us`, `-group`, etc.)

2. **Frontend `useWhatsApp.ts`** (linhas 106-115):
   - Remove contatos com `@g.us`, `@broadcast`, `-group` etc.

**Resultado**: Grupos não são sincronizados nem aparecem na interface.

## Solução Proposta

### 1. Adicionar Coluna `contact_type` no Banco
Migration SQL para classificar contatos:
```sql
ALTER TABLE whatsapp_contacts 
ADD COLUMN contact_type text DEFAULT 'individual' CHECK (contact_type IN ('individual', 'group', 'broadcast'));

CREATE INDEX idx_whatsapp_contacts_type 
ON whatsapp_contacts(organization_id, contact_type);
```

### 2. Modificar `whatsapp-sync-chats`
- **Remover** filtro de grupos (linhas 199-208)
- **Adicionar** lógica para classificar como `individual` ou `group`
- Para grupos, extrair:
  - Nome do grupo
  - Número de participantes (se disponível na API)
  - Foto do grupo

### 3. Atualizar `useWhatsApp.ts`
- **Remover** filtro frontend (linhas 106-115)
- Manter apenas filtros de broadcast e status
- Adicionar parâmetro opcional `includeGroups?: boolean`

### 4. UI: Filtro de Grupos em `ChatContactList`
Adicionar nova aba/filtro:
```tsx
{ key: "groups", label: "Grupos", icon: <Users className="w-3 h-3" /> }
```

### 5. UI: Indicador Visual em `ChatContactItem`
- Ícone de grupo (👥 ou `Users`) para grupos
- Badge com número de participantes
- Estilo diferenciado (cor, borda)

### 6. Webhook: Suportar Mensagens de Grupos
Verificar se `whatsapp-webhook` já processa grupos corretamente (normalmente já funciona, mas revisar se há filtros).

## Arquivos a Modificar

| Arquivo | Mudança |
|---------|---------|
| Migration SQL | Adicionar coluna `contact_type` |
| `whatsapp-sync-chats/index.ts` | Remover filtro de grupos + classificação |
| `src/hooks/useWhatsApp.ts` | Ajustar filtros frontend |
| `src/components/cliente/ChatContactList.tsx` | Adicionar filtro "Grupos" |
| `src/components/cliente/ChatContactItem.tsx` | Indicador visual para grupos |
| `supabase/functions/whatsapp-webhook/index.ts` | Verificar/ajustar processamento de grupos |

## Resultado

✅ Grupos sincronizados do WhatsApp
✅ Filtro dedicado para ver apenas grupos
✅ Indicador visual claro (ícone + badge de participantes)
✅ Mensagens de grupos exibidas normalmente
✅ Compatível com API da Z-API (suporta grupos nativamente)


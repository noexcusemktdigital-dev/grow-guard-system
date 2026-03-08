

## Plano: Corrigir RLS do Atendimento para permitir resposta cross-org

### Problema raiz

A Franqueadora (org `4206c8f4`) tenta enviar mensagem em um ticket criado pelo Franqueado (org `5ee93547`). A política RLS de INSERT em `support_messages` usa `is_member_of_org()`, que verifica apenas membership direta. Como o usuário da Franqueadora **não é membro** da org do Franqueado, o INSERT retorna 403.

O mesmo problema afeta:
- **SELECT em `support_messages`** — a Franqueadora não consegue ler mensagens de tickets de unidades filhas
- **UPDATE em `support_tickets`** — a Franqueadora não consegue alterar status de tickets de unidades filhas

### Solução

Substituir `is_member_of_org` por `is_member_or_parent_of_org` nas 4 políticas RLS relevantes. Essa função já existe no banco e valida se o usuário pertence à org direta **ou** à org pai.

### Migração SQL

```sql
-- support_messages: INSERT
DROP POLICY "Ticket members can send messages" ON support_messages;
CREATE POLICY "Ticket members can send messages" ON support_messages
  FOR INSERT TO public
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM support_tickets t
      WHERE t.id = support_messages.ticket_id
        AND is_member_or_parent_of_org(auth.uid(), t.organization_id)
    )
  );

-- support_messages: SELECT
DROP POLICY "Ticket members can view messages" ON support_messages;
CREATE POLICY "Ticket members can view messages" ON support_messages
  FOR SELECT TO public
  USING (
    EXISTS (
      SELECT 1 FROM support_tickets t
      WHERE t.id = support_messages.ticket_id
        AND is_member_or_parent_of_org(auth.uid(), t.organization_id)
    )
  );

-- support_tickets: UPDATE
DROP POLICY "Members can update tickets" ON support_tickets;
CREATE POLICY "Members can update tickets" ON support_tickets
  FOR UPDATE TO public
  USING (is_member_or_parent_of_org(auth.uid(), organization_id));

-- support_tickets: SELECT (direct queries)
DROP POLICY "Members can view org tickets" ON support_tickets;
CREATE POLICY "Members can view org tickets" ON support_tickets
  FOR SELECT TO public
  USING (is_member_or_parent_of_org(auth.uid(), organization_id));
```

### Arquivos afetados

Apenas migração SQL. Nenhuma mudança de código necessária — o frontend já está correto.


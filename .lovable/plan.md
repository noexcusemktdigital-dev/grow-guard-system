

# Correção: Erro ao adicionar proposta no CRM

## Problema identificado

O upload de arquivo na aba de Propostas do lead detail usa o bucket `crm-files`, que **não existe** no storage. Os buckets disponíveis são: `agent-knowledge`, `dispatch-media`, `social-arts`, `chat-media`, `support-attachments`, `closing-files`, `avatars`, `unit-documents`, `announcement-attachments`, `marketing-assets`, `email-assets`.

Quando o usuário tenta anexar um arquivo à proposta, o `supabase.storage.from("crm-files").upload(...)` falha porque o bucket não existe, e o erro é propagado ao usuário.

Além disso, o `createProposal` usa `import("@/integrations/supabase/client")` para o storage mas `@/lib/supabase` para as queries — clientes Supabase diferentes podem causar inconsistência de sessão.

## Solução

1. **Criar o bucket `crm-files`** no storage (público, para permitir acesso aos arquivos das propostas)
2. **Unificar o cliente Supabase** — usar `@/lib/supabase` consistentemente em `CrmLeadDetailSheet.tsx` (já importado via hooks), em vez de dynamic import do `@/integrations/supabase/client`
3. **Tratamento de erro melhorado** — garantir que o toast de erro mostre a mensagem correta

## Arquivos a alterar

- `src/components/crm/CrmLeadDetailSheet.tsx` — linhas 403-406: trocar dynamic import por `supabase` de `@/lib/supabase`

## Infraestrutura

- Criar storage bucket `crm-files` (público)


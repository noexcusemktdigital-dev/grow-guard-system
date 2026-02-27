

# Convite com e-mail automático via `inviteUserByEmail`

## Resumo
Trocar o método de criação de usuários de `createUser` (senha temporária manual) para `inviteUserByEmail` (e-mail automático com link para definir senha). Isso vale para todos os convites: Matriz, Franquias e Unidades.

## O que muda

### 1. Edge Function `invite-user/index.ts`
- Substituir `adminClient.auth.admin.createUser(...)` por `adminClient.auth.admin.inviteUserByEmail(email, { data: { full_name }, redirectTo })`
- O Supabase envia automaticamente um e-mail com link para o usuário definir sua senha
- A resposta não retorna mais `temp_password` -- apenas `success` e `user_id`
- O `redirectTo` apontará para a URL do app (usando `SUPABASE_URL` ou uma variável de redirect configurável)

### 2. Frontend -- `UnidadeUsuariosReal.tsx` (convite em Unidades)
- Remover toda a lógica de exibição de senha temporária (`tempPassword`, `copyPassword`, bloco de sucesso com código)
- Após sucesso, exibir apenas uma mensagem: "Convite enviado! O membro receberá um e-mail para definir sua senha."
- Simplificar o dialog (remover estados `tempPassword`, `copied`)

### 3. Frontend -- `Matriz.tsx` (convite na Matriz)
- Já não exibe senha temporária, mas ajustar a mensagem de sucesso para mencionar o e-mail enviado

### 4. Qualquer outro local que chame `invite-user`
- Verificar se há outros chamadores e ajustar se necessário

## Detalhes técnicos

**Edge Function -- trecho principal:**
```typescript
const { data: newUser, error: createErr } = await adminClient.auth.admin.inviteUserByEmail(email, {
  data: { full_name: full_name || email.split("@")[0] },
  redirectTo: `${supabaseUrl.replace('.supabase.co', '')}/auth/v1/callback`,
});
```

O `inviteUserByEmail` cria o usuário E envia o e-mail de convite automaticamente. O usuário clica no link e define sua própria senha.

**Nota:** O profile, membership e role continuam sendo criados da mesma forma após o invite.




## Plano — Redefinir senha do franqueado.teste@noexcuse.com

### Ação

Executar um comando via Admin API para atualizar a senha do usuário `franqueado.teste@noexcuse.com` para `19961996`.

Isso será feito chamando a edge function `manage-member` com action `reset_password`, ou diretamente via script usando a Service Role Key para chamar `auth.admin.updateUserById`.

### Método

Usar `supabase--curl_edge_functions` para invocar a `seed-users` (que já cria com essa senha) ou criar um script rápido via `code--exec` que use `psql` para buscar o user ID e depois chamar a Admin API.

### Resultado esperado

- Senha de `franqueado.teste@noexcuse.com` redefinida para `19961996`
- Login funcional no portal `/acessofranquia`


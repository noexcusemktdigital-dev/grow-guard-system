

## Criar conta teste SaaS para teste completo

### Situação atual

Já existe uma Edge Function `seed-users` que cria um usuário SaaS de teste:
- **Email**: `cliente.teste@noexcuse.com`
- **Senha**: `19961996`
- **Plano**: Trial (7 dias, 100 créditos)

### O que fazer

Basta **invocar a Edge Function `seed-users`** que já existe. Ela criará (ou confirmará que já existe):
1. O usuário `cliente.teste@noexcuse.com` com e-mail já confirmado
2. A organização "Empresa Teste" (tipo `cliente`)
3. O membership e role `cliente_admin`
4. A subscription Trial de 7 dias
5. A carteira de créditos com 100 créditos

Porém, o saldo de créditos atual é **100** — o checklist de testes prevê **200 créditos** para testar todas as ferramentas IA. Vou atualizar a seed para 200 créditos e garantir que o wallet seja criado com saldo suficiente.

### Alteração

**`supabase/functions/seed-users/index.ts`** (linha 109):
- Mudar `balance: 100` para `balance: 200`

Depois de aplicar, invocarei a função para criar/verificar o usuário. Você poderá logar em `/app` com:
- **Email**: `cliente.teste@noexcuse.com`  
- **Senha**: `19961996`


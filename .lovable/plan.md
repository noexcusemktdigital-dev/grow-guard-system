

## Plano: Bloquear convite se usuário já existir

### Problema
O `inviteUserByEmail` retorna erro 422 quando o e-mail já existe no sistema. O código atual silenciosamente vincula o usuário existente sem enviar nenhum e-mail, e o frontend exibe "Convite enviado!" mesmo sem e-mail ter sido disparado.

### Solução
Alterar a edge function `invite-user` para **rejeitar** convites quando o e-mail já está cadastrado, retornando uma mensagem clara orientando a usar "Esqueci minha senha". O frontend já trata `data.error` como erro, então basta retornar a mensagem correta.

### Alterações

**1. Edge Function `supabase/functions/invite-user/index.ts`**
- No bloco `catch` do `inviteUserByEmail` (linha 89-115), quando detectar `already been registered`:
  - Retornar erro 409 com mensagem: `"Este e-mail já está cadastrado no sistema. O usuário deve acessar /acessofranquia e usar 'Esqueci minha senha' para redefinir sua senha."`
  - Remover toda a lógica de "vincular silenciosamente" (busca do usuário existente, criação de membership, etc.)

**2. Frontend `src/pages/Matriz.tsx`**
- Nenhuma alteração necessária - o `handleInvite` já exibe `data.error` como toast de erro via `if (data?.error) throw new Error(data.error)`.

### Resultado
- Convite só funciona para e-mails novos (envia e-mail de definição de senha)
- E-mails já cadastrados recebem mensagem clara de erro
- Usuário existente deve usar "Esqueci minha senha" em `/acessofranquia`


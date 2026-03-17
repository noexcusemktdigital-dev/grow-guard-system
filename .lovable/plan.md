

## Fix: Usuário da Franquia Bloqueado por Falta de Role Correto

### Diagnóstico
O usuário `vitorrodriguesdesouzaa@gmail.com` é membro da organização **NoExcuse Franqueadora**, mas possui apenas o role `cliente_user`. O portal guard bloqueia corretamente o acesso à franquia porque não existe um role de franquia (`super_admin`, `admin`, ou `franqueado`) atribuído a ele.

**Causa raiz**: Quando o usuário foi convidado/adicionado à organização franqueadora, o role atribuído foi `cliente_user` ao invés de um role de franquia. Isso pode ter acontecido porque a edge function `invite-user` usa `cliente_user` como fallback padrão (linha 214), independente do tipo de organização.

### Solução (2 partes)

**1. Correção de dados (imediata)**
- Adicionar o role `admin` (ou `franqueado`) para o usuário na tabela `user_roles` via migration SQL, para que ele consiga acessar o portal da franquia imediatamente.

**2. Correção de código (preventiva) — `supabase/functions/invite-user/index.ts`**
- Na linha 214, ao invés de sempre usar `cliente_user` como fallback, consultar o `type` da organização para definir o default correto:
  - Se `org.type` = `franqueadora` ou `unidade` → default `franqueado`
  - Se `org.type` = `cliente` → default `cliente_user`
- Isso previne que futuros convites para organizações de franquia criem usuários com role SaaS por engano.

### Resultado
- O usuário conseguirá acessar o portal da franquia imediatamente
- Convites futuros atribuirão o role correto baseado no tipo da organização


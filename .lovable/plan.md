

## Plano: Limpar Matriz e Testar Convite por E-mail

### Situação Atual

**Membros na Matriz (org `4206c8f4`):**
| Usuário | Role | Ação |
|---|---|---|
| Davi Tesch (`2eb15325`) | super_admin | **Manter** |
| Suporte NOE (`bcd55f36`) | cliente_user | **Remover** |

### Problema Crítico: E-mail de Convite

O domínio de e-mail **não está configurado** no projeto. Isso significa que o `inviteUserByEmail` usará o remetente padrão genérico do sistema, que pode:
- Cair no spam
- Não ser entregue em alguns provedores

Para garantir entrega confiável, recomendo configurar o domínio de e-mail primeiro (ex: `notify.noexcusedigital.com`). Isso leva ~5 minutos e requer adicionar registros DNS.

### Etapas

**1. Remover o usuário "Suporte NOE" da Matriz**
- Deletar de `org_team_memberships` (se houver registros remanescentes)
- Deletar de `user_roles`
- Deletar de `organization_memberships`
- Deletar conta de `auth.users` (para permitir novo convite limpo, já que a edge function agora bloqueia e-mails já cadastrados)

**2. Configurar domínio de e-mail (recomendado)**
- Configurar um subdomínio para envio de e-mails via Lovable Cloud
- Adicionar registros DNS (SPF, DKIM, DMARC) no provedor de DNS
- Isso garante que o e-mail de convite chegue na caixa de entrada

**3. Testar o fluxo**
- Você convida um novo e-mail pela aba Equipe da Matriz
- O sistema envia e-mail com link para definir senha
- O usuário clica no link, define a senha e acessa o portal

### Decisão necessária

Antes de prosseguir, preciso saber:
- Devo **deletar a conta auth** do Suporte NOE (para poder reconvidar o mesmo e-mail)? Ou você vai usar um e-mail diferente para o teste?
- Quer configurar o domínio de e-mail agora, ou testar primeiro com o remetente padrão?




## Plano: Implementar Templates de E-mail de Autenticação com Marca NoExcuse

### Contexto
- Domínio de e-mail `notify.sistema.noexcusedigital.com` configurado (DNS em propagação)
- Plano de personalização já aprovado anteriormente
- Os templates podem ser criados agora — só precisam do DNS verificado para enviar

### Etapas

**1. Scaffold dos templates de autenticação**
- Chamar `scaffold_auth_email_templates` para criar a edge function `auth-email-hook` e os 6 templates (signup, magic-link, recovery, invite, email-change, reauthentication)

**2. Personalizar visual com marca NoExcuse**
- Cor primária (botões): `hsl(355, 78%, 50%)` — vermelho NoExcuse
- Cor de fundo: `#ffffff`
- Texto principal: cor escura do tema
- Border radius: `0.75rem`
- Fonte: Inter, sans-serif
- Upload do logo `logo-noexcuse.png` para bucket `email-assets`
- Logo no topo de cada template

**3. Personalizar textos em português**
Todos os templates em PT-BR, tom direto e profissional:
- **Convite**: "Você foi convidado para a plataforma NoExcuse Digital. Defina sua senha para começar."
- **Recovery**: "Recebemos uma solicitação para redefinir sua senha."
- **Signup**: "Confirme seu e-mail para ativar sua conta."
- **Magic Link**: "Clique no link abaixo para acessar sua conta."
- **Email Change**: "Confirme a alteração do seu e-mail."
- **Reauthentication**: "Use o código abaixo para confirmar sua identidade."

**4. Deploy da edge function `auth-email-hook`**

**5. Verificar ativação**
- Os e-mails personalizados ativam automaticamente quando o DNS for verificado
- Enquanto isso, os e-mails padrão continuam funcionando

### Arquivos criados/modificados
- `supabase/functions/auth-email-hook/index.ts`
- `supabase/functions/auth-email-hook/deno.json`
- `supabase/functions/_shared/email-templates/*.tsx` (6 templates)


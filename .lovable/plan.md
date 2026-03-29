

## Diagnóstico — 3 Problemas Identificados

### Problema 1: Link "Esqueci minha senha" expira / inválido

**Causa raiz:** Nos dois portais (Auth.tsx e SaasAuth.tsx), o `redirectTo` do "esqueci minha senha" está **sem o parâmetro `?portal=`**:

```
redirectTo: `${window.location.origin}/reset-password`  ← falta ?portal=
```

Quando o usuário clica no link do e-mail e chega em `/reset-password`, o sistema não sabe de qual portal ele veio. O cliente Supabase é inicializado com uma chave de armazenamento (`storageKey`) que depende desse parâmetro. Sem ele, a sessão de recuperação é armazenada no lugar errado → a página não encontra a sessão → "link expirado ou inválido".

**Correção:**
- `Auth.tsx` (franquia): `redirectTo: .../reset-password?portal=franchise`
- `SaasAuth.tsx` (SaaS): `redirectTo: .../reset-password?portal=saas`

### Problema 2: E-mail de recuperação não usa nosso template/domínio

**Causa:** O domínio de e-mail `notify.sistema.noexcusedigital.com.br` ainda está com **DNS pendente**. Enquanto não for verificado, todos os e-mails de autenticação (incluindo "esqueci minha senha") são enviados pelo template padrão do sistema, sem a nossa marca.

**Ação necessária:** Configurar os registros DNS (NS records) apontando para os nameservers corretos. Isso precisa ser feito no painel do registrador de domínio (onde o DNS do `sistema.noexcusedigital.com.br` é gerenciado). Você pode acompanhar o status em **Cloud → Emails**.

### Problema 3: Login falha após definir senha pelo convite

**Causa provável:** O link de convite usa `generateLink({ type: "recovery" })` que gera um token com validade limitada (~1 hora). Se o usuário demora para clicar, o token expira. Adicionalmente, se o `updateUser({ password })` falha silenciosamente (erro 422 por sessão não estabelecida), a senha não é atualizada mas a interface pode não comunicar claramente.

**Correção:** Melhorar a resiliência da página `/reset-password`:
- Aguardar o evento `PASSWORD_RECOVERY` com timeout mais generoso
- Se `updateUser` falhar com 422, exibir mensagem clara pedindo novo link
- Após sucesso, fazer logout explícito e redirecionar para login (evitando sessão fantasma)

---

### Arquivos afetados

| Arquivo | Mudança |
|---------|---------|
| `src/pages/Auth.tsx` | Adicionar `?portal=franchise` no `redirectTo` |
| `src/pages/SaasAuth.tsx` | Adicionar `?portal=saas` no `redirectTo` |
| `src/pages/ResetPassword.tsx` | Melhorar tratamento de erro 422, timeout e mensagem |

### Sobre o DNS (ação do administrador)

O DNS do domínio de e-mail precisa ser configurado para que os e-mails usem nossos templates. Isso não é algo que eu possa fazer automaticamente — precisa ser feito no painel do registrador de domínio. Posso verificar o status atual a qualquer momento.


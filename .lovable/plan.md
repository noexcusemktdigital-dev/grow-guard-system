
# Dois Sistemas de Login Separados

## Resumo

A plataforma precisa de **dois fluxos de autenticacao completamente separados**:

1. **Login Franquia** (`/auth`) -- Sistema interno da rede No Excuse
   - Sem auto-cadastro (contas criadas por admins)
   - Apenas email + senha
   - Roles: super_admin, admin (franqueadora) e franqueado, franqueado_user (franqueado)

2. **Login SaaS** (`/app/auth`) -- No Excuse Gestao Comercial (produto SaaS)
   - Auto-cadastro permitido (email/senha + Google)
   - Trial de 7 dias com acesso total
   - Roles: cliente_admin (dono da conta) e cliente_user (funcionario, criado pelo admin)

---

## Fase 1 -- Pagina de Login do SaaS (`/app/auth`)

### Criar nova pagina com:
- **Branding diferente**: "NOEXCUSE Gestao Comercial" (identidade dark premium do SaaS)
- **Tabs**: "Entrar" e "Criar conta"
- **Criar conta**: formulario com nome, email, senha + botao "Entrar com Google"
- **Entrar**: email/senha + botao "Entrar com Google" + "Esqueci minha senha"
- **Trial**: ao criar conta, automaticamente cria organizacao + subscription com trial de 7 dias + wallet de creditos

### Login com Google:
- Usar Lovable Cloud OAuth gerenciado (`lovable.auth.signInWithOAuth("google")`)
- Configurar o modulo via ferramenta de social auth

---

## Fase 2 -- Atualizar Login da Franquia (`/auth`)

### Manter como esta, com ajustes:
- Remover qualquer possibilidade de auto-cadastro
- Manter branding "NO EXCUSE - Plataforma de gestao para franquias"
- Apenas email + senha (sem Google)

---

## Fase 3 -- Atualizar Roteamento

### Separar os fluxos no App.tsx:

```text
/auth           -> Login Franquia (sem cadastro)
/app/auth       -> Login SaaS (com cadastro + Google)
/reset-password -> Compartilhado

/franqueadora/* -> Protegido (roles: super_admin, admin)
/franqueado/*   -> Protegido (roles: franqueado)
/cliente/*      -> Protegido (roles: cliente_admin, cliente_user)
```

### Redirecionamento apos login:
- Se role e super_admin/admin -> `/franqueadora/dashboard`
- Se role e franqueado -> `/franqueado/dashboard`
- Se role e cliente_admin/cliente_user -> `/cliente/inicio`
- Se usuario logou via `/app/auth` e nao tem role ainda (novo cadastro) -> criar org + role automaticamente -> `/cliente/inicio`

---

## Fase 4 -- Edge Function para Auto-Cadastro SaaS

### Criar `signup-saas` edge function:
Apos o signup do usuario (via trigger ou chamada direta):
1. Criar organizacao (type: 'cliente', name: nome da empresa)
2. Criar organization_membership (user + org)
3. Criar user_role (cliente_admin)
4. Criar subscription (plan: 'trial', expires_at: now + 7 dias)
5. Criar credit_wallet (balance: creditos iniciais do trial)

---

## Fase 5 -- Protecao de Rotas por Role

### Atualizar ProtectedRoute para aceitar roles permitidas:
- `/franqueadora/*` aceita apenas super_admin e admin
- `/franqueado/*` aceita apenas franqueado
- `/cliente/*` aceita apenas cliente_admin e cliente_user
- Se usuario tenta acessar area errada, redireciona para sua area correta

---

## Fase 6 -- Atualizar AuthContext

### Adicionar logica para detectar tipo de login:
- Se usuario veio do `/app/auth` e nao tem role -> provisionar automaticamente como cliente_admin
- Se usuario veio do `/auth` e nao tem role -> mostrar erro (conta precisa ser criada pelo admin)

---

## Detalhes Tecnicos

### Arquivos novos:
```text
src/pages/SaasAuth.tsx              -- Login/cadastro do SaaS
supabase/functions/signup-saas/     -- Edge function para provisionar novo cliente
```

### Arquivos modificados:
```text
src/App.tsx                         -- Novas rotas /app/auth, protecao por role
src/components/ProtectedRoute.tsx   -- Aceitar prop de roles permitidas
src/contexts/AuthContext.tsx        -- Detectar tipo de usuario
```

### Migracao SQL:
- Habilitar signup no auth (atualmente desabilitado) -- necessario para o SaaS
- O controle de "quem pode se cadastrar" sera feito pela UI (so a pagina do SaaS tem formulario de cadastro)

### Google OAuth:
- Configurar via ferramenta `configure-social-auth` do Lovable Cloud
- Usar `lovable.auth.signInWithOAuth("google")` no SaasAuth.tsx

---

## Resumo Visual

```text
+---------------------------+       +---------------------------+
|     /auth (Franquia)      |       |   /app/auth (SaaS)        |
|---------------------------|       |---------------------------|
| - Apenas email+senha      |       | - Email+senha OU Google   |
| - Sem auto-cadastro       |       | - Auto-cadastro permitido |
| - "Acesso por convite"    |       | - "Teste gratis 7 dias"   |
| - Branding: NO EXCUSE     |       | - Branding: Gestao Com.   |
|   Franquias               |       |   NOEXCUSE                |
+---------------------------+       +---------------------------+
         |                                    |
         v                                    v
  super_admin/admin -> /franqueadora    cliente_admin -> /cliente
  franqueado        -> /franqueado      cliente_user  -> /cliente
```

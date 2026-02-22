

# Implementacao de Login, Usuarios e Banco de Dados

## Resumo

Vamos transformar a plataforma de mockup para producao, criando toda a infraestrutura de autenticacao, perfis de usuario, organizacoes e controle de acesso baseado em papeis (roles). O sistema suportara os 3 niveis da plataforma: Franqueadora, Franqueado e Cliente Final.

---

## Fase 1 -- Banco de Dados (Migracao SQL)

Criar as tabelas base, funcoes auxiliares e politicas de seguranca (RLS):

### Tabelas

| Tabela | Descricao |
|---|---|
| `profiles` | Nome, cargo, avatar, telefone -- vinculado ao auth.users |
| `organizations` | Empresas (franqueadora, franqueados, clientes) |
| `organization_memberships` | Vincula usuario a organizacao com papel |
| `user_roles` | Papeis do sistema (enum: super_admin, admin, franqueado, cliente_admin, cliente_user) |
| `subscriptions` | Assinaturas das organizacoes |
| `credit_wallets` | Carteira de creditos por organizacao |

### Enum de papeis

```text
super_admin    -> Equipe da franqueadora
admin          -> Admin interno da franqueadora
franqueado     -> Dono/gestor de unidade
cliente_admin  -> Admin da empresa cliente (SaaS)
cliente_user   -> Operador da empresa cliente
```

### Funcoes auxiliares (SECURITY DEFINER)

- `has_role(user_id, role)` -- verifica se usuario tem papel
- `get_user_org_id(user_id)` -- retorna org do usuario
- `is_member_of_org(user_id, org_id)` -- verifica pertencimento

### Trigger automatico

- Ao criar usuario no auth.users, cria automaticamente o registro em `profiles`

---

## Fase 2 -- Pagina de Login

### Criar `/auth` com:

- Formulario de email + senha
- Opcao de "Esqueci minha senha"
- Layout profissional com branding NoExcuse
- Sem auto-cadastro (usuarios serao convidados pelo admin)

### Criar `/reset-password`:

- Formulario para definir nova senha apos link de recuperacao

---

## Fase 3 -- Contexto de Autenticacao

### Criar `AuthContext` + `AuthProvider`:

- Gerencia sessao do usuario (login, logout, sessao ativa)
- Busca perfil e roles do usuario logado
- Expoe dados do usuario para toda a aplicacao

### Protecao de rotas:

- Criar componente `ProtectedRoute` que redireciona para `/auth` se nao autenticado
- Envolver todas as rotas existentes com protecao

---

## Fase 4 -- Roteamento baseado em Role

### Logica de redirecionamento apos login:

```text
super_admin / admin   -> /franqueadora/dashboard
franqueado            -> /franqueado/dashboard
cliente_admin / user  -> /cliente/inicio
```

### Remover TopSwitch manual:

- O nivel (Franqueadora/Franqueado/Cliente) sera determinado automaticamente pelo papel do usuario logado
- Manter o switch apenas para super_admins que precisam navegar entre niveis

---

## Fase 5 -- Atualizar Header e UserMenu

- Mostrar nome real do usuario (do perfil)
- Mostrar email e cargo reais
- Implementar logout funcional
- Atualizar avatar com iniciais do nome real

---

## Fase 6 -- Seed de Dados Iniciais

Criar um usuario admin inicial para primeiro acesso:

- Email: definido pelo usuario
- Senha: definida pelo usuario
- Role: super_admin
- Organizacao: Franqueadora principal

---

## Detalhes Tecnicos

### Estrutura de arquivos novos:

```text
src/
  contexts/
    AuthContext.tsx          -- Provider de autenticacao
  components/
    ProtectedRoute.tsx       -- Guard de rotas
  pages/
    Auth.tsx                 -- Login + esqueci senha
    ResetPassword.tsx        -- Redefinir senha
```

### Arquivos modificados:

```text
src/App.tsx                  -- Adicionar rotas /auth e /reset-password, proteger rotas
src/pages/Index.tsx          -- Usar dados reais do usuario no header
src/components/UserMenu.tsx  -- Logout funcional, dados reais
```

### Migracao SQL (resumo):

1. Criar enum `app_role`
2. Criar tabelas: profiles, organizations, organization_memberships, user_roles, subscriptions, credit_wallets
3. Habilitar RLS em todas as tabelas
4. Criar funcoes helper (has_role, get_user_org_id, is_member_of_org)
5. Criar trigger para auto-criar profile no signup
6. Criar politicas RLS para cada tabela

### Confirmacao de email:

- Sera **desabilitada** inicialmente (acesso imediato apos convite)
- Como usuarios sao convidados pelo admin, a confirmacao pode ser habilitada depois

---

## Ordem de Implementacao

1. Migracao SQL (todas as tabelas + RLS + funcoes)
2. Pagina de Login (`/auth`)
3. Pagina Reset Password (`/reset-password`)
4. AuthContext + ProtectedRoute
5. Atualizar App.tsx (rotas protegidas)
6. Atualizar Index.tsx + UserMenu (dados reais)
7. Seed do primeiro usuario admin


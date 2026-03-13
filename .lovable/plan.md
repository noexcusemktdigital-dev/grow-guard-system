

## Plano: Landing Page robusta na raiz + Logout role-aware

### 1. Rota `/` → Landing Page (SaasLanding)

Alterar `App.tsx` para que a rota raiz `/` renderize a landing page (atualmente em `/landing`). A landing page atual é básica — vamos reconstruí-la em `SaasLanding.tsx` com seções robustas:

- **Nav** — Logo + "Entrar" (→ `/app`) + CTA "Começar grátis" (→ `/app`)
- **Hero** — Headline impactante, badge "7 dias grátis", CTA principal → `/app`
- **Seção "Como funciona"** — 3 passos visuais (Cadastre-se, Configure, Venda)
- **Seção Features** — Grid de funcionalidades com ícones (CRM, WhatsApp, IA, Marketing, Automação, Relatórios)
- **Seção Social Proof / Números** — Métricas de impacto (ex: "+500 empresas", "10M leads gerenciados")
- **Seção Depoimentos** — Cards com testemunhos fictícios de clientes
- **Seção Planos** — Cards dos 3 planos (Starter/Pro/Enterprise) com CTAs → `/app`
- **Seção FAQ** — Accordion com perguntas frequentes
- **Seção CTA final** — Banner de conversão com botão → `/app`
- **Footer** — Links (Termos, Privacidade), copyright

Estética: Dark premium consistente com o design system atual (`bg-[hsl(225,20%,4%)]`, vermelho `hsl(355,78%,50%)`), animações com framer-motion.

### 2. Ajuste de rotas em `App.tsx`

- Rota `/` → `<SaasLanding />` (pública, fora do ProtectedRoute)
- Rota `/landing` → remover ou redirect para `/`
- Rota default do ProtectedRoute index → manter redirect por role (já existe no `Index.tsx`)

### 3. Logout role-aware no `UserMenu.tsx`

Atualmente o `handleLogout` sempre navega para `/acessofranquia`. Alterar para:
- Se `role` é `cliente_admin` ou `cliente_user` → navegar para `/app`
- Caso contrário (`super_admin`, `admin`, `franqueado`) → navegar para `/acessofranquia`

### 4. Redirect de usuários autenticados na landing

Na `SaasLanding`, se o usuário já estiver logado, redirecionar automaticamente para o dashboard correto baseado no role (mesmo padrão do `Index.tsx`).

### Arquivos afetados

| Arquivo | Mudança |
|---------|---------|
| `src/pages/SaasLanding.tsx` | Reconstrução completa com ~8 seções |
| `src/App.tsx` | Rota `/` → SaasLanding, remover `/landing` |
| `src/components/UserMenu.tsx` | Logout condicional por role |


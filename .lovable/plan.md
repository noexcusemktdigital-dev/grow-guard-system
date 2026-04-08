

# Análise Completa: Acessos, Direcionamentos e URLs

## Arquitetura de Portais

O sistema opera com **2 portais independentes**, cada um com sua própria sessão de autenticação (storageKey separada no localStorage):

```text
┌─────────────────────────────────────────────────────────────┐
│                    PORTAL SaaS (Clientes)                   │
│  storageKey: "noe-saas-auth"                                │
│  Login: /                                                   │
│  Landing: /crescimento                                      │
│  Roles: cliente_admin, cliente_user                         │
│  Rotas: /cliente/*                                          │
├─────────────────────────────────────────────────────────────┤
│                 PORTAL Franquia (Rede)                       │
│  storageKey: "noe-franchise-auth"                           │
│  Login: /acessofranquia                                     │
│  Roles: super_admin, admin, franqueado                      │
│  Rotas: /franqueadora/*, /franqueado/*                      │
└─────────────────────────────────────────────────────────────┘
```

---

## Mapa Completo de URLs

### Rotas Públicas (sem autenticação)
| URL | Página | Observação |
|-----|--------|------------|
| `/` | Login SaaS (SaasAuth) | Página principal |
| `/crescimento` | Landing Page (SaasLanding) | Página de vendas |
| `/acessofranquia` | Login Franquia (Auth) | Sem signup |
| `/termos` | Termos de Uso | Pública |
| `/privacidade` | Política de Privacidade | Pública |
| `/reset-password` | Redefinir Senha | Usa `?portal=` param |
| `/welcome` | Boas-vindas | Usa `?portal=` param |
| `/apresentacao/:id` | Apresentação comercial | Pública |
| `/app` | **Redirect → `/`** | Compatibilidade |
| `/landing` | **Redirect → `/crescimento`** | Compatibilidade |

### Rotas Protegidas — Franqueadora (super_admin, admin)
| URL | Página |
|-----|--------|
| `/franqueadora/inicio` | Dashboard |
| `/franqueadora/crm` | CRM de Expansão |
| `/franqueadora/crm/config` | Config CRM Expansão |
| `/franqueadora/crm-vendas` | CRM de Vendas (clientes) |
| `/franqueadora/crm-vendas/config` | Config CRM Vendas |
| `/franqueadora/financeiro` | Financeiro |
| `/franqueadora/contratos` | Contratos |
| `/franqueadora/marketing` | Marketing |
| `/franqueadora/treinamentos` | Academy |
| `/franqueadora/metas` | Metas & Ranking |
| `/franqueadora/unidades` | Unidades |
| `/franqueadora/onboarding` | Onboarding |
| `/franqueadora/atendimento` | Atendimento |
| `/franqueadora/comunicados` | Comunicados |
| `/franqueadora/agenda` | Agenda |
| `/franqueadora/matriz` | Matriz (Empresa + Equipe + Chat) |
| `/franqueadora/logs` | SaaS Dashboard / Logs |
| `/franqueadora/propostas` | Propostas |
| `/franqueadora/prospeccao` | Prospecção IA |
| `/franqueadora/estrategia` | Estratégia |
| `/franqueadora/acompanhamento` | Acompanhamento |
| `/franqueadora/perfil` | Perfil |
| `/franqueadora/playbooks` | Playbooks |
| `/franqueadora/candidatos` | Candidatos |
| `/franqueadora/chat` | Chat interno |
| `/franqueadora/notificacoes` | Notificações |

### Rotas Protegidas — Franqueado (franqueado)
| URL | Página |
|-----|--------|
| `/franqueado/inicio` | Dashboard |
| `/franqueado/agenda` | Agenda |
| `/franqueado/comunicados` | Comunicados |
| `/franqueado/suporte` | Suporte |
| `/franqueado/prospeccao` | Prospecção IA |
| `/franqueado/estrategia` | Estratégia |
| `/franqueado/propostas` | Propostas |
| `/franqueado/acompanhamento` | Acompanhamento |
| `/franqueado/crm` | CRM |
| `/franqueado/crm/config` | Config CRM |
| `/franqueado/materiais` | Materiais |
| `/franqueado/academy` | Academy |
| `/franqueado/financeiro` | Financeiro |
| `/franqueado/contratos` | Contratos |
| `/franqueado/diagnostico` | Diagnóstico |
| `/franqueado/unidade` | Minha Unidade |
| `/franqueado/metas` | Metas & Ranking |
| `/franqueado/perfil` | Perfil |
| `/franqueado/configuracoes` | Configurações |
| `/franqueado/notificacoes` | Notificações |

### Rotas Protegidas — Cliente SaaS (cliente_admin, cliente_user)
| URL | Página | Restrição cliente_user |
|-----|--------|------------------------|
| `/cliente/onboarding` | Onboarding (tela cheia) | — |
| `/cliente/inicio` | Dashboard | — |
| `/cliente/checklist` | Tarefas | — |
| `/cliente/agenda` | Agenda + Google Calendar | — |
| `/cliente/notificacoes` | Notificações | — |
| `/cliente/gamificacao` | Gamificação | — |
| `/cliente/plano-vendas` | **Redirect → gps-negocio** | — |
| `/cliente/gps-negocio` | GPS do Negócio | — |
| `/cliente/chat` | WhatsApp | — |
| `/cliente/crm` | CRM de Vendas | — |
| `/cliente/crm/config` | Config CRM | — |
| `/cliente/agentes-ia` | Agentes IA | — |
| `/cliente/scripts` | Scripts | — |
| `/cliente/disparos` | Disparos | **BLOQUEADO** |
| `/cliente/dashboard` | Relatórios | **BLOQUEADO** |
| `/cliente/plano-marketing` | **Redirect → gps-negocio** | — |
| `/cliente/conteudos` | Conteúdos | — |
| `/cliente/redes-sociais` | Redes Sociais | — |
| `/cliente/sites` | Sites | — |
| `/cliente/trafego-pago` | Tráfego Pago | **BLOQUEADO** |
| `/cliente/integracoes` | Integrações | **BLOQUEADO** |
| `/cliente/plano-creditos` | Plano & Créditos | **BLOQUEADO** |
| `/cliente/configuracoes` | Configurações | — |
| `/cliente/avaliacoes` | Avaliações | — |
| `/cliente/suporte` | Suporte | — |
| `/cliente/marketing-hub` | Marketing Hub | — |
| `/cliente/comunicados` | Comunicados | — |
| `/cliente/faq` | FAQ | — |

---

## Fluxo de Redirecionamento Pós-Login

```text
Login SaaS (/)
  → validatePortalAccess("saas")
    → Bloqueado? → signOut + redireciona /acessofranquia
    → Permitido? → navigate("/cliente/inicio")

Login Franquia (/acessofranquia)
  → validatePortalAccess("franchise")
    → Bloqueado? → signOut + redireciona /
    → Permitido?
      → super_admin/admin → navigate("/franqueadora/inicio")
      → franqueado → navigate("/franqueado/inicio")
```

### Redirecionamento por Role (ProtectedRoute)
Quando um usuário tenta acessar rota não permitida:
- `super_admin` / `admin` → `/franqueadora/inicio`
- `franqueado` → `/franqueado/inicio`
- `cliente_admin` / `cliente_user` → `/cliente/inicio`
- Sem role → `/acessofranquia`

### Redirecionamento de Logout
- `cliente_admin` / `cliente_user` → `/`
- Demais roles → `/acessofranquia`

---

## Problemas Identificados

### 1. Mensagem desatualizada no portalRoleGuard
**Arquivo:** `src/lib/portalRoleGuard.ts` (linha 33)
**Problema:** A mensagem diz "Acesse /app" mas `/app` agora é redirect para `/`.
**Correção:** Trocar para "Acesse /" ou "Acesse a página inicial".

### 2. `/app` referência obsoleta no detectPortalMismatch
**Arquivo:** `src/components/ProtectedRoute.tsx` (linha 32)
**Problema:** `path.startsWith("/app")` — essa rota é um redirect, nunca chega no ProtectedRoute. Código morto, mas sem impacto funcional.
**Correção:** Remover `/app` da checagem.

### 3. Restrições de cliente_user não aplicadas via rota
**Problema:** `useRoleAccess` define rotas bloqueadas para `cliente_user`, mas o `ProtectedRoute` apenas valida role no nível do portal (ex: `["cliente_admin", "cliente_user"]`). A restrição granular de `useRoleAccess` é aplicada manualmente em cada componente — não há guard centralizado.
**Risco:** Se algum componente esquecer de checar, `cliente_user` acessa tela bloqueada.
**Sugestão:** Adicionar um `<RoleAccessGuard>` wrapper que lê `useRoleAccess().getRouteAccess(path)` e bloqueia/redireciona automaticamente.

### 4. GlobalSearch lista rotas que cliente_user não pode acessar
**Problema:** O `GlobalSearch` mostra todas as páginas do portal cliente (Disparos, Dashboard, Tráfego Pago, etc.) sem filtrar por role. Um `cliente_user` vê e pode navegar para rotas bloqueadas.
**Correção:** Filtrar `clientePages` com base no `useRoleAccess().canAccessRoute()`.

### 5. Rotas read_only desatualizadas no useRoleAccess
**Problema:** `/cliente/plano-vendas` e `/cliente/plano-marketing` estão na lista de READ_ONLY, mas ambas são redirects para `/cliente/gps-negocio`. Essas entradas são código morto.
**Correção:** Substituir por `/cliente/gps-negocio` se a intenção é que GPS do Negócio seja read-only para `cliente_user`.

### 6. storageKey para `/` é "noe-saas-auth" — correto
Validado: `/` (login SaaS) usa `noe-saas-auth`. A lógica em `supabase.ts` trata `path === "/"` como SaaS. Sem problema.

---

## Resumo das Correções Necessárias

| # | Arquivo | Correção | Impacto |
|---|---------|----------|---------|
| 1 | `portalRoleGuard.ts` | Mensagem "Acesse /app" → "Acesse /" | Texto |
| 2 | `ProtectedRoute.tsx` | Remover `/app` de detectPortalMismatch | Limpeza |
| 3 | Novo `RoleAccessGuard` | Guard centralizado para rotas bloqueadas de `cliente_user` | Segurança |
| 4 | `GlobalSearch.tsx` | Filtrar rotas por role | UX/Segurança |
| 5 | `useRoleAccess.ts` | Atualizar rotas obsoletas (plano-vendas/marketing → gps-negocio) | Limpeza |

Posso implementar todas essas correções. Deseja prosseguir?


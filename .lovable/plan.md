

# Plano: Arquitetura de Permissões Admin vs Usuário no SaaS

## Problema Atual

Hoje `cliente_admin` e `cliente_user` têm **acesso idêntico** — mesmas rotas, mesma sidebar, mesmas funcionalidades. Não existe nenhuma diferenciação real entre os dois papéis no frontend.

## Definição de Acessos por Papel

### cliente_admin (Administrador)
Acesso completo. É o dono ou gestor da conta.

| Área | Acesso |
|---|---|
| Início, Checklist, Gamificação | Total |
| Plano de Vendas (criar/editar) | Total |
| CRM (leads, funis, config) | Total |
| CRM Config (/crm/config) | **Exclusivo** |
| Conversas WhatsApp | Total |
| Agentes IA (criar/config) | Total |
| Scripts (criar/editar) | Total |
| Disparos (criar/enviar) | Total |
| Relatórios/Dashboard | Total |
| Estratégia Marketing | Total |
| Conteúdos, Redes Sociais, Sites | Total |
| Tráfego Pago | Total |
| Avaliações | Total |
| Integrações | **Exclusivo** |
| Plano & Créditos | **Exclusivo** |
| Configurações (Org + Usuários) | **Exclusivo** |

### cliente_user (Usuário/Operador)
Acesso operacional. Executa tarefas do dia a dia.

| Área | Acesso |
|---|---|
| Início, Checklist, Gamificação | Total |
| Plano de Vendas | **Somente leitura** |
| CRM (leads, atividades) | Total (sem config) |
| CRM Config | **Bloqueado** |
| Conversas WhatsApp | Total |
| Agentes IA | Usar (sem criar/config) |
| Scripts | Usar (sem criar) |
| Disparos | **Bloqueado** |
| Relatórios/Dashboard | **Bloqueado** |
| Estratégia Marketing | **Somente leitura** |
| Conteúdos, Redes Sociais, Sites | Total |
| Tráfego Pago | **Bloqueado** |
| Avaliações | Total |
| Integrações | **Bloqueado** |
| Plano & Créditos | **Bloqueado** |
| Configurações | **Somente Perfil pessoal** |

## Implementação Técnica

### 1. Hook `useRoleAccess` (novo)
Centraliza toda a lógica de permissão por papel:

```typescript
// src/hooks/useRoleAccess.ts
const ADMIN_ONLY_ROUTES = [
  "/cliente/crm/config",
  "/cliente/disparos",
  "/cliente/dashboard",
  "/cliente/trafego-pago",
  "/cliente/integracoes",
  "/cliente/plano-creditos",
];

const READ_ONLY_ROUTES_FOR_USER = [
  "/cliente/plano-vendas",
  "/cliente/plano-marketing",
];

export function useRoleAccess() {
  const { role } = useAuth();
  const isAdmin = role === "cliente_admin";
  
  return {
    isAdmin,
    canAccessRoute: (path) => ...,
    canCreate: (module) => ...,
    canManageSettings: isAdmin,
    canManageUsers: isAdmin,
    canViewFinancials: isAdmin,
  };
}
```

### 2. Sidebar condicional
Atualizar `ClienteSidebar.tsx` para:
- Ocultar itens bloqueados do `cliente_user` (Disparos, Dashboard, Tráfego, Integrações, Plano & Créditos)
- Mostrar ícone de cadeado em itens read-only
- Na seção "Configurações", mostrar só "Meu Perfil" para users

### 3. FeatureGateContext expandido
Adicionar novo `GateReason` = `"admin_only"` que mostra overlay "Funcionalidade restrita ao administrador" nas rotas bloqueadas.

### 4. Configurações diferenciadas
Para `cliente_user`: mostrar apenas a aba "Perfil" (sem Organização, Usuários, Alertas).

### 5. Limite de usuários por plano
Já existe! O `UsersTab` em `ClienteConfiguracoes.tsx` já verifica `plan.maxUsers` e bloqueia convites quando atinge o limite. Apenas garantir que o convite valide também no `invite-user` edge function (server-side).

## Arquivos a Modificar

| Arquivo | Ação |
|---|---|
| `src/hooks/useRoleAccess.ts` | **Novo** — hook centralizado de permissões por papel |
| `src/components/ClienteSidebar.tsx` | Filtrar itens por papel |
| `src/contexts/FeatureGateContext.tsx` | Adicionar gate `admin_only` |
| `src/components/FeatureGateOverlay.tsx` | Adicionar UI para `admin_only` |
| `src/pages/cliente/ClienteConfiguracoes.tsx` | Esconder abas de admin para user |
| `supabase/functions/invite-user/index.ts` | Validar maxUsers server-side |

Nenhuma migration necessária — os papéis `cliente_admin` e `cliente_user` já existem no enum `app_role`.


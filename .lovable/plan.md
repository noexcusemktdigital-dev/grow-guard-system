

## Diagnóstico: Login Travado em Ambos os Portais

### Problemas Encontrados

**1. Portal Franquia (`Auth.tsx`)**: Após login, redireciona para `navigate("/")` — mas a rota `"/"` agora aponta para `<SaasLanding />` (página pública de marketing). O usuário logado cai na landing page em vez do painel interno. Além disso, não tem timeout no `validatePortalAccess`, podendo travar indefinidamente.

**2. Portal SaaS (`SaasAuth.tsx`)**: Usa `window.location.href = "/cliente/inicio"` que causa reload completo da página. No preview do Lovable (iframe), esse reload pode não funcionar corretamente. Como já corrigimos o `ProtectedRoute` para mostrar loader enquanto o role carrega, podemos voltar a usar `navigate()` com segurança.

### Correções

**Arquivo: `src/pages/Auth.tsx`** (login franquia)
- Envolver `validatePortalAccess` em try-catch com timeout de 3s (igual ao SaaS)
- Trocar `navigate("/")` por redirect baseado no role do usuário:
  - super_admin/admin → `/franqueadora/inicio`
  - franqueado → `/franqueado/inicio`
- Consultar role via `user_roles` para determinar o destino correto

**Arquivo: `src/pages/SaasAuth.tsx`** (login SaaS)
- Trocar `window.location.href = "/cliente/inicio"` de volta para `navigate("/cliente/inicio")`
- A race condition já está resolvida pelo fix anterior no `ProtectedRoute`

### Resumo das Alterações

Dois arquivos, duas mudanças simples:
1. `Auth.tsx`: adicionar timeout + corrigir destino do redirect (era `/`, agora será `/franqueadora/inicio` ou `/franqueado/inicio`)
2. `SaasAuth.tsx`: trocar `window.location.href` por `navigate()` para compatibilidade com preview




# Corrigir integração Meta Ads e Instagram

## Dois problemas identificados

### Problema 1: "Requested function was not found"
As edge functions `social-oauth-meta` (Instagram) e `ads-oauth-start` (Meta Ads) existem no código mas **não estão implantadas** no servidor. Precisam ser deployed.

**Ação**: Deploy das funções relevantes:
- `social-oauth-meta`
- `social-oauth-callback`
- `ads-oauth-start`
- `ads-oauth-callback`

### Problema 2: "Não é possível carregar a URL"
O Facebook está rejeitando o redirecionamento porque o **domínio da aplicação** (grow-guard-system.lovable.app e os domínios de preview) não está cadastrado nas configurações do app Meta/Facebook.

**Ação necessária no painel do Facebook Developers** (developers.facebook.com):
1. Acesse seu app Meta → **Configurações** → **Básico**
2. Em **Domínios do app**, adicione:
   - `grow-guard-system.lovable.app`
   - `lovable.app`
3. Em **Produtos** → **Login do Facebook** → **Configurações**:
   - Adicione as URIs de redirecionamento OAuth válidas:
     - `https://gxrhdpbbxfipeopdyygn.supabase.co/functions/v1/ads-oauth-callback`
     - `https://gxrhdpbbxfipeopdyygn.supabase.co/functions/v1/social-oauth-callback`

### Resumo das ações
| Ação | Quem faz |
|------|----------|
| Deploy das 4 edge functions | Lovable (automático) |
| Adicionar domínios no app Facebook | Você, no painel developers.facebook.com |
| Adicionar redirect URIs no Login do Facebook | Você, no painel developers.facebook.com |

Sem o cadastro dos domínios no Facebook, o OAuth sempre retornará o erro "Não é possível carregar a URL", independente do deploy.


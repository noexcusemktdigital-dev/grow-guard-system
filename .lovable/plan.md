

# Renomear Rotas de Autenticacao

Mudanca simples de URLs das paginas de login:

- `/auth` passa a ser `/acessofranquia` (login da franqueadora/franqueado)
- `/app/auth` passa a ser `/app` (login do cliente SaaS)

## Arquivos a editar

| Arquivo | Mudanca |
|---------|---------|
| `src/App.tsx` | Trocar `path="/auth"` por `path="/acessofranquia"` e `path="/app/auth"` por `path="/app"` |
| `src/components/ProtectedRoute.tsx` | Trocar redirects de `/auth` para `/acessofranquia` (2 ocorrencias) |
| `src/components/UserMenu.tsx` | Trocar `navigate("/auth")` para `navigate("/acessofranquia")` |

Total: 3 arquivos, 5 substituicoes de string.


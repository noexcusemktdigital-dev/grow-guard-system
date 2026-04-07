

## Diagnóstico

A usuária `noexcuse.criacao3@gmail.com` (Larissa Polli, ID: `215bc2d9-91a7-4766-a642-79184746b44e`) **autenticou com sucesso** (status 200 nos logs), mas:

- Não tem registro em `user_roles` (nenhum papel atribuído)
- Não tem registro em `organization_memberships` (não está vinculada a nenhuma organização)

Resultado: após login, o `AuthContext` não encontra role nem org, e o `ProtectedRoute` expira o timeout de 6 segundos e mostra tela de erro ou redireciona para lugar errado.

A organização da matriz é: **NoExcuse Franqueadora** (`4206c8f4-dc9b-414d-9535-0c6d5f2d80b4`).

## Solução

Executar uma migration para inserir:

1. **Membership**: vincular Larissa à organização `NoExcuse Franqueadora`
2. **Role**: atribuir o papel `admin` (acesso à matriz, sem ser super_admin)

```sql
INSERT INTO organization_memberships (user_id, organization_id)
VALUES ('215bc2d9-91a7-4766-a642-79184746b44e', '4206c8f4-dc9b-414d-9535-0c6d5f2d80b4')
ON CONFLICT DO NOTHING;

INSERT INTO user_roles (user_id, role)
VALUES ('215bc2d9-91a7-4766-a642-79184746b44e', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;
```

Isso fará o login redirecionar corretamente para `/franqueadora/inicio`.

## Correção secundária (código)

A rota `/redirect` referenciada em `SaasLanding.tsx` na linha 126 não existe em `App.tsx`, causando 404. Trocar para redirecionar com base no role:
- Alterar `<Navigate to="/redirect" replace />` para `<Navigate to="/cliente/inicio" replace />` (pois a SaasLanding é do portal SaaS).

## Arquivos alterados

| Arquivo | Alteração |
|---------|-----------|
| Migration SQL | Inserir membership + role para Larissa |
| `src/pages/SaasLanding.tsx` | Corrigir redirect de `/redirect` para `/cliente/inicio` |


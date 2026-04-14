

## Plano: Criar migration do Sistema de Permissões Granulares

### Resumo
Criar uma única migration SQL contendo todo o sistema de permissões granulares: tabelas `permission_profiles` e `member_permissions`, coluna `permission_profile_id` em `org_teams`, políticas RLS e função `get_member_permissions`.

### Mudança

| Ação | Detalhe |
|---|---|
| Migration SQL | Cria `permission_profiles`, `member_permissions`, altera `org_teams`, cria função `get_member_permissions` com hierarquia individual > time > padrão |

O SQL será exatamente o conteúdo fornecido, executado via ferramenta de migração.




## Plano: Remover filtro por organization_id em useFranchiseCandidates

Editar `src/hooks/useFranchiseCandidates.ts`:

1. Remover import de `useUserOrgId`
2. Remover `const { data: orgId } = useUserOrgId()`
3. Alterar `queryKey` para `["franchise-candidates"]`
4. Remover `if (!orgId) return []` e `.eq("organization_id", orgId)`
5. Remover `enabled: !!orgId`

Resultado: a query retorna todos os candidatos sem filtro de organização.


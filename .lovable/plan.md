

# Correção: Vitor não aparece nas Avaliações

## Problema Identificado

A requisição do hook `useCrmTeam` faz um join PostgREST entre `organization_memberships` e `profiles`:

```typescript
.select("user_id, role, profiles(full_name)")
```

Mas **não existe foreign key** entre `organization_memberships.user_id` e `profiles.id`. O PostgREST retorna **erro 400**: `"Could not find a relationship between 'organization_memberships' and 'profiles'"`. Por isso a lista de membros vem vazia e o Vitor não aparece.

Os dados estão corretos no banco — ambos (Davi Tesch e Vitor Rodrigues) estão na mesma organização.

## Correção

### 1. Migration: Adicionar FK

```sql
ALTER TABLE public.organization_memberships
ADD CONSTRAINT fk_memberships_profiles
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
```

Isso permite ao PostgREST resolver o join `profiles(full_name)` automaticamente.

### 2. Nenhuma alteração de código necessária

O `useCrmTeam` e o `ClienteAvaliacoes` já estão corretos — o único problema é a falta do FK no banco.

## Bonus: Fix do console warning

O `StarRating` recebe ref via Radix UI mas não usa `forwardRef`. Corrigir no `ClienteAvaliacoes.tsx` para eliminar o warning no console.


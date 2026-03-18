

# Fix: "Tornar Padrão" permite múltiplos funis com badge "Padrão"

## Bug
Ao clicar "Tornar padrão" em um funil, o sistema marca o novo como `is_default: true` mas **não remove** o flag do funil anterior. Resultado: múltiplos funis exibem o badge "Padrão" simultaneamente.

## Causa raiz
O `updateFunnel` mutation em `src/hooks/useCrmFunnels.ts` simplesmente faz `UPDATE ... SET is_default = true WHERE id = ?` sem limpar os outros funis da organização.

## Correção
No `updateFunnel.mutationFn`, antes de setar `is_default: true`, executar um `UPDATE crm_funnels SET is_default = false WHERE organization_id = orgId AND id != id_alvo`.

### Arquivo: `src/hooks/useCrmFunnels.ts`

Alterar o `updateFunnel` mutation para:

```typescript
const updateFunnel = useMutation({
  mutationFn: async ({ id, ...updates }: { id: string; [key: string]: any }) => {
    // If setting as default, first clear all other defaults for this org
    if (updates.is_default === true && orgId) {
      await supabase
        .from("crm_funnels")
        .update({ is_default: false })
        .eq("organization_id", orgId)
        .neq("id", id);
    }
    const { data, error } = await supabase
      .from("crm_funnels")
      .update(updates)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },
  onSuccess: () => qc.invalidateQueries({ queryKey: ["crm-funnels"] }),
});
```

Isso é uma alteração de ~5 linhas em um único arquivo. Nenhuma migração de banco necessária.




## Plano — Bloqueio até aprovação do GPS + Animação de desbloqueio

### Problema atual

O `useHasActiveStrategy` retorna `true` quando existe qualquer estratégia ativa (`is_active: true`), **independente do status**. Isso significa que as ferramentas são desbloqueadas assim que o GPS é **gerado**, não quando é **aprovado**. O correto é desbloquear apenas após `status === "approved"`.

### Mudanças

#### 1. Gate: Exigir aprovação para desbloquear

**`src/hooks/useMarketingStrategy.ts`** — Alterar `useHasActiveStrategy` para verificar `status === "approved"`:

```typescript
export function useHasActiveStrategy() {
  const { data, isLoading } = useActiveStrategy();
  return { 
    hasStrategy: !!data && (data as any).status === "approved", 
    isLoading 
  };
}
```

Isso faz com que **todas** as rotas em `MARKETING_STRATEGY_REQUIRED` e `SALES_PLAN_REQUIRED` continuem bloqueadas até o cliente clicar "Aprovar" no GPS.

#### 2. Unificar os dois gates em um só

**`src/contexts/FeatureGateContext.tsx`** — Como o GPS do Negócio unificou vendas + marketing, substituir os dois gates separados (`no_sales_plan` + `no_marketing_strategy`) por um único gate `no_gps_approved`. Todas as rotas que antes exigiam `salesPlanCompleted` OU `hasActiveStrategy` passam a exigir apenas `hasApprovedGPS` (que é a aprovação do GPS unificado).

Rotas bloqueadas sem GPS aprovado:
- `/cliente/crm`, `/cliente/chat`, `/cliente/agentes-ia`, `/cliente/scripts`
- `/cliente/disparos`, `/cliente/dashboard`
- `/cliente/conteudos`, `/cliente/redes-sociais`, `/cliente/sites`, `/cliente/trafego-pago`

#### 3. Overlay atualizado

**`src/components/FeatureGateOverlay.tsx`** — Substituir as duas entradas (`no_sales_plan`, `no_marketing_strategy`) por uma única `no_gps_approved` com mensagem clara: "Complete e aprove o GPS do Negócio para desbloquear esta ferramenta."

#### 4. Animação de "Missão Cumprida" ao aprovar

**`src/pages/cliente/ClienteGPSNegocio.tsx`** — Após `approveStrategy.mutateAsync` ter sucesso, exibir um Dialog/overlay animado com:
- Ícone de troféu/foguete animado (scale-in + confetti via CSS)
- Título: "GPS Aprovado! 🎯"
- Subtítulo: "Todas as ferramentas da plataforma foram desbloqueadas!"
- Grid com ícones das ferramentas liberadas (CRM, Chat, Conteúdos, Sites, etc.) aparecendo em sequência com `staggerChildren`
- Botão "Explorar ferramentas" que fecha o modal

**`src/pages/cliente/ClientePlanoMarketingStrategy.tsx`** — Na `StrategyDashboard`, quando `status !== "approved"`, o botão "Aprovar" fica proeminente. Quando `status === "approved"`, o card "Próximos Passos" já aparece (isso já existe).

#### 5. Sidebar badge atualizado

**`src/components/ClienteSidebar.tsx`** — Substituir referências a `no_sales_plan` / `no_marketing_strategy` por `no_gps_approved`.

### Arquivos a modificar

| Arquivo | Ação |
|---------|------|
| `src/hooks/useMarketingStrategy.ts` | Verificar `status === "approved"` no `useHasActiveStrategy` |
| `src/contexts/FeatureGateContext.tsx` | Unificar gates em `no_gps_approved`, remover `salesPlanCompleted` separado |
| `src/components/FeatureGateOverlay.tsx` | Substituir 2 entries por `no_gps_approved` |
| `src/components/ClienteSidebar.tsx` | Atualizar label do badge |
| `src/pages/cliente/ClienteGPSNegocio.tsx` | Adicionar animação "Missão Cumprida" após aprovação |

### Resultado

- Ferramentas ficam bloqueadas com blur até o GPS ser **aprovado** (não apenas gerado)
- Mensagem de bloqueio é clara e direciona ao GPS
- Ao aprovar, animação celebratória mostra que as ferramentas foram liberadas
- Sistema de gates simplificado com um único check


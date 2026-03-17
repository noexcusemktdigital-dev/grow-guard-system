

## Plano: Corrigir falso alerta de "Créditos esgotados"

### Problema

O banner "Créditos esgotados" aparece para clientes trial que **ainda têm créditos**. Duas causas:

1. **`CreditAlertBanner` não verifica `isLoading`** — enquanto a wallet está carregando, `wallet` é `null`, o hook retorna `balance = 0`, e o banner exibe "zerado" antes dos dados chegarem.

2. **`useCreditAlert` trata `wallet === null` como saldo zero** — se a wallet ainda não carregou (ou se houve um erro de rede), `wallet?.balance ?? 0` retorna 0 imediatamente.

### Correção

| Arquivo | Mudança |
|---------|---------|
| `src/components/cliente/CreditAlertBanner.tsx` | Não renderizar o banner enquanto `isLoading` for `true` |
| `src/hooks/useCreditAlert.ts` | Retornar `level: "normal"` enquanto estiver carregando (não mostrar alerta) |

### Detalhes

**`useCreditAlert.ts`** — adicionar early return quando loading:
```typescript
if (wl || sl) {
  return { level: "normal", percent: 100, balance: 0, total: 0, isLoading: true };
}
```

**`CreditAlertBanner.tsx`** — adicionar guard de loading:
```typescript
const { level, percent, balance, isLoading } = useCreditAlert();
if (isLoading) return null;
```

Isso garante que o banner só aparece quando temos certeza que o saldo é realmente zero/baixo.


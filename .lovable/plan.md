

## Plano: Ampliar opções de Ticket Médio no Plano de Vendas

### Problema
As opções de ticket médio param em "R$ 15 mil+", sem faixas para negócios com tickets mais altos (consultorias, imobiliárias, B2B enterprise, etc.).

### Mudança

**Arquivo:** `src/pages/cliente/ClientePlanoVendas.tsx`

1. **Expandir opções do campo `ticket_medio`** (linha ~144-148):
```
Até R$ 200 | R$ 200-1 mil | R$ 1-5 mil | R$ 5-15 mil | R$ 15-50 mil | R$ 50-150 mil | R$ 150 mil+
```

2. **Atualizar o `ticketMap`** na função `getRevenueProjection` (linha ~554-555) para mapear as novas faixas:
```
"15-50k": 30000, "50-150k": 90000, "150k+": 200000
```

Isso substitui o antigo `"15k+": 20000` por três faixas mais granulares, mantendo retrocompatibilidade (quem já respondeu `"15k+"` continua funcionando via fallback).


---
description: Formatadores compartilhados para Sistema Noé
---

# formatters.ts

Utilitários de formatação para exibição de dados no padrão brasileiro.

## Funções

| Função | Entrada | Saída |
|---|---|---|
| `formatBRL(value)` | `number \| null` | `R$ 1.234,56` |
| `formatPhone(phone)` | `string \| null` | `(11) 9 9999-9999` |
| `formatCPF(cpf)` | `string \| null` | `123.456.789-01` |
| `formatCNPJ(cnpj)` | `string \| null` | `12.345.678/0001-90` |
| `formatDate(input)` | `string \| Date \| null` | `15/01/2026` |
| `formatDateTime(input)` | `string \| Date \| null` | `15/01/2026 14:30` |
| `formatRelative(input)` | `string \| Date \| null` | `há 3 horas` |

## Uso

```ts
import { formatBRL, formatPhone, formatCPF } from '@/lib/formatters';

formatBRL(1234.56)        // "R$ 1.234,56"
formatBRL(null)           // "R$ 0,00"
formatPhone('11999999999') // "(11) 9 9999-9999"
formatCPF('12345678901')   // "123.456.789-01"
```

## Comportamento com valores nulos

Todas as funções aceitam `null` e `undefined` sem lançar erros:
- `formatBRL(null)` → `"R$ 0,00"`
- Demais funções → `""`

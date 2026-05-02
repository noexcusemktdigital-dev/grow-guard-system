# error-toast helper

Padrão único pra reportar erros ao usuário:
- Toast user-friendly (sonner)
- Console em dev
- Analytics tracking (sem PII)
- x-request-id pra debug

## Uso

```ts
import { reportError, reportEdgeError } from '@/lib/error-toast';

// Erro genérico
try { ... } catch (err) {
  reportError(err, { title: 'Falha ao salvar', category: 'crm.lead_save' });
}

// Erro de invokeEdge
const result = await invokeEdge('asaas-buy-credits', { body });
if (result.error) {
  reportEdgeError(result, { title: 'Falha na compra', category: 'asaas.buy_credits' });
  return;
}
```

## API

### `reportError(err, options?)`

| Opção | Tipo | Default | Descrição |
|-------|------|---------|-----------|
| `title` | `string` | `'Erro'` | Título do toast |
| `category` | `string` | `'unknown'` | Categoria para analytics (sem PII) |
| `showRequestId` | `boolean` | `true` | Exibe requestId no toast para debug |
| `console` | `boolean` | `true` em DEV | Loga no console.error |

### `reportEdgeError(result, options?)`

Wrapper para o retorno de `invokeEdge`. Só executa se `result.error` for truthy.
Injeta `result.requestId` no erro automaticamente.

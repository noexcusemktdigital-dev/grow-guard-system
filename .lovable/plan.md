

# Problema: Filtro por instância não está funcionando

## Diagnóstico

O código em `ClienteChat.tsx` já passa `instance?.id ?? null` para `useWhatsAppContacts`, mas o hook executa a query **antes** da instância carregar. Na primeira renderização, `instance` ainda é `undefined`, então `filterInstanceId` é `null` e a query roda sem filtro de `instance_id` -- buscando **todos** os contatos da organização (incluindo os do número antigo).

As requests de rede confirmam: a URL não contém `instance_id=eq.xxx`, mostrando que o filtro nunca é aplicado.

## Solução

Duas alterações simples:

### 1. Hook `useWhatsAppContacts` -- impedir execução sem filtro

Adicionar `filterInstanceId` à condição `enabled` para que a query só execute quando o ID da instância estiver disponível:

```typescript
enabled: !!orgId && !!filterInstanceId,
```

Isso garante que a query nunca rode sem o filtro, evitando buscar contatos do número antigo.

### 2. Garantir que `filterInstanceId` undefined vira null corretamente

No `ClienteChat.tsx`, a linha já está correta (`instance?.id ?? null`), mas o hook precisa tratar o caso onde `filterInstanceId` é `null` como "não pronto" ao invés de "sem filtro".

### Detalhes técnicos

**Arquivo**: `src/hooks/useWhatsApp.ts`, função `useWhatsAppContacts`
- Linha 80: mudar `enabled: !!orgId` para `enabled: !!orgId && !!filterInstanceId`
- Isso resolve o problema na raiz: contatos só são buscados quando sabemos qual instância filtrar

Resultado: apenas conversas do número **554491129613** (instância ativa) aparecerão na lista de conversas.


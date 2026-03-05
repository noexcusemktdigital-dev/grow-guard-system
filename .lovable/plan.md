
# Fix: Upload de referências visuais falhando por caracteres especiais no nome do arquivo

## Causa raiz

O Supabase Storage retorna `InvalidKey` quando o path contém espaços ou caracteres especiais (acentos como "à", "ã", etc.). Os nomes de arquivo do usuário como "Captura de Tela 2026-03-04 às 01.06.37.png" causam esse erro.

## Correção

**Arquivo:** `src/pages/cliente/ClienteRedesSociais.tsx` (linha 245)

Sanitizar o nome do arquivo antes de montar o path de upload, substituindo qualquer caractere que não seja alfanumérico, ponto, hífen ou underscore por `_`:

```typescript
// Antes:
const path = `references/${orgId}/${Date.now()}_${file.name}`;

// Depois:
const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
const path = `references/${orgId}/${Date.now()}_${safeName}`;
```

Apenas 1 linha alterada. Nenhuma outra mudança necessária.



# Prioridade 4: Limpeza final

## Situacao

A pasta `src/mocks/` ja foi deletada. Os tipos `home.ts`, `metas.ts`, `comunicados.ts`, `unidades.ts` ja foram limpos de dados mock.

O unico resquicio encontrado esta em **`src/types/marketing.ts`**, que ainda exporta `mockFolders`, `mockAssets` e funcoes que dependem desses arrays mock (`getCategoryAssetCount`, `getAssetsByCategory`, `getFoldersByCategory`, `getChildFolders`, `getAssetsInFolder`). Esses sao consumidos por `MarketingDrive.tsx`.

## Plano

### 1. Limpar `src/types/marketing.ts`
- Remover `mockFolders` e `mockAssets` (arrays hardcoded)
- Remover as 5 funcoes que dependem deles (`getCategoryAssetCount`, `getAssetsByCategory`, `getFoldersByCategory`, `getChildFolders`, `getAssetsInFolder`)
- Manter todos os tipos/interfaces e helpers puros (labels, colors, etc.)

### 2. Atualizar `src/components/MarketingDrive.tsx`
- Remover imports das funcoes deletadas
- Usar o hook `useMarketing()` (ja existe em `src/hooks/useMarketing.ts`) para buscar assets e folders reais do banco
- Adaptar a logica de navegacao de pastas e filtragem para usar dados do hook

| Arquivo | Acao |
|---------|------|
| `src/types/marketing.ts` | Remover mock data e funcoes dependentes |
| `src/components/MarketingDrive.tsx` | Migrar para `useMarketing()` com dados reais |


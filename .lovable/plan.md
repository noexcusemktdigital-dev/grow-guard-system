
## Plano: Reestruturação do Motor de Redes Sociais

### Status: ✅ Implementado (v2 — Logo Real + Multi-Layout)

### Resumo
Motor de geração de artes com 3 frentes implementadas:

1. **Stage 3 — Composição de Logo Real**: Arte gerada no Stage 2 com espaço reservado → Stage 3 usa `gemini-3.1-flash-image-preview` para sobrepor a logo real do cliente pixel-perfect
2. **Extração de Logo das Referências**: Botão "Extrair logo" no RefUploader que usa IA para detectar e isolar a logo das imagens de referência
3. **Multi-Layout (até 2)**: LayoutPicker permite selecionar 1 ou 2 diagramações. Com 2 layouts, gera variações separadas (uma arte por layout)

### Fluxo (6 steps)
| Step | Conteúdo |
|------|----------|
| 1 | Briefing + Objetivo + Frase obrigatória |
| 2 | Tipo de postagem + quantidade |
| 3 | Diagramação (9 layouts, multi-select máx 2) |
| 4 | Referências + Logo (separados) + extração IA |
| 5 | Formato (1:1, 4:5, 9:16) |
| 6 | Review (textos gerados pela IA, editáveis) |

### Pipeline de geração
```
Stage 1 (CoT) → Extrai design system das refs
Stage 2 (Geração) → Gera arte com espaço reservado para logo
Stage 3 (Composição) → Sobrepõe logo real via image editing
```

### Arquivos modificados
- `constants.ts` — `LAYOUT_TYPES` com 9 layouts + `ART_OBJECTIVES`
- `LayoutPicker.tsx` — multi-select (máx 2) com SVG mockups e badge de ordem
- `ArtWizard.tsx` — `layoutTypes: string[]`, variações por layout, custo atualizado
- `RefUploader.tsx` — botão "Extrair logo das referências" + upload dedicado
- `useClientePosts.ts` — campos layout_type/logo_url/primary_ref_index
- `ClienteRedesSociais.tsx` — loop por layoutVariations × basePieces
- `generate-social-image/index.ts` — Stage 3 composição, extract_logo mode, espaço reservado no prompt

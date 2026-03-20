
## Plano: Reestruturação do Motor de Redes Sociais

### Status: ✅ Implementado

### Resumo
Motor de geração de artes reestruturado de 8 steps para 6 steps com 3 camadas:

1. **Diagramação (9 layouts com mockup SVG)**: Substituiu `ART_STYLES` por `LAYOUT_TYPES` — cada layout tem regras de composição específicas enviadas ao prompt
2. **Logo separado + Peso de referências**: Upload dedicado para logo (auto-preenchido da identidade visual) + marcação de referência principal (⭐ peso 60%)
3. **Geração automática de copy**: IA gera headline/sub/CTA a partir do briefing + objetivo, com edição opcional no review

### Novo fluxo (6 steps)
| Step | Conteúdo |
|------|----------|
| 1 | Briefing + Objetivo + Frase obrigatória |
| 2 | Tipo de postagem + quantidade |
| 3 | Diagramação (9 layouts com SVG mockup) |
| 4 | Referências + Logo (separados) |
| 5 | Formato (1:1, 4:5, 9:16) |
| 6 | Review (textos gerados pela IA, editáveis) |

### Arquivos modificados
- `constants.ts` — `LAYOUT_TYPES` com 9 layouts + `ART_OBJECTIVES`
- `LayoutPicker.tsx` — novo componente com SVG mockups
- `ArtWizard.tsx` — 6 steps, auto-fill IA, logo + ref weight
- `RefUploader.tsx` — logo upload dedicado, estrela de ref principal
- `useClientePosts.ts` — novos campos layout_type/logo_url/primary_ref_index
- `ClienteRedesSociais.tsx` — passa novos campos ao hook
- `generate-social-image/index.ts` — layout rules, logo em Stage 2, ref weighting em CoT

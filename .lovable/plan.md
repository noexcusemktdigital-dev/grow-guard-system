

## Plano: Refinar Stage 3 — Contraste da Logo

### Diagnóstico
Linhas 1177-1183 do `supabase/functions/generate-social-image/index.ts` contêm referências a "glow halo", "shadow" e "gaussian glow" — técnicas que IA generativa não executa bem, resultando em artefatos visuais ou simplesmente sendo ignoradas.

### Mudança

Substituir o bloco `CONTRAST PROTECTION` (linhas 1177-1183) por instruções com apenas duas estratégias confiáveis:

```
CONTRAST PROTECTION (CRITICAL):
- Analyze the dominant color of the area where the logo will be placed
- If the logo and background have LOW CONTRAST (both dark or both light), you MUST use ONE of these two strategies:
  STRATEGY A — BACKGROUND SHAPE: Place a solid rounded rectangle (pill shape) in a contrasting color behind the logo. Use a fully opaque, clean shape that matches the design style. Example: white pill behind dark logo on dark background, or dark pill behind light logo on light background.
  STRATEGY B — COLOR INVERSION: Invert the logo colors to contrast with the background. Example: if the logo is black and the background is dark, render the logo in white instead.
- Choose the strategy that looks most professional for the specific design
- Do NOT use glow, shadow, halo, blur, or semi-transparent effects — they produce unreliable results
- The logo must ALWAYS have 100% legibility regardless of the background
```

### Arquivo alterado

| Arquivo | Mudança |
|---|---|
| `supabase/functions/generate-social-image/index.ts` | Linhas 1177-1183: substituir bloco CONTRAST PROTECTION |


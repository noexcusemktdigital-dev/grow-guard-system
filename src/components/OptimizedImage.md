# OptimizedImage

Componente wrapper para imagens otimizadas com `loading="lazy"` e `decoding="async"`.
Funciona em conjunto com o plugin `vite-imagetools` configurado em `vite.config.ts`.

## Como importar imagens com vite-imagetools

Use o sufixo `?img` para ativar a otimização padrão (WebP + AVIF, quality 80):

```tsx
import heroBanner from '@/assets/hero-banner.jpg?img';

// heroBanner será um objeto { sources, img } para <picture>
```

Para controle granular, passe os parâmetros diretamente na query string:

```tsx
import thumbnail from '@/assets/thumbnail.png?format=webp&quality=75&w=400';

<img src={thumbnail} alt="Thumbnail" width={400} />
```

## Quando usar `OptimizedImage` vs `<img>` cru

| Situação | Recomendação |
|---|---|
| Imagem abaixo do fold (conteúdo, cards, listas) | `<OptimizedImage>` — lazy loading automático |
| Imagem acima do fold (hero, logo principal) | `<img loading="eager">` — não atrasar LCP |
| Ícones SVG inline | `<img>` direto ou componente de ícone |
| Imagens carregadas dinamicamente via URL externa | `<img>` com `loading="lazy"` manual |

```tsx
import { OptimizedImage } from '@/components/OptimizedImage';
import cardPhoto from '@/assets/card-photo.jpg?format=webp&quality=80&w=600';

// Uso básico
<OptimizedImage src={cardPhoto} alt="Foto do card" width={600} height={400} />

// Com className adicional
<OptimizedImage
  src={cardPhoto}
  alt="Foto do card"
  width={600}
  height={400}
  className="rounded-lg object-cover"
/>
```

## Browser support

- **WebP**: suportado em todos os browsers modernos (Chrome 23+, Firefox 65+, Safari 14+, Edge 18+)
- **AVIF**: suportado em Chrome 85+, Firefox 93+, Safari 16+

Para o `vite-imagetools` gerar `<picture>` com fallback automático entre formatos, use
`as=picture` na query (já configurado pelo parâmetro `?img`). Browsers que não suportam
AVIF farão fallback para WebP, e browsers muito antigos usarão o formato original.

## Notas

- Nunca substitua imagens acima do fold (hero, LCP) por lazy loading — isso prejudica o Core Web Vitals.
- Forneça sempre `width` e `height` para evitar layout shift (CLS).
- O plugin só processa imagens importadas estaticamente — URLs dinâmicas (Supabase Storage, CDN) não são afetadas.

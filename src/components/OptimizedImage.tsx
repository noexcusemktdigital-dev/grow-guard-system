import { ImgHTMLAttributes } from 'react';

interface OptimizedImageProps extends ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  width?: number;
  height?: number;
}

/**
 * Wrapper de <img> com loading lazy + decoding async + dimensões.
 * Combina com vite-imagetools para servir WebP/AVIF.
 */
export function OptimizedImage({ src, alt = '', width, height, ...rest }: OptimizedImageProps) {
  return (
    <img
      src={src}
      alt={alt}
      width={width}
      height={height}
      loading="lazy"
      decoding="async"
      {...rest}
    />
  );
}

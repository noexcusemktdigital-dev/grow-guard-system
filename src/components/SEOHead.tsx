import { useEffect } from 'react';

export interface SEOHeadProps {
  title: string;
  description: string;
  canonical?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogType?: 'website' | 'article';
  twitterCard?: 'summary' | 'summary_large_image';
  noindex?: boolean;
}

/**
 * SEO Head — vanilla DOM API (sem react-helmet).
 * Atualiza document title + meta tags ao montar componente.
 *
 * Cleanup: NÃO faz cleanup (próxima rota sobrescreve).
 *
 * Uso:
 *   <SEOHead
 *     title="Sistema Noé — Marketing Digital para Franquias"
 *     description="Plataforma completa..."
 *     canonical="https://noexcuse.com.br/"
 *   />
 */
export function SEOHead({
  title,
  description,
  canonical,
  ogTitle,
  ogDescription,
  ogImage,
  ogType = 'website',
  twitterCard = 'summary_large_image',
  noindex,
}: SEOHeadProps) {
  useEffect(() => {
    document.title = title;

    const setMeta = (name: string, content: string, isProperty = false) => {
      const attr = isProperty ? 'property' : 'name';
      let el = document.querySelector(`meta[${attr}="${name}"]`);
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute(attr, name);
        document.head.appendChild(el);
      }
      el.setAttribute('content', content);
    };

    const setLink = (rel: string, href: string) => {
      let el = document.querySelector(`link[rel="${rel}"]`);
      if (!el) {
        el = document.createElement('link');
        el.setAttribute('rel', rel);
        document.head.appendChild(el);
      }
      el.setAttribute('href', href);
    };

    setMeta('description', description);
    if (canonical) setLink('canonical', canonical);

    setMeta('og:title', ogTitle ?? title, true);
    setMeta('og:description', ogDescription ?? description, true);
    setMeta('og:type', ogType, true);
    if (canonical) setMeta('og:url', canonical, true);
    if (ogImage) setMeta('og:image', ogImage, true);

    setMeta('twitter:card', twitterCard);
    setMeta('twitter:title', ogTitle ?? title);
    setMeta('twitter:description', ogDescription ?? description);
    if (ogImage) setMeta('twitter:image', ogImage);

    setMeta('robots', noindex ? 'noindex, nofollow' : 'index, follow');
  }, [title, description, canonical, ogTitle, ogDescription, ogImage, ogType, twitterCard, noindex]);

  return null;
}

/**
 * T4 SEO-HEAD — Valida SEOHead em src/components/SEOHead.tsx
 *
 * Verifica:
 * 1. Define document.title
 * 2. Define meta description
 * 3. Define canonical link
 * 4. noindex aplica robots noindex,nofollow
 * 5. og:image é definido quando fornecido
 * 6. Caminhos: props completas, mínimas, noindex
 */
import React from "react";
import { describe, it, expect, beforeEach } from "vitest";
import { render } from "@testing-library/react";
import { SEOHead } from "@/components/SEOHead";

// ── Helpers ──────────────────────────────────────────────────────────────────

function getMeta(nameOrProp: string, isProperty = false): string | null {
  const attr = isProperty ? "property" : "name";
  return document.querySelector(`meta[${attr}="${nameOrProp}"]`)?.getAttribute("content") ?? null;
}

function getLink(rel: string): string | null {
  return document.querySelector(`link[rel="${rel}"]`)?.getAttribute("href") ?? null;
}

// ── Setup ────────────────────────────────────────────────────────────────────

beforeEach(() => {
  // Limpa document.title e metas criadas entre testes
  document.title = "";
  document.querySelectorAll("meta[name], meta[property], link[rel='canonical']").forEach(el => el.remove());
});

// ── Testes básicos ───────────────────────────────────────────────────────────

describe("T4 SEO-HEAD — document.title", () => {
  it("define document.title com o valor da prop title", () => {
    render(<SEOHead title="Sistema Noé — Dashboard" description="Plataforma de seguros" />);
    expect(document.title).toBe("Sistema Noé — Dashboard");
  });

  it("atualiza document.title quando prop muda (re-render)", () => {
    const { rerender } = render(<SEOHead title="Título Inicial" description="Desc" />);
    expect(document.title).toBe("Título Inicial");
    rerender(<SEOHead title="Título Atualizado" description="Desc" />);
    expect(document.title).toBe("Título Atualizado");
  });
});

describe("T4 SEO-HEAD — meta description", () => {
  it("define meta[name='description'] com o valor correto", () => {
    render(<SEOHead title="Título" description="Plataforma completa para gestão de seguros" />);
    expect(getMeta("description")).toBe("Plataforma completa para gestão de seguros");
  });

  it("meta description não fica vazia quando description é passada", () => {
    render(<SEOHead title="T" description="Minha descrição detalhada" />);
    const desc = getMeta("description");
    expect(desc).toBeTruthy();
    expect(desc).not.toBe("");
  });
});

describe("T4 SEO-HEAD — canonical link", () => {
  it("define link[rel='canonical'] quando canonical é fornecido", () => {
    render(
      <SEOHead
        title="Título"
        description="Desc"
        canonical="https://noexcuse.com.br/dashboard"
      />
    );
    expect(getLink("canonical")).toBe("https://noexcuse.com.br/dashboard");
  });

  it("NÃO cria link canonical quando prop não é passada", () => {
    render(<SEOHead title="Título" description="Desc" />);
    expect(getLink("canonical")).toBeNull();
  });
});

describe("T4 SEO-HEAD — noindex", () => {
  it("meta robots é 'noindex, nofollow' quando noindex=true", () => {
    render(<SEOHead title="Título" description="Desc" noindex />);
    expect(getMeta("robots")).toBe("noindex, nofollow");
  });

  it("meta robots é 'index, follow' quando noindex não é passado", () => {
    render(<SEOHead title="Título" description="Desc" />);
    expect(getMeta("robots")).toBe("index, follow");
  });

  it("meta robots é 'index, follow' quando noindex=false", () => {
    render(<SEOHead title="Título" description="Desc" noindex={false} />);
    expect(getMeta("robots")).toBe("index, follow");
  });
});

describe("T4 SEO-HEAD — og:image", () => {
  it("define og:image quando ogImage é fornecido", () => {
    render(
      <SEOHead
        title="Título"
        description="Desc"
        ogImage="https://cdn.noexcuse.com.br/og.png"
      />
    );
    expect(getMeta("og:image", true)).toBe("https://cdn.noexcuse.com.br/og.png");
  });

  it("NÃO define og:image quando ogImage não é passado", () => {
    render(<SEOHead title="Título" description="Desc" />);
    expect(getMeta("og:image", true)).toBeNull();
  });
});

describe("T4 SEO-HEAD — Open Graph básico", () => {
  it("define og:title usando title quando ogTitle não é fornecido", () => {
    render(<SEOHead title="Título Padrão" description="Desc" />);
    expect(getMeta("og:title", true)).toBe("Título Padrão");
  });

  it("define og:type como 'website' por padrão", () => {
    render(<SEOHead title="Título" description="Desc" />);
    expect(getMeta("og:type", true)).toBe("website");
  });
});

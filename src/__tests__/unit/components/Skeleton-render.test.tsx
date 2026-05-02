/**
 * T-SKELETON-RENDER — Valida renderização do componente Skeleton (ui/skeleton)
 *
 * Verifica:
 * 1. Renderiza sem erros (monta sem throw)
 * 2. Possui classe animate-pulse (efeito de loading)
 * 3. className extra passada via prop é incluída
 * 4. Sem className extra → não quebra (className opcional)
 * 5. Aceita children (div genérica)
 * 6. displayName está configurado corretamente
 *
 * 6 asserts
 */
import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";

import { Skeleton } from "@/components/ui/skeleton";

// ── Testes ────────────────────────────────────────────────────────────────────

describe("Skeleton — renderização básica", () => {
  it("renderiza sem erros (monta sem throw)", () => {
    expect(() =>
      render(<Skeleton data-testid="skel" />)
    ).not.toThrow();
  });

  it("possui classe animate-pulse (efeito pulse)", () => {
    const { container } = render(<Skeleton data-testid="skel" />);
    const el = container.firstChild as HTMLElement;
    expect(el.className).toContain("animate-pulse");
  });

  it("className extra passada via prop é incluída", () => {
    const { container } = render(
      <Skeleton className="h-4 w-full" data-testid="skel" />
    );
    const el = container.firstChild as HTMLElement;
    expect(el.className).toContain("h-4");
    expect(el.className).toContain("w-full");
  });
});

describe("Skeleton — props opcionais e flexibilidade", () => {
  it("sem className extra → não quebra", () => {
    expect(() => render(<Skeleton />)).not.toThrow();
  });

  it("aceita children sem erros", () => {
    expect(() =>
      render(
        <Skeleton>
          <span>loading...</span>
        </Skeleton>
      )
    ).not.toThrow();
  });

  it("displayName está configurado como 'Skeleton'", () => {
    expect(Skeleton.displayName).toBe("Skeleton");
  });
});

/**
 * T5 ANALYTICS-PAGE-TRACKER — Valida AnalyticsPageTracker
 *
 * Verifica:
 * 1. Mount → analytics.page chamado com pathname
 * 2. Mudança de pathname → analytics.page chamado novamente
 * 3. Mudança de search params → analytics.page chamado novamente
 * 4. analytics.page recebe search como property
 * 5. Mudança de pathname → pathname correto propagado
 * 6. Componente retorna null (sem DOM visível)
 *
 * 6 asserts
 */
import React, { useRef } from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, act } from "@testing-library/react";
import { MemoryRouter, useNavigate } from "react-router-dom";

// ── Mocks ─────────────────────────────────────────────────────────────────────

const { mockPage } = vi.hoisted(() => ({ mockPage: vi.fn() }));

vi.mock("@/lib/analytics", () => ({
  analytics: {
    page: mockPage,
    track: vi.fn(),
    identify: vi.fn(),
    reset: vi.fn(),
  },
}));

// ── Import do componente real após mocks ──────────────────────────────────────
import { AnalyticsPageTracker } from "@/lib/analytics-page-tracker";

// ── Helpers ───────────────────────────────────────────────────────────────────

function renderWithRouter(initialEntries: string[]) {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <AnalyticsPageTracker />
    </MemoryRouter>
  );
}

// Componente auxiliar que permite navegar programaticamente dentro do mesmo router
let navigateFn: ((to: string) => void) | null = null;

function NavCapture() {
  const navigate = useNavigate();
  navigateFn = navigate;
  return null;
}

function renderWithNav(initialPath: string) {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <AnalyticsPageTracker />
      <NavCapture />
    </MemoryRouter>
  );
}

// ── Testes ────────────────────────────────────────────────────────────────────

describe("T5 ANALYTICS-PAGE-TRACKER — mount e page views", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    navigateFn = null;
  });

  it("mount → analytics.page chamado com pathname correto", () => {
    renderWithRouter(["/dashboard"]);
    expect(mockPage).toHaveBeenCalledTimes(1);
    expect(mockPage).toHaveBeenCalledWith("/dashboard", expect.any(Object));
  });

  it("mudança de pathname via navigate → analytics.page chamado novamente", () => {
    renderWithNav("/dashboard");
    expect(mockPage).toHaveBeenCalledTimes(1);

    act(() => {
      navigateFn?.("/crm");
    });

    expect(mockPage).toHaveBeenCalledTimes(2);
    expect(mockPage).toHaveBeenLastCalledWith("/crm", expect.any(Object));
  });

  it("pathname correto propagado para analytics.page", () => {
    renderWithRouter(["/relatorios/financeiro"]);
    expect(mockPage).toHaveBeenCalledWith("/relatorios/financeiro", expect.any(Object));
  });
});

describe("T5 ANALYTICS-PAGE-TRACKER — search params", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    navigateFn = null;
  });

  it("search params propagados como property no analytics.page", () => {
    renderWithRouter(["/leads?status=active&page=2"]);
    expect(mockPage).toHaveBeenCalledWith(
      "/leads",
      expect.objectContaining({ search: "?status=active&page=2" })
    );
  });

  it("mudança de search params via navigate → analytics.page chamado novamente", () => {
    renderWithNav("/leads?page=1");
    expect(mockPage).toHaveBeenCalledTimes(1);

    act(() => {
      navigateFn?.("/leads?page=2");
    });

    expect(mockPage).toHaveBeenCalledTimes(2);
  });

  it("componente retorna null — sem elementos no DOM", () => {
    const { container } = renderWithRouter(["/dashboard"]);
    // AnalyticsPageTracker retorna null — apenas o wrapper MemoryRouter
    expect(container.firstChild).toBeNull();
  });
});

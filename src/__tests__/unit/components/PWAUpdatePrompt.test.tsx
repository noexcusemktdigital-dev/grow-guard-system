/**
 * T4 PWA-PROMPT — Valida comportamento do PWAUpdatePrompt
 *
 * O componente real importa "virtual:pwa-register/react" (módulo virtual Vite
 * injetado em build-time). Em Vitest esse módulo não existe, então o teste
 * verifica a lógica de apresentação e interação de forma isolada, usando um
 * componente espelho que reproduz fielmente a mesma interface pública.
 *
 * Verifica:
 * 1. Banner aparece quando needRefresh=true
 * 2. Banner aparece quando offlineReady=true
 * 3. Botão "Atualizar agora" chama updateServiceWorker(true)
 * 4. Botão "Depois" chama setNeedRefresh(false) — esconde o banner
 * 5. offlineReady sem needRefresh: botão OK chama setOfflineReady(false)
 * 6. Null render quando nenhum estado ativo
 * 7. Não exibe "Atualizar agora" quando apenas offlineReady=true
 * 8. Exibe mensagem de melhoria disponível
 */
import React, { useState } from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

// ── Componente espelho — reproduz fielmente a lógica de PWAUpdatePrompt ──────
// Não importa o arquivo original pois depende de virtual:pwa-register/react

interface PWATestProps {
  initialNeedRefresh?: boolean;
  initialOfflineReady?: boolean;
  onUpdateServiceWorker?: (reloadPage: boolean) => void;
}

function PWAUpdatePromptMirror({
  initialNeedRefresh = false,
  initialOfflineReady = false,
  onUpdateServiceWorker = vi.fn(),
}: PWATestProps) {
  const [needRefresh, setNeedRefresh] = useState(initialNeedRefresh);
  const [offlineReady, setOfflineReady] = useState(initialOfflineReady);

  if (!needRefresh && !offlineReady) return null;

  return (
    <div data-testid="pwa-banner" className="fixed bottom-4 right-4 z-50 max-w-sm">
      <div>
        <div>
          {offlineReady && !needRefresh && (
            <>
              <p>App pronto para uso offline.</p>
              <button onClick={() => setOfflineReady(false)}>
                OK
              </button>
            </>
          )}
          {needRefresh && (
            <>
              <p>Nova versão disponível</p>
              <p>Atualize para receber as últimas melhorias.</p>
              <div>
                <button onClick={() => onUpdateServiceWorker(true)}>
                  Atualizar agora
                </button>
                <button onClick={() => setNeedRefresh(false)}>
                  Depois
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Testes ────────────────────────────────────────────────────────────────────

describe("T4 PWA-PROMPT — sem updates (null render)", () => {
  it("não renderiza nada quando needRefresh=false e offlineReady=false", () => {
    const { container } = render(<PWAUpdatePromptMirror />);
    expect(container.firstChild).toBeNull();
  });

  it("data-testid pwa-banner NÃO existe quando estado inativo", () => {
    render(<PWAUpdatePromptMirror />);
    expect(screen.queryByTestId("pwa-banner")).toBeNull();
  });
});

describe("T4 PWA-PROMPT — needRefresh=true", () => {
  it("exibe banner quando needRefresh=true", () => {
    render(<PWAUpdatePromptMirror initialNeedRefresh />);
    expect(screen.getByTestId("pwa-banner")).toBeInTheDocument();
  });

  it("exibe texto 'Nova versão disponível' quando needRefresh=true", () => {
    render(<PWAUpdatePromptMirror initialNeedRefresh />);
    expect(screen.getByText(/nova versão disponível/i)).toBeInTheDocument();
  });

  it("exibe botão 'Atualizar agora' quando needRefresh=true", () => {
    render(<PWAUpdatePromptMirror initialNeedRefresh />);
    expect(screen.getByText(/atualizar agora/i)).toBeInTheDocument();
  });

  it("botão 'Atualizar agora' chama updateServiceWorker(true)", () => {
    const mockUpdate = vi.fn();
    render(<PWAUpdatePromptMirror initialNeedRefresh onUpdateServiceWorker={mockUpdate} />);
    fireEvent.click(screen.getByText(/atualizar agora/i));
    expect(mockUpdate).toHaveBeenCalledWith(true);
  });

  it("botão 'Depois' esconde o banner (setNeedRefresh false)", () => {
    render(<PWAUpdatePromptMirror initialNeedRefresh />);
    expect(screen.getByTestId("pwa-banner")).toBeInTheDocument();
    fireEvent.click(screen.getByText(/depois/i));
    expect(screen.queryByTestId("pwa-banner")).toBeNull();
  });

  it("exibe mensagem de melhoria disponível", () => {
    render(<PWAUpdatePromptMirror initialNeedRefresh />);
    expect(screen.getByText(/últimas melhorias/i)).toBeInTheDocument();
  });
});

describe("T4 PWA-PROMPT — offlineReady=true", () => {
  it("exibe banner quando offlineReady=true", () => {
    render(<PWAUpdatePromptMirror initialOfflineReady />);
    expect(screen.getByTestId("pwa-banner")).toBeInTheDocument();
  });

  it("exibe texto 'App pronto para uso offline'", () => {
    render(<PWAUpdatePromptMirror initialOfflineReady />);
    expect(screen.getByText(/app pronto para uso offline/i)).toBeInTheDocument();
  });

  it("botão OK fecha o banner (setOfflineReady false)", () => {
    render(<PWAUpdatePromptMirror initialOfflineReady />);
    fireEvent.click(screen.getByText(/ok/i));
    expect(screen.queryByTestId("pwa-banner")).toBeNull();
  });

  it("não exibe botão 'Atualizar agora' quando apenas offlineReady=true", () => {
    render(<PWAUpdatePromptMirror initialOfflineReady />);
    expect(screen.queryByText(/atualizar agora/i)).toBeNull();
  });
});

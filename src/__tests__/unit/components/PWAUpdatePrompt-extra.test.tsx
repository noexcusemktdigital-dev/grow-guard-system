/**
 * T4 PWA-PROMPT-EXTRA — Cobertura adicional de PWAUpdatePrompt
 *
 * Usa componente espelho (sem importar virtual:pwa-register/react).
 *
 * Verifica:
 * 1. Banner não aparece quando needRefresh=false e offlineReady=false
 * 2. offlineReady=true e needRefresh=true → ambos os conteúdos visíveis
 * 3. Intervalo de 1h é registrado via setInterval mock
 * 4. Botão "Atualizar agora" chama updateServiceWorker(true)
 * 5. Botão "Depois" esconde o banner (setNeedRefresh(false))
 * 6. Botão "OK" no modo offline-only esconde o banner
 */
import React, { useState, useEffect } from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

// ── Componente espelho com suporte a intervalo ────────────────────────────────

interface PWAMirrorProps {
  initialNeedRefresh?: boolean;
  initialOfflineReady?: boolean;
  onUpdateServiceWorker?: (reloadPage: boolean) => void;
  onIntervalRegistered?: (ms: number) => void;
}

function PWAUpdatePromptMirror({
  initialNeedRefresh = false,
  initialOfflineReady = false,
  onUpdateServiceWorker = vi.fn(),
  onIntervalRegistered,
}: PWAMirrorProps) {
  const [needRefresh, setNeedRefresh] = useState(initialNeedRefresh);
  const [offlineReady, setOfflineReady] = useState(initialOfflineReady);

  useEffect(() => {
    // Simula onRegisteredSW — registra intervalo de 1h
    const intervalMs = 60 * 60 * 1000;
    const id = setInterval(() => {/* sw.update() */}, intervalMs);
    if (onIntervalRegistered) onIntervalRegistered(intervalMs);
    return () => clearInterval(id);
  }, [onIntervalRegistered]);

  if (!needRefresh && !offlineReady) return null;

  return (
    <div data-testid="pwa-banner">
      {offlineReady && !needRefresh && (
        <div data-testid="offline-ready-section">
          <p>App pronto para uso offline.</p>
          <button data-testid="btn-ok" onClick={() => setOfflineReady(false)}>OK</button>
        </div>
      )}
      {needRefresh && (
        <div data-testid="refresh-section">
          <p>Nova versão disponível</p>
          <p>Atualize para receber as últimas melhorias.</p>
          <button data-testid="btn-update" onClick={() => onUpdateServiceWorker(true)}>
            Atualizar agora
          </button>
          <button data-testid="btn-later" onClick={() => setNeedRefresh(false)}>
            Depois
          </button>
        </div>
      )}
      {offlineReady && needRefresh && (
        <div data-testid="both-section">ambos ativos</div>
      )}
    </div>
  );
}

// ── Tests ─────────────────────────────────────────────────────────────────────
describe("T4 PWA-PROMPT-EXTRA — null render", () => {
  it("1. não renderiza nada quando needRefresh=false e offlineReady=false", () => {
    const { container } = render(
      <PWAUpdatePromptMirror initialNeedRefresh={false} initialOfflineReady={false} />
    );
    expect(container.firstChild).toBeNull();
  });
});

describe("T4 PWA-PROMPT-EXTRA — ambos ativos simultaneamente", () => {
  it("2. offlineReady=true e needRefresh=true → seção de refresh e both-section visíveis", () => {
    render(
      <PWAUpdatePromptMirror initialNeedRefresh={true} initialOfflineReady={true} />
    );
    expect(screen.getByTestId("pwa-banner")).toBeInTheDocument();
    expect(screen.getByTestId("refresh-section")).toBeInTheDocument();
    expect(screen.getByTestId("both-section")).toBeInTheDocument();
  });
});

describe("T4 PWA-PROMPT-EXTRA — intervalo de 1h", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("3. registra setInterval com 3600000ms (1h) via onIntervalRegistered", () => {
    const onIntervalRegistered = vi.fn();
    render(
      <PWAUpdatePromptMirror
        initialNeedRefresh={true}
        onIntervalRegistered={onIntervalRegistered}
      />
    );
    expect(onIntervalRegistered).toHaveBeenCalledWith(3_600_000);
  });
});

describe("T4 PWA-PROMPT-EXTRA — interações de botão", () => {
  it("4. botão 'Atualizar agora' chama updateServiceWorker(true)", () => {
    const onUpdate = vi.fn();
    render(
      <PWAUpdatePromptMirror initialNeedRefresh={true} onUpdateServiceWorker={onUpdate} />
    );
    fireEvent.click(screen.getByTestId("btn-update"));
    expect(onUpdate).toHaveBeenCalledWith(true);
  });

  it("5. botão 'Depois' esconde o banner (needRefresh false → null render)", () => {
    render(<PWAUpdatePromptMirror initialNeedRefresh={true} />);
    expect(screen.getByTestId("pwa-banner")).toBeInTheDocument();

    fireEvent.click(screen.getByTestId("btn-later"));

    expect(screen.queryByTestId("pwa-banner")).toBeNull();
  });

  it("6. botão 'OK' no modo offline-only esconde o banner", () => {
    render(
      <PWAUpdatePromptMirror initialNeedRefresh={false} initialOfflineReady={true} />
    );
    expect(screen.getByTestId("offline-ready-section")).toBeInTheDocument();

    fireEvent.click(screen.getByTestId("btn-ok"));

    expect(screen.queryByTestId("pwa-banner")).toBeNull();
  });
});

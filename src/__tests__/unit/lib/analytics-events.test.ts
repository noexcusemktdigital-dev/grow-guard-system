/**
 * T-AE ANALYTICS-EVENTS — Valida constantes e tipos do taxonomy de eventos
 *
 * Verifica:
 * 1. ANALYTICS_EVENTS é um objeto com chaves esperadas de auth
 * 2. Valores são strings snake_case (verb_object)
 * 3. Evento CRM LEAD_CREATED tem valor 'lead_created'
 * 4. Evento LGPD DSR_EXPORT_REQUESTED definido
 * 5. AnalyticsEventName aceita valor válido do objeto
 * 6. Nenhuma chave duplicada no mapa (todas únicas)
 *
 * 6 asserts
 */
import { describe, it, expect } from "vitest";
import { ANALYTICS_EVENTS } from "@/lib/analytics-events";
import type { AnalyticsEventName } from "@/lib/analytics-events";

describe("ANALYTICS-EVENTS — estrutura do objeto", () => {
  it("ANALYTICS_EVENTS define eventos de auth esperados", () => {
    expect(ANALYTICS_EVENTS).toHaveProperty("SIGNUP_STARTED");
    expect(ANALYTICS_EVENTS).toHaveProperty("LOGIN_SUCCEEDED");
    expect(ANALYTICS_EVENTS).toHaveProperty("LOGOUT");
  });

  it("todos os valores são strings snake_case não-vazias", () => {
    const values = Object.values(ANALYTICS_EVENTS);
    expect(values.length).toBeGreaterThan(0);
    values.forEach((v) => {
      expect(typeof v).toBe("string");
      expect(v.length).toBeGreaterThan(0);
      // snake_case: apenas letras minúsculas, dígitos e underscores
      expect(v).toMatch(/^[a-z][a-z0-9_]*$/);
    });
  });

  it("LEAD_CREATED tem valor correto 'lead_created'", () => {
    expect(ANALYTICS_EVENTS.LEAD_CREATED).toBe("lead_created");
  });

  it("eventos LGPD DSR estão definidos", () => {
    expect(ANALYTICS_EVENTS.DSR_EXPORT_REQUESTED).toBe("dsr_export_requested");
    expect(ANALYTICS_EVENTS.DSR_DELETE_REQUESTED).toBe("dsr_delete_requested");
  });

  it("todos os valores são únicos (sem duplicatas)", () => {
    const values = Object.values(ANALYTICS_EVENTS);
    const unique = new Set(values);
    expect(unique.size).toBe(values.length);
  });
});

describe("ANALYTICS-EVENTS — tipo AnalyticsEventName", () => {
  it("variável tipada como AnalyticsEventName aceita valor do objeto", () => {
    // Teste de tipo em runtime: verifica que o valor pertence ao conjunto
    const name: AnalyticsEventName = ANALYTICS_EVENTS.PAGE_VIEWED;
    expect(name).toBe("page_viewed");
  });
});

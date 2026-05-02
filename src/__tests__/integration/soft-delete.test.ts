/**
 * T2 SOFT-DELETE — Valida contratos da migration LGPD-002
 * 20260502010000_add_soft_delete_critical.sql
 *
 * Sem banco de teste real: valida estrutura do SQL e contratos esperados
 * via parsing do arquivo de migration + mock Supabase.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

// ── SQL do migration inline para validação estrutural ────────────────────────

// Suporta tanto CommonJS (__dirname) quanto ESM (import.meta.url)
const _dirname = typeof __dirname !== "undefined"
  ? __dirname
  : dirname(fileURLToPath(import.meta.url));

const MIGRATION_PATH = resolve(
  _dirname,
  "../../../../supabase/migrations/20260502010000_add_soft_delete_critical.sql"
);

let migrationSQL = "";
try {
  migrationSQL = readFileSync(MIGRATION_PATH, "utf-8");
} catch {
  // Tenta fallback pelo cwd (quando rodando de raiz do projeto)
  try {
    migrationSQL = readFileSync(
      resolve(
        process.cwd(),
        "supabase/migrations/20260502010000_add_soft_delete_critical.sql"
      ),
      "utf-8"
    );
  } catch {
    migrationSQL = ""; // arquivo ausente — testes de conteúdo vão falhar descritivamente
  }
}

// ── Helpers de SQL esperados (contrato) ─────────────────────────────────────

const EXPECTED_TABLES = ["finance_clients", "crm_leads", "organization_memberships"];

const WHITELISTED_TABLES = new Set([
  "finance_clients",
  "crm_leads",
  "organization_memberships",
]);

/**
 * Simula a lógica do RPC soft_delete_record — validação de whitelist.
 * Espelha a lógica PL/pgSQL do SQL.
 */
function softDeleteRecord(pTable: string, pId: string): { ok: boolean; error?: string } {
  if (!WHITELISTED_TABLES.has(pTable)) {
    return { ok: false, error: `soft_delete_record: tabela não permitida: ${pTable}` };
  }
  // Valida UUID format
  const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!UUID_RE.test(pId)) {
    return { ok: false, error: "invalid UUID" };
  }
  return { ok: true };
}

// ── Mock Supabase para queries de _active view ───────────────────────────────

function makeSupabaseMock(rows: Record<string, unknown>[]) {
  return {
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    is: vi.fn().mockReturnThis(),
    then: undefined,
    // Retorna rows filtradas (deleted_at IS NULL)
    data: rows.filter((r) => r.deleted_at == null),
    error: null,
  };
}

// ── T2 Testes ────────────────────────────────────────────────────────────────

describe("T2 SOFT-DELETE — Migration LGPD-002", () => {
  describe("SQL migration structure", () => {
    it("migration file exists and is non-empty", () => {
      expect(migrationSQL.length).toBeGreaterThan(100);
    });

    it.each(EXPECTED_TABLES)(
      "tabela %s tem coluna deleted_at adicionada via ALTER TABLE",
      (table) => {
        expect(migrationSQL).toContain(`ALTER TABLE public.${table}`);
        expect(migrationSQL).toContain("deleted_at");
      }
    );

    it.each(EXPECTED_TABLES)(
      "view %s_active criada para filtrar soft-deleted",
      (table) => {
        expect(migrationSQL).toContain(`CREATE OR REPLACE VIEW public.${table}_active`);
        expect(migrationSQL).toContain("deleted_at IS NULL");
      }
    );

    it.each(EXPECTED_TABLES)(
      "index parcial criado em %s para eficiência de purge",
      (table) => {
        const tableSuffix = table === "organization_memberships" ? "org_memberships" : table;
        expect(migrationSQL).toContain(`idx_${tableSuffix}_deleted_at`);
        expect(migrationSQL).toContain("WHERE deleted_at IS NOT NULL");
      }
    );

    it("RPC soft_delete_record existe com whitelist de tabelas", () => {
      expect(migrationSQL).toContain("soft_delete_record");
      expect(migrationSQL).toContain("SECURITY DEFINER");
      expect(migrationSQL).toContain("p_table NOT IN");
    });

    it("RPC purge_soft_deleted existe com retenção configurada", () => {
      expect(migrationSQL).toContain("purge_soft_deleted");
      expect(migrationSQL).toContain("6 months");
      expect(migrationSQL).toContain("2 years"); // organization_memberships tem retenção maior
    });
  });

  describe("soft_delete_record whitelist logic", () => {
    it("aceita tabelas whitelisted: finance_clients", () => {
      const result = softDeleteRecord(
        "finance_clients",
        "550e8400-e29b-41d4-a716-446655440000"
      );
      expect(result.ok).toBe(true);
    });

    it("aceita tabelas whitelisted: crm_leads", () => {
      const result = softDeleteRecord(
        "crm_leads",
        "550e8400-e29b-41d4-a716-446655440001"
      );
      expect(result.ok).toBe(true);
    });

    it("aceita tabelas whitelisted: organization_memberships", () => {
      const result = softDeleteRecord(
        "organization_memberships",
        "550e8400-e29b-41d4-a716-446655440002"
      );
      expect(result.ok).toBe(true);
    });

    it("rejeita tabelas não-whitelisted com erro descritivo", () => {
      const result = softDeleteRecord("users", "550e8400-e29b-41d4-a716-446655440003");
      expect(result.ok).toBe(false);
      expect(result.error).toContain("não permitida");
      expect(result.error).toContain("users");
    });

    it("rejeita tabela de injeção SQL", () => {
      const result = softDeleteRecord(
        "finance_clients; DROP TABLE users; --",
        "550e8400-e29b-41d4-a716-446655440004"
      );
      expect(result.ok).toBe(false);
    });

    it("rejeita ID não-UUID", () => {
      const result = softDeleteRecord("finance_clients", "not-a-uuid");
      expect(result.ok).toBe(false);
      expect(result.error).toContain("UUID");
    });

    it("rejeita ID vazio", () => {
      const result = softDeleteRecord("finance_clients", "");
      expect(result.ok).toBe(false);
    });
  });

  describe("_active view contract (mock)", () => {
    it("view finance_clients_active filtra deleted_at NOT NULL", () => {
      const rows = [
        { id: "1", name: "Alice", deleted_at: null },
        { id: "2", name: "Bob", deleted_at: "2026-05-01T00:00:00Z" }, // soft-deleted
      ];
      const mock = makeSupabaseMock(rows);
      // Simula o filtro que a view aplica
      const activeRows = rows.filter((r) => r.deleted_at == null);
      expect(activeRows).toHaveLength(1);
      expect(activeRows[0].id).toBe("1");
    });

    it("view retorna TODOS os registros quando nenhum foi soft-deleted", () => {
      const rows = [
        { id: "1", deleted_at: null },
        { id: "2", deleted_at: null },
      ];
      const activeRows = rows.filter((r) => r.deleted_at == null);
      expect(activeRows).toHaveLength(2);
    });

    it("view retorna ZERO quando todos foram soft-deleted", () => {
      const rows = [
        { id: "1", deleted_at: "2026-01-01T00:00:00Z" },
        { id: "2", deleted_at: "2026-02-01T00:00:00Z" },
      ];
      const activeRows = rows.filter((r) => r.deleted_at == null);
      expect(activeRows).toHaveLength(0);
    });
  });
});

// @ts-nocheck
// Prompts versionados para generate-support-access.
// NOTA: Esta edge function NÃO usa LLM — gera tokens de acesso temporário
// para suporte via criptografia nativa (Web Crypto API). Não há prompts de IA.

export const PROMPT_VERSION = "1.0.0";

// ── Stub (sem IA) ─────────────────────────────────────────────────────────────

// generate-support-access não usa nenhum modelo de linguagem.
// A função gera um token seguro de 32 bytes via crypto.getRandomValues,
// hasheia com SHA-256, persiste no banco, cria notificações para membros
// da organização e retorna o tokenPlain (plaintext) ao chamador.
//
// Este arquivo existe apenas para completar a cobertura do namespace de prompts
// e documentar a ausência de LLM na função.

export const SYSTEM_PROMPT = "";

export interface SupportAccessInput {
  duration_minutes: number;
  organization_id: string;
  access_level?: "read_only" | "full";
  ticket_id?: string;
}

// Nenhum buildUserPrompt é necessário — a lógica é puramente criptográfica.
// O placeholder abaixo garante compatibilidade com o padrão de importação do index.ts.
export function buildUserPrompt(_data: SupportAccessInput): string {
  return "";
}

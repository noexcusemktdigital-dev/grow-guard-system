# Prompts — Versionados em Git

Centraliza prompts inline das edge functions `generate-*` para auditoria, A/B testing e evals.

## Por que

- **Versionamento**: `git log` mostra evolução do prompt
- **Auditoria**: revisão de mudança de prompt em PR
- **Evals**: import direto em `evals/tests/`
- **A/B testing**: trocar prompt sem deploy de fn

## Padrão

Cada arquivo exporta:
- `SYSTEM_PROMPT: string` — instruções fixas (versão maior == bump quando mudar comportamento)
- `buildUserPrompt(input): string` — template com interpolação segura
- `PROMPT_VERSION: string` — semver, log junto com cada call

## Versão e A/B

Nova versão de prompt:
1. Cria `generate-X-v2.ts` com novos exports
2. Edge fn lê variant via env var `PROMPT_VARIANT_GENERATE_X=v2` ou A/B feature flag
3. Default: v1
4. Após validação (eval green, métricas OK): substitui import principal

## Sanitização de input

Templates DEVEM sanitizar input antes de interpolar:
- escape de markdown (` ``` `)
- truncate ao limite do contexto
- redact PII (CPF/email/phone) — usa `_shared/redact.ts`

Exemplo de safe interpolation: ver `generate-prospection.ts`.

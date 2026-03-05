

# Plano: Correções do Módulo de Vendas (Scripts & Plano de Vendas)

Não encontrei o plano exato que você mencionou na conversa atual, mas com base nas fases descritas (Fase 1: persistir histórico, Fase 2: créditos, Fase 3: dialog de créditos insuficientes) e na análise do código, identifiquei as lacunas no módulo de vendas:

## Estado Atual

- **generate-script**: Já tem pre-check de créditos e debit no edge function
- **ClienteScripts.tsx**: **NÃO** tem `InsufficientCreditsDialog` nem tratamento de erro `INSUFFICIENT_CREDITS`
- **ScriptGeneratorDialog.tsx**: Chama `generate-script` mas não passa `organization_id` (line ~54-67), então o pre-check é pulado
- **handleImproveWithAI**: Também não passa `organization_id`, mesmo problema

## Fase 1 — Persistir Histórico de Geração

O `ScriptGeneratorDialog` gera o script via edge function e salva via `onSave` callback, mas o `handleImproveWithAI` em `ClienteScripts.tsx` atualiza in-place sem registrar que foi uma melhoria IA. Não há histórico de versões.

**Correção**: Não requer migration — o script já é salvo/atualizado no DB. O problema é que `organization_id` não é passado ao edge function, então créditos não são verificados. Corrigir isso é a prioridade.

## Fase 2 — Integrar Créditos Corretamente

**Arquivo: `src/components/cliente/ScriptGeneratorDialog.tsx`**
- Importar `useUserOrgId` e obter `orgId`
- Passar `organization_id: orgId` no body da chamada `supabase.functions.invoke("generate-script")`
- Assim o edge function consegue fazer o pre-check e o debit de 150 créditos

**Arquivo: `src/pages/cliente/ClienteScripts.tsx`**
- Importar `useUserOrgId` e obter `orgId`
- No `handleImproveWithAI`, adicionar `organization_id: orgId` ao body
- Tratar erro `INSUFFICIENT_CREDITS` com state + dialog

## Fase 3 — Dialog de Créditos Insuficientes

**Arquivo: `src/pages/cliente/ClienteScripts.tsx`**
- Importar `InsufficientCreditsDialog` e `isInsufficientCreditsError`
- Adicionar state `showCreditsDialog`
- No `handleImproveWithAI` catch, verificar `isInsufficientCreditsError(err)` e abrir dialog
- Renderizar `<InsufficientCreditsDialog>` no JSX

**Arquivo: `src/components/cliente/ScriptGeneratorDialog.tsx`**
- No catch da geração, verificar `isInsufficientCreditsError` e propagar o erro ao pai (ou mostrar dialog interno)
- Alternativa: adicionar o dialog diretamente no `ScriptGeneratorDialog`

## Arquivos a Modificar

| Arquivo | Ação |
|---|---|
| `src/components/cliente/ScriptGeneratorDialog.tsx` | Passar `organization_id` ao edge function + dialog de créditos |
| `src/pages/cliente/ClienteScripts.tsx` | Passar `organization_id` no improve + `InsufficientCreditsDialog` |

Nenhuma migration necessária. O edge function `generate-script` já tem toda a lógica de créditos — o problema é apenas que o frontend não envia o `organization_id`.


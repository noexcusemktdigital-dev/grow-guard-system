

## Correção do erro "Failed to send a request to the Edge Function" + Melhoria visual dos Scripts

### Problema identificado

O arquivo `supabase/functions/_shared/cors.ts` tem uma lista fixa de origens permitidas que **não inclui a URL de preview** do Lovable (`https://id-preview--1d5802a2-4462-4bb6-a30e-a9b2d444f68e.lovable.app`). Além disso, faltam headers obrigatórios do SDK Supabase (`x-supabase-client-platform`, `x-supabase-client-platform-version`, `x-supabase-client-runtime`, `x-supabase-client-runtime-version`).

Quando o browser faz o preflight (OPTIONS), o CORS falha e a requisição é bloqueada antes mesmo de chegar ao servidor.

### Plano

**1. Corrigir CORS (`supabase/functions/_shared/cors.ts`)**
- Aceitar qualquer origem `*.lovable.app` via verificação dinâmica (regex)
- Adicionar os headers Supabase obrigatórios ao `Access-Control-Allow-Headers`
- Manter as origens de localhost para desenvolvimento

**2. Re-deploy de todas as edge functions que usam `_shared/cors.ts`**
- `generate-script`, `invite-user`, `auth-email-hook`, `send-transactional-email`, `evolution-webhook`, `crm-run-automations`, e demais que importam `getCorsHeaders`

**3. Melhorar a visualização dos scripts gerados (`src/pages/cliente/ClienteScripts.tsx`)**
- Substituir o bloco `whitespace-pre-wrap font-mono` por um renderizador que interpreta a formatação do script:
  - Títulos de seção (linhas em CAPS ou com `#`, `---`) renderizados como headers visuais com cor do estágio
  - Marcadores `[PAUSA]`, `[ANOTAR]`, `[DECISÃO]`, `[EXEMPLO]` renderizados como badges coloridas inline
  - Listas numeradas com indentação visual
  - Blocos de fala/diálogo com fundo diferenciado e aspas
  - Separadores visuais entre seções
- Criar um componente `ScriptContentRenderer` que faz o parsing e renderização rica
- Manter o modo edição como textarea simples (raw text)

### Arquivos afetados

| Arquivo | Mudança |
|---------|---------|
| `supabase/functions/_shared/cors.ts` | CORS dinâmico + headers completos |
| `src/components/cliente/ScriptContentRenderer.tsx` | Novo — renderização visual rica do conteúdo |
| `src/pages/cliente/ClienteScripts.tsx` | Usar `ScriptContentRenderer` no lugar do bloco `pre-wrap` |


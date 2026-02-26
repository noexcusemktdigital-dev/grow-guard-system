

## Gating de Estratégia + Referências por Arquivo + Geração de Vídeo

### Visão Geral

Três mudanças principais:
1. **Estratégia de Marketing como pré-requisito** — Conteúdos e Redes Sociais ficam bloqueados até a estratégia ser completada (mesma mecânica do Plano de Vendas)
2. **Referências visuais por arquivo** — Aceitar uploads de arquivos (não só imagens) como referências no briefing
3. **Geração de vídeos curtos** — Novo tipo de criação para Reels/Stories em vídeo

---

### 1. Gating: Estratégia obrigatória para Conteúdos e Redes Sociais

**Arquivo**: `src/contexts/FeatureGateContext.tsx`

- Adicionar novo `GateReason`: `"no_marketing_strategy"`
- Criar lista `MARKETING_STRATEGY_REQUIRED` com `/cliente/conteudos` e `/cliente/redes-sociais`
- Verificar se existe estratégia ativa no banco (usar `useActiveStrategy` ou verificar via localStorage/query)
- Adicionar lógica no `getGateReason` para checar essa condição

**Arquivo**: `src/components/FeatureGateOverlay.tsx`

- Adicionar configuração visual para `no_marketing_strategy`:
  - Ícone: `Megaphone`
  - Título: "Complete a Estratégia de Marketing"
  - Descrição: "Para desbloquear esta funcionalidade, complete primeiro sua Estratégia de Marketing."
  - CTA: "Criar Estratégia" → navega para `/cliente/plano-marketing`

**Arquivo**: `src/hooks/useMarketingStrategy.ts`

- Exportar um hook simples `useHasActiveStrategy()` que retorna `boolean` para uso no contexto de gating (evita carregar dados completos)

---

### 2. Referências visuais: aceitar arquivos além de imagens

**Arquivo**: `src/pages/cliente/ClienteRedesSociais.tsx`

Alterações no briefing (seção "Referências Visuais"):
- Mudar o `accept` do input de `image/*` para `image/*,.pdf,.ai,.psd,.svg,.fig` — aceitar arquivos de design como referência
- Adicionar label explicando que PDFs e arquivos de design podem ser enviados como referência de estilo
- Manter o upload para o bucket `social-arts/references/{orgId}/`
- Para arquivos não-imagem, exibir ícone de arquivo em vez de thumbnail
- Atualizar o tipo `bReferenceImages` para incluir `fileName` e `mimeType`

Não há mudança no backend — os arquivos de referência são enviados como URLs públicas para a IA, que já aceita URLs de qualquer tipo de imagem.

---

### 3. Geração de Vídeos para Redes Sociais

Atualmente só existem artes estáticas (Feed e Story). Adicionar geração de vídeos curtos usando o modelo Veo do Lovable AI Gateway.

**Nota importante**: O Lovable AI Gateway atualmente não suporta modelos de geração de vídeo nativamente. A abordagem será:
- Gerar **roteiro de vídeo detalhado** (storyboard frame-by-frame) via IA
- Gerar **thumbnail/capa do vídeo** como imagem estática
- Fornecer o roteiro completo com timecodes para o cliente gravar/editar

**Arquivo**: `src/pages/cliente/ClienteRedesSociais.tsx`

Alterações:
- Adicionar novo formato no briefing: `"video"` além de "feed" e "story"
- Checkbox "Gerar roteiro de vídeo" no wizard
- Quando ativado, a IA gera além das artes:
  - Roteiro com timecodes (0-3s gancho, 3-15s contexto, etc.)
  - Descrição visual frame-by-frame
  - Sugestão de áudio/música
  - Thumbnail/capa do vídeo (imagem gerada)
- Na visualização da arte, adicionar aba "Vídeo" que mostra o roteiro completo

**Arquivo**: `supabase/functions/generate-social-concepts/index.ts`

Alterações:
- Receber `incluir_video: boolean` no body
- Quando ativo, adicionar ao tool schema:
  - `video_script`: roteiro completo com timecodes
  - `video_description`: descrição visual frame-by-frame
  - `audio_suggestion`: sugestão de trilha/áudio
  - `visual_prompt_thumbnail`: prompt para gerar thumbnail do vídeo
- Atualizar system prompt para gerar roteiros de vídeo quando solicitado

**Arquivo**: `supabase/functions/generate-social-image/index.ts`

- Sem alterações — thumbnail é gerada com o mesmo fluxo de imagem

---

### Resumo de Arquivos

| Arquivo | Ação | Descrição |
|---------|------|-----------|
| `src/contexts/FeatureGateContext.tsx` | Editar | Adicionar gate `no_marketing_strategy` para Conteúdos e Redes Sociais |
| `src/components/FeatureGateOverlay.tsx` | Editar | Adicionar config visual do gate de estratégia |
| `src/hooks/useMarketingStrategy.ts` | Editar | Adicionar `useHasActiveStrategy()` para o gating |
| `src/pages/cliente/ClienteRedesSociais.tsx` | Editar | Aceitar arquivos de design como referência + checkbox de vídeo + exibição de roteiro |
| `supabase/functions/generate-social-concepts/index.ts` | Editar | Gerar roteiros de vídeo quando solicitado |

### Ordem de Implementação

1. Hook `useHasActiveStrategy` + FeatureGateContext + Overlay
2. Referências por arquivo no briefing
3. Geração de roteiros de vídeo (conceitos + UI)


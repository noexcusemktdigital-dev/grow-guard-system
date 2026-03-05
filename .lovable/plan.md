

# Recriação da Ferramenta de Postagens para Redes Sociais

## Situação Atual

`ClienteRedesSociais.tsx` (1940 linhas) é um monólito com calendário, chat Theo, geração de campanhas em lote, canvas editor, e vídeo frames — tudo misturado. `ClienteRedesSociaisCriar.tsx` (531 linhas) é um wizard separado com templates. Existem duas edge functions: `generate-social-image` (Nano Banana Pro, funcional) e `generate-social-video-frames` (gera frames estáticos, não vídeos reais).

O Documento 4 pede algo diferente: uma ferramenta focada que **importa conteúdos da Ferramenta de Conteúdo** e os transforma em artes ou vídeos, com fluxo por etapas.

## Plano de Implementação

### 1. Criar tabela `client_posts`

Nova tabela para armazenar postagens geradas (artes e vídeos), separada de `client_content`.

```sql
CREATE TABLE client_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES organizations(id) NOT NULL,
  content_id uuid REFERENCES client_content(id),
  type text NOT NULL DEFAULT 'art', -- 'art' or 'video'
  format text, -- 'feed', 'portrait', 'story'
  style text,
  duration text, -- for video: '15s', '30s', '60s'
  input_text text,
  reference_image_urls text[],
  result_url text,
  result_data jsonb,
  status text DEFAULT 'pending',
  created_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE client_posts ENABLE ROW LEVEL SECURITY;
-- RLS: org members can CRUD
```

### 2. Reescrever `ClienteRedesSociais.tsx` (completamente)

Nova interface por etapas:

**Tela principal**: Lista de postagens geradas (histórico) + botão "Nova Postagem"

**Etapa 1 — Conteúdo Base**: 
- Listar conteúdos aprovados da Ferramenta de Conteúdo (`useContentHistory`)
- Cada card mostra título, formato, preview do texto
- Opção "Criar sem conteúdo base" para texto manual

**Etapa 2 — Tipo de Material**:
- Arte (imagem) ou Vídeo
- Cards visuais de seleção

**Etapa 3 — Configuração** (depende do tipo):

*Se Arte:*
- Formato: Feed 1:1, Portrait 4:5, Story 9:16
- Referências visuais: upload de 3+ imagens (usando `social-arts` bucket)
- Identidade visual: auto-preenchida via `useVisualIdentity`, editável
- Texto da arte: importado do conteúdo ou manual

*Se Vídeo:*
- Roteiro: importado do conteúdo (se tipo roteiro) ou manual
- Duração: 15s, 30s, 60s
- Estilo: educativo, institucional, promocional, storytelling
- Referências visuais (opcional)

**Etapa 4 — Gerar**: Botão de geração, loading com frases, resultado

**Tela de resultado**:
- Visualização da arte/vídeo
- Botões: Aprovar, Regenerar, Baixar
- Aprovação consome crédito (1 arte = 100 créditos, 1 vídeo = 200 créditos)

### 3. Atualizar `generate-social-image` Edge Function

Manter a lógica atual (Nano Banana Pro) mas:
- Remover débito automático de créditos (agora feito na aprovação)
- Aceitar `content_text` e `strategy_data` no body para enriquecer o prompt automaticamente

### 4. Atualizar `generate-social-video-frames` Edge Function

Renomear/reescrever para `generate-social-video`:
- Usar Gemini para gerar roteiro de motion graphics + frames
- Remover débito automático (agora na aprovação)
- Aceitar roteiro estruturado do conteúdo

### 5. Criar hook `useClientePosts.ts`

- `usePostHistory()` — lista postagens geradas
- `useGeneratePost()` — chama edge function (arte ou vídeo)
- `useApprovePost()` — debita créditos e atualiza status

### 6. Remover `ClienteRedesSociaisCriar.tsx`

O fluxo de criação será integrado na página principal. Remover rota `/redes-sociais/criar`.

### 7. Limpar `briefingAgents.ts`

Remover `THEO_STEPS` (o chat Theo não será mais usado).

## Arquivos

| Arquivo | Ação |
|---------|------|
| `supabase/migrations/` | Nova migration: tabela `client_posts` + RLS |
| `src/pages/cliente/ClienteRedesSociais.tsx` | Reescrever completamente |
| `src/pages/cliente/ClienteRedesSociaisCriar.tsx` | Remover |
| `src/hooks/useClientePosts.ts` | Criar novo hook |
| `supabase/functions/generate-social-image/index.ts` | Remover débito automático |
| `supabase/functions/generate-social-video-frames/index.ts` | Ajustar para novo fluxo |
| `src/components/cliente/briefingAgents.ts` | Remover `THEO_STEPS` |
| `src/App.tsx` | Remover rota `/redes-sociais/criar` |


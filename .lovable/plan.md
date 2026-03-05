

# Reestruturação da Ferramenta de Redes Sociais (Postagens)

## Problema Central

O wizard atual tem 9 campos abertos em texto livre para artes e campos genéricos para vídeos. O cliente preenche mal, o prompt fica fraco, e a IA gera resultados inconsistentes. O usuário quer um briefing estruturado com blocos objetivos + assistência da IA para montar o prompt final.

## Plano de Implementação

### 1. Wizard de Arte — 7 Blocos Estruturados (`ClienteRedesSociais.tsx`)

Substituir os 9 campos abertos por 7 blocos claros:

| Bloco | Campo | Tipo |
|---|---|---|
| 1 — Formato | 1:1, 4:5, 9:16 | Cards selecionáveis |
| 2 — Tipo de postagem | Post único, Capa carrossel, Slide carrossel, Story | Cards selecionáveis |
| 3 — Texto da arte | Headline (obrigatório), Subheadline (opcional), CTA (opcional) | Inputs estruturados |
| 4 — Cena | Descrição da cena (textarea com exemplos inline) | Textarea com placeholders ricos |
| 5 — Identidade visual | Auto-preenchido se existe. Senão: cores + estilo | Auto-detect + fallback manual |
| 6 — Elementos visuais | Objetos/elementos específicos (notebook, prédio, etc.) | Input com sugestões |
| 7 — Referências visuais | Upload mínimo 3 imagens | Upload com validação |

Remover: campos "link da marca", "objetivo", "tema", "ambiente" como campos separados. O campo "cena" absorve contexto suficiente.

### 2. Wizard de Vídeo — 6 Blocos (`ClienteRedesSociais.tsx`)

| Bloco | Campo | Tipo |
|---|---|---|
| 1 — Formato/Plataforma | Reels/TikTok (9:16), Feed (1:1), YouTube (16:9) | Cards |
| 2 — Duração | 5 segundos, 8 segundos | Cards (simplificado) |
| 3 — Cena | Descrição do que acontece | Textarea com exemplos |
| 4 — Movimento | O que acontece na cena (ação) | Input com sugestões |
| 5 — Texto/Mensagem | Frase + CTA opcional | Inputs estruturados |
| 6 — Referências | Upload opcional | Upload |

### 3. Assistente IA para prompt (`generate-social-image/index.ts`)

O chain-of-thought já existe no edge function. A melhoria é alimentá-lo com os dados estruturados dos novos blocos em vez de texto livre concatenado. O `analyzeAndOptimizePrompt` receberá campos nomeados (headline, cena, elementos, tipo_postagem) em vez de um blob de texto.

Atualizar o payload enviado pelo hook para passar campos estruturados:
```
{
  formato: "4:5",
  tipo_postagem: "post_unico",
  headline: "Escalar não é sorte",
  subheadline: "É processo",
  cta: "Conheça o método",
  cena: "Empresário analisando dashboard de vendas",
  elementos_visuais: "notebook com gráfico subindo",
  reference_image_urls: [...],
  identidade_visual: { ... }
}
```

### 4. Atualizar Edge Functions

**`generate-social-image/index.ts`**: Receber os novos campos estruturados e montar o prompt de forma mais precisa (campo por campo) em vez de concatenar texto livre.

**`generate-social-video-frames/index.ts`**: Receber cena + movimento + mensagem como campos separados para prompts de frame mais precisos.

### 5. Hook `useClientePosts.ts`

Expandir o payload do `useGeneratePost` para aceitar os novos campos estruturados (tipo_postagem, headline, subheadline, cta, cena, elementos_visuais, movimento).

## Arquivos Modificados

| Arquivo | Mudança |
|---|---|
| `src/pages/cliente/ClienteRedesSociais.tsx` | Wizard reestruturado: 7 blocos arte, 6 blocos vídeo, validação de 3 refs |
| `src/hooks/useClientePosts.ts` | Payload expandido com campos estruturados |
| `supabase/functions/generate-social-image/index.ts` | Receber campos estruturados, prompt mais preciso |
| `supabase/functions/generate-social-video-frames/index.ts` | Campos cena + movimento separados |


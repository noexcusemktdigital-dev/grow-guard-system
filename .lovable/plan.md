

# Correção da Ferramenta de Conteúdo — Geração em Lote Estratégico

## Problema

A ferramenta atual gera 1 conteúdo por vez com formato e objetivo únicos. O correto é gerar um **lote completo** de conteúdos estratégicos, respeitando o limite do plano e cobrindo o funil de marketing.

## Plano

### 1. Reescrever `ClienteConteudos.tsx` — Wizard de lote com 8 blocos

Substituir o wizard atual (5 steps, 1 conteúdo) por:

| Bloco | Input |
|---|---|
| **1. Quantidade** | Auto-detectar do plano (`maxContents`). Mostrar "Seu plano permite X conteúdos" com slider para escolher quantos gerar |
| **2. Formatos** | Multi-select com distribuição: carrossel (N), vídeo (N), post único (N), story (N), artigo (N), post educativo (N), post autoridade (N). Total deve = quantidade escolhida |
| **3. Objetivos** | Multi-select: educar, autoridade, engajamento, leads, vender, quebrar objeções. IA distribui automaticamente (40% educação, 30% autoridade, 20% prova social, 10% oferta) |
| **4. Tema** | Textarea opcional. Se vazio, IA usa estratégia |
| **5. Plataforma** | Select: Instagram, LinkedIn, TikTok, YouTube |
| **6. Tom** | Select opcional: educativo, institucional, direto, provocativo |
| **7. Público** | Auto-preenchido da estratégia, editável |
| **8. Revisão** | Resumo visual do lote antes de gerar |

**Tela de resultado**: Grid de cards, cada card = 1 conteúdo com:
- Badge formato + objetivo
- Título + preview do conteúdo
- Botões: Editar, Gerar Arte (→ `/cliente/redes-sociais`), Gerar Vídeo, Copiar, Aprovar

### 2. Reescrever `generate-content` Edge Function — Gerar array de conteúdos

- Aceitar novo payload: `{ quantidade, formatos: [{tipo, qtd}], objetivos: [string], tema?, plataforma, tom?, publico?, estrategia }`
- IA gera array de N conteúdos, cada um com formato e objetivo distribuídos
- Tool schema retorna `{ conteudos: Array<{ titulo, formato, objetivo, conteudo_principal, legenda, headlines, hashtags, embasamento }> }`

### 3. Atualizar `useClienteContentV2.ts`

- `useGenerateContent` — aceitar novo payload, inserir N registros no `client_content` (um por conteúdo gerado)
- `useApproveContent` — aprovar conteúdo individual (200 créditos cada) ou aprovar lote
- Adicionar `useContentQuota` — consultar subscription + contar conteúdos do mês atual vs `maxContents`

### 4. Integração com plano

- Importar `useClienteSubscription` + `getPlanBySlug` para determinar `maxContents`
- Contar conteúdos já gerados no mês atual via query no `client_content`
- Bloquear geração se limite atingido, sugerir upgrade

## Arquivos

| Arquivo | Ação |
|---|---|
| `src/pages/cliente/ClienteConteudos.tsx` | Reescrever — wizard de lote com 8 blocos + grid de resultado |
| `supabase/functions/generate-content/index.ts` | Reescrever — gerar array de N conteúdos |
| `src/hooks/useClienteContentV2.ts` | Atualizar — insert em lote, quota check |


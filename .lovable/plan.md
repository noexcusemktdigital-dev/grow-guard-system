

# Melhoria de qualidade das artes (sem trocar de gateway)

## Análise do prompt — pontos por item

**Item 1 — Trocar modelo final para Gemini 3.1 Flash Image Preview com fallback para 3 Pro: ✅ FAZ SENTIDO, com ressalva**

- Ambos os modelos são suportados pelo gateway Lovable
- 3.1 Flash (Nano Banana 2) é mais rápido e mais barato, com qualidade pro-level segundo a documentação
- ⚠️ Ressalva: 3 Pro Image historicamente é mais consistente em renderização tipográfica complexa. Vamos implementar como **opt-in com fallback** para evitar regressão silenciosa em artes complexas
- O Stage 3 (composição de logo) **já usa** `gemini-3.1-flash-image-preview` — então só o Stage 2 (geração principal) muda

**Item 2 — Regras de renderização de texto no prompt: ✅ FAZ SENTIDO**

- É uma das alavancas mais eficazes de qualidade
- ⚠️ Já existe no projeto a memória `post-generation-quality-rules` com Text Density Rule (máx 3 blocos, 40 palavras, sem sombras/glows). Vou **mesclar** as regras novas com as existentes, sem duplicar nem entrar em conflito (ex: a regra existente diz "no shadows", a nova fala em hierarquia tipográfica — combinam bem)
- Vou injetar no `fullPrompt` em **todos os caminhos** (CoT otimizado e fallback), não só "no final"

**Item 3 — Adicionar carrossel/apresentação: ⚠️ PARCIALMENTE REDUNDANTE**

- **Carrossel já existe** em `POST_TYPES` (`src/components/cliente/social/constants.ts`) com até 10 slides, geração sequencial em `ClienteRedesSociais.tsx`, e capa/conteúdo/CTA classificados automaticamente
- O que **falta** vs o pedido:
  - Campo de "Título da série"
  - Campo de "Tópico de cada slide" (input dinâmico por slide)
  - Botão "Baixar todos" (atualmente cada arte tem download individual em `PostResult.tsx`)
- Vou **estender o que já existe** em vez de criar um tipo novo paralelo

---

## O que será feito

### 1. Edge function `generate-social-image` (Stage 2 — geração principal)

**Arquivo:** `supabase/functions/generate-social-image/index.ts` (linhas ~1106-1133)

- Trocar modelo principal para `google/gemini-3.1-flash-image-preview`
- Em caso de falha (status não-OK ou ausência de imagem na resposta) e não sendo erro de rate-limit/credits (429/402), refazer a chamada com `google/gemini-3-pro-image-preview` como fallback
- Logar qual modelo gerou cada arte para acompanhamento
- Erros 429/402 continuam propagando como antes (não usar fallback nesses casos — não resolve)

### 2. Regras de renderização de texto no prompt

**Arquivo:** `supabase/functions/generate-social-image/index.ts` (após o bloco de objective/audience/photo, antes do `console.log` da linha 1093)

Adicionar bloco final único `CRITICAL TEXT RENDERING RULES` que combina:
- Regras pedidas: nitidez, contraste, hierarquia (60/36/24px), evitar áreas ocupadas, alinhamento centro/esquerda, máx 3 linhas, padding 40px
- Regras já existentes preservadas: máx 3 blocos de texto / 40 palavras totais, sem sombras/glows/blur (Stage 3)

Aplicado tanto no caminho otimizado (CoT) quanto no fallback, garantindo que sempre apareça.

### 3. Carrossel — UI completa em vez de novo tipo

**Arquivos:**
- `src/components/cliente/social/ArtWizardSteps.tsx` (passo de tipo + slides)
- `src/components/cliente/social/ArtWizard.tsx` (estado + payload)
- `src/pages/cliente/ClienteRedesSociais.tsx` (envio do tópico por slide)
- `src/components/cliente/social/PostResult.tsx` (botão "Baixar todos")

Mudanças:
- Quando `tipoPostagem === "carrossel"`:
  - Adicionar input "Título da série" (já exibido logo após o seletor de número de slides)
  - Renderizar N inputs dinâmicos "Tópico do slide 1", "Tópico do slide 2"... conforme `carouselSlides`
  - Persistir `seriesTitle: string` e `slideTopics: string[]` no estado do wizard
- Em `ClienteRedesSociais.tsx` ao gerar cada slide do carrossel: incluir `series_title` e o `slide_topic` correspondente no `briefing` enviado para `generate-social-image`, melhorando a coerência da série
- Em `PostResult.tsx`: quando `allResults.length > 1`, adicionar botão "📥 Baixar todos" que abre cada `result_url` em nova aba (com pequeno delay sequencial de ~150ms para evitar bloqueio do navegador)

### 4. Não fazer

- ❌ Não criar tipo "📊 Carrossel / Apresentação" separado (já existe como "📚 Carrossel")
- ❌ Não tocar em `generate-social-video-frames` (escopo é arte estática)
- ❌ Não mexer no Stage 3 (composição de logo já está no 3.1 Flash)

## Detalhes técnicos

**Estratégia de fallback (Stage 2):**
```
1. POST gateway com model=gemini-3.1-flash-image-preview
2. Se 429/402 → retornar erro ao cliente (não tentar fallback)
3. Se outro erro OU resposta sem imagem → POST com model=gemini-3-pro-image-preview
4. Se também falhar → erro 500 como hoje
```

**Locais exatos a editar:**
- `supabase/functions/generate-social-image/index.ts:1106-1141` (Stage 2 + extração de imagem → envolver em helper `generateWithFallback`)
- `supabase/functions/generate-social-image/index.ts:~1090` (injeção do bloco CRITICAL TEXT RENDERING RULES)
- `src/components/cliente/social/ArtWizard.tsx:~145` (novos estados `seriesTitle`, `slideTopics`)
- `src/components/cliente/social/ArtWizardSteps.tsx:~236-256` (UI dos novos campos no bloco existente de carrossel)
- `src/pages/cliente/ClienteRedesSociais.tsx:~157-200` (passar topic + series_title para cada chamada do loop)
- `src/components/cliente/social/PostResult.tsx` (botão "Baixar todos")

**Memória a atualizar após implementação:**
- `mem://features/cliente-final/marketing/post-generation-quality-rules`: registrar troca de modelo padrão e nova regra de hierarquia tipográfica
- `mem://features/cliente-final/marketing/social-content-engine`: registrar campos de série/tópico no carrossel


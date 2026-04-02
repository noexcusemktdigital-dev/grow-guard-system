

## Plano — Refatoração completa da ferramenta de Postagem: Motor de Direção de Arte Controlada

### Visão geral

Transformar a ferramenta de geração de artes de um "gerador de imagem livre" para um **motor de direção de arte controlada**, onde o usuário responde perguntas simples e o sistema converte em prompts técnicos altamente estruturados. A mudança é grande mas pode ser feita de forma incremental reaproveitando a estrutura existente.

### O que já existe e será reaproveitado

- Estrutura de wizard em 8 steps (será reorganizado para ~10 steps)
- Edge function `generate-social-image` com pipeline CoT → geração → logo composition
- Upload de referências, logo e fotos via storage
- Sistema de créditos e débito
- Constants com formatos, layouts e objetivos
- LayoutPicker com mockups SVG

### O que muda fundamentalmente

1. **Novo fluxo de steps** — reordenado conforme a especificação (tipo material → formato → tipo/quantidade → objetivo → tema/assunto → texto AI vs manual → público → layout visual → referências → logo → imagens → restrições → revisão)
2. **Layout picker com 6 opções simplificadas** — hero_center, split, overlay, card, minimal, grid (em vez das 9 atuais)
3. **Modo de texto AI vs Manual** — novo bloco onde o usuário escolhe se quer que a IA crie os textos ou se vai escrever manualmente
4. **Público-alvo como campo dedicado** — novo input
5. **Restrições negativas** — novo campo "O que não quer na arte"
6. **Engine de prompt completamente nova** — template estruturado com grid maps, regras de logo, identidade visual, formato, e restrições negativas
7. **Verificação automática pós-geração** — IA avalia se layout, logo, hierarquia e branding foram respeitados, com fallback em até 3 níveis
8. **Análise de referências por IA** — extração automática de paleta, tipografia, estilo de composição das referências enviadas

### Estrutura dos novos steps (14 etapas no wizard)

| Step | Pergunta para o usuário | Campo interno |
|------|------------------------|---------------|
| 1 | Onde será usada? (Digital/Impressa) | `material_type` |
| 2 | Qual formato? (1:1, 4:5, 9:16, carrossel / A4, A5, flyer...) | `digital_format` ou `print_format` |
| 3 | Tipo e quantidade (post único, carrossel, story + slides) | `slides_count`, `quantity` |
| 4 | O que quer gerar? (Vendas, Leads, Engajamento...) | `objective` |
| 5 | Sobre o que é? (tema livre) | `topic` |
| 6 | Texto: IA cria ou manual? | `text_mode` + campos de texto |
| 7 | Para quem é? (público-alvo) | `audience` |
| 8 | Escolha a diagramação (6 layouts visuais) | `layout_type` |
| 9 | Referências visuais (mín 3) | `references[]` |
| 10 | Logo da marca | `logo_upload` |
| 11 | Imagens (base, pessoa, fundo — opcional) | `base_image`, `character_image`, `background_image` |
| 12 | Elementos visuais | `elements[]` |
| 13 | Restrições (o que não quer) | `restrictions` |
| 14 | Revisão final + geração | — |

### Mudanças nos arquivos

#### Frontend

| Arquivo | Ação |
|---------|------|
| `src/components/cliente/social/constants.ts` | Simplificar LAYOUT_TYPES para 6 (hero_center, split, overlay, card, minimal, grid). Adicionar grid maps por layout. Adicionar arrays de objetivos, elementos visuais e campos de público. |
| `src/components/cliente/social/ArtWizard.tsx` | Refatorar para 14 steps. Novo estado: `topic`, `audience`, `textMode`, `restrictions`, `elements`, `baseImage`, `characterImage`, `backgroundImage`. Novo `canProceed()` por step. |
| `src/components/cliente/social/ArtWizardSteps.tsx` | Reescrever steps: Step1 tipo material, Step2 formato, Step3 tipo/qtd, Step4 objetivo, Step5 tema, Step6 texto (AI/manual), Step7 público, Step8 layout picker, Step9 referências, Step10 logo, Step11 imagens (3 categorias), Step12 elementos visuais, Step13 restrições, Step14 revisão final. |
| `src/components/cliente/social/LayoutMockupSvg.tsx` | Atualizar para os 6 novos layouts (hero_center, split, overlay, card, minimal, grid) |
| `src/components/cliente/social/LayoutPicker.tsx` | Sem mudança estrutural, mas renderizar os 6 novos |
| `src/pages/cliente/ClienteRedesSociais.tsx` | Atualizar `ArtGeneratePayload` para incluir novos campos (`topic`, `audience`, `textMode`, `restrictions`, `elements`, `baseImage`, `characterImage`, `backgroundImage`) |
| `src/hooks/useClientePosts.ts` | Passar novos campos para a edge function |

#### Backend (Edge Function)

| Arquivo | Ação |
|---------|------|
| `supabase/functions/generate-social-image/index.ts` | **Refatoração profunda**: (1) Novo template de prompt final com 14 seções (TYPE, FORMAT, OBJECTIVE, TOPIC, AUDIENCE, LAYOUT+GRID, TEXT, BRAND REFS, IMAGE HANDLING, LOGO PROCESSING, LOGO PLACEMENT, VISUAL STYLE, QUALITY, NEGATIVE). (2) Grid maps por layout injetados automaticamente. (3) Análise de referências extraindo paleta/tipografia/estilo. (4) Verificação pós-geração com IA + fallback em 3 níveis (normal → strict → ultra strict). (5) Regras por objetivo (vendas=alto contraste, autoridade=elegante, etc.). (6) Regras separadas para imagem base vs pessoa vs fundo. |
| `supabase/functions/generate-social-briefing/index.ts` | Atualizar para receber os novos campos (topic, audience, textMode, restrictions) e gerar texto com base neles. |

### Verificação pós-geração (fallback automático)

Após gerar a arte, o sistema fará uma chamada adicional à IA para avaliar:
- Layout respeitado?
- Logo na posição correta?
- Headline dominante?
- Composição limpa?
- Identidade visual mantida?

Se qualquer item falhar, regenera com prompt mais restritivo (até 3 tentativas: normal → strict → ultra strict). Isso acontece dentro da edge function, transparente para o usuário.

### Regras de carrossel

Quando formato = carrossel:
- Slide 1: hook forte
- Slides do meio: desenvolvimento do conteúdo
- Último slide: CTA/fechamento
- Todos mantêm mesma identidade, paleta, tipografia, grid, posição de logo

### Regras de impressão

Quando tipo = impresso:
- Alta resolução (300dpi)
- Cores CMYK
- Margem de segurança/sangria
- Conteúdo importante longe das bordas

### Resultado esperado

- Usuário responde perguntas simples sem termos técnicos
- Sistema monta prompt técnico e travado com grid maps, regras de logo, identidade visual
- Artes geradas respeitam layout, logo, hierarquia e branding
- Fallback automático corrige erros sem intervenção do usuário
- Suporte a digital + impressão + carrossel

### Estimativa de complexidade

Esta é uma refatoração grande envolvendo ~7 arquivos e ~2500+ linhas de código. Recomendo implementar em fases dentro da mesma execução, começando pelos constants/steps do wizard e terminando com o fallback no backend.


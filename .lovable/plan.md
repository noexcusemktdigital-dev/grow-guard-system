

# Personalizador de Layout no Wizard de Postagem

## O que vai mudar

No passo **8 — Layout** do wizard de Postagem (que hoje só tem o grid de templates), serão adicionados:
1. Um **7º template** novo: "Premium / Luxo"
2. Um **painel de personalização** logo abaixo do grid (logo, título, fundo, tom de cor)
3. Um **preview SVG dinâmico** ao lado do painel que se atualiza em tempo real
4. Esses ajustes passam para a edge function e são injetados no prompt visual

Estrutura do wizard continua com 14 passos. Nenhum passo novo.

## O que vai melhorar

- **Controle granular sem gastar créditos testando**: hoje você escolhe 1 dos 6 layouts e só vê o resultado depois de gerar (custa créditos). Com o preview reativo, você ajusta posição do logo / tipo de fundo / tom de cor e vê a composição antes de gerar.
- **Fundos não-foto** (cor sólida, gradiente, clean): hoje o modelo quase sempre coloca foto IA — útil pra arte de produto, mas ruim pra anúncios minimalistas/promocionais. Permitir escolher resolve esse atrito.
- **Tom de cor controlado**: traduz "Vibrante / Dark / Pastel / Neutro / Marca" em instruções concretas no prompt, dando consistência por campanha.
- **Posição do logo customizável** (4 cantos + nenhum): hoje fica onde o template manda; agora vira escolha.
- **Layout Premium/Luxo**: cobre a categoria de marcas premium/sofisticadas que os 6 atuais não atendem bem.
- **Obediência do modelo melhora**: as instruções vão explícitas e únicas no prompt (`LOGO POSITION: top right`, `BACKGROUND: gradient #ff6b6b → #4ecdc4`, etc.) em vez de ficarem implícitas no `promptRules` do template.

## O que vai ser feito

### 1. Adicionar layout "Premium / Luxo"

**Arquivos:** `src/components/cliente/social/constants.ts` + `src/components/cliente/social/LayoutMockupSvg.tsx`

- Novo entry em `LAYOUT_TYPES` com `value: "premium_luxo"`, `promptRules` descrevendo composição escura, dourado/metálico, espaço amplo, tipografia serifada elegante
- Novo case `premium_luxo` em `LayoutMockupSvg` com mockup escuro + acentos dourados + texto centralizado
- Atualizar `GRID_MAPS` correspondentemente

### 2. Estado e UI no passo 8 do wizard

**Arquivos:** `src/components/cliente/social/ArtWizard.tsx` + `src/components/cliente/social/ArtWizardSteps.tsx`

Novos estados em `ArtWizard.tsx`:
- `logoPosition: "top_left" | "top_right" | "bottom_left" | "bottom_right" | "none"` — default `top_right`
- `titlePosition: "top" | "center" | "bottom"` — default `center`
- `backgroundType: "ai_photo" | "solid_color" | "gradient" | "clean"` — default `ai_photo`
- `colorTone: "brand" | "neutral" | "vibrant" | "dark" | "pastel"` — default `brand`
- `primaryColor: string` (hex) — default puxado de `visualIdentity.primary_color` ou `#000000`
- `secondaryColor: string` — default puxado de `visualIdentity.secondary_color` ou `#ffffff`

Layout do passo 8 reorganizado em duas colunas (em md+):
- **Esquerda**: grid atual de 7 templates (`LayoutPicker`)
- **Direita**: painel "Personalizar" com:
  - Posição do logo (5 botões compactos com mini-ícones de canto)
  - Posição do título (3 botões: Topo / Centro / Inferior)
  - Tipo de fundo (4 botões; quando `solid_color` mostra 1 color picker; quando `gradient` mostra 2)
  - Tom de cor (5 chips: Marca / Neutro / Vibrante / Dark / Pastel)
  - Toggle de aspecto do preview: 1:1 ↔ 9:16 (apenas pré-visualização — o formato real continua vindo do passo 2)
  - Preview SVG dinâmico abaixo das opções

No mobile (sm-): painel vai abaixo do grid, preview no topo do painel.

### 3. Componente novo `LayoutPreviewSvg`

**Arquivo novo:** `src/components/cliente/social/LayoutPreviewSvg.tsx`

- Recebe props: `layoutType`, `logoPosition`, `titlePosition`, `backgroundType`, `colorTone`, `primaryColor`, `secondaryColor`, `aspect: "1:1" | "9:16"`
- Renderiza SVG reativo com retângulos coloridos para cada zona, labels "LOGO", "TÍTULO", "SUBTÍTULO", "CTA", "IMAGEM"
- Posições calculadas dinamicamente conforme as opções (logo no canto correto, bloco de título no zona escolhida, fundo conforme tipo selecionado)
- `colorTone` mapeia para paletas internas (Vibrante = cores saturadas, Dark = #0a0a0a + acento, Pastel = tons claros, Neutro = grays, Marca = `primaryColor/secondaryColor`)

### 4. Passar campos novos para a edge function

**Arquivos:** `src/components/cliente/social/ArtWizard.tsx` (em `handleGenerate`) → `src/pages/cliente/ClienteRedesSociais.tsx` (envio para edge) → `supabase/functions/generate-social-image/index.ts`

- Adicionar ao `ArtGeneratePayload`: `logoPosition`, `titlePosition`, `backgroundType`, `colorTone`, `primaryColor`, `secondaryColor`
- Em `ClienteRedesSociais.tsx`, repassar no `body` da chamada
- Na edge function:
  - Estender o tipo do contexto de layout com os 6 campos novos
  - Em `buildVisualPrompt`, **antes** do bloco `CRITICAL TEXT RENDERING RULES`, injetar:
    - Regra explícita de logo: posição ou "DO NOT include any brand logo"
    - Regra explícita de título: zona top/center/bottom
    - Regra explícita de fundo conforme tipo (foto IA / cor sólida com hex / gradiente com 2 hex / clean branco)
    - Regra de tom de cor traduzida para palette mood ("vibrant saturated palette", "dark luxurious palette with single accent color", etc.); quando `brand`, usar `primaryColor` e `secondaryColor` literalmente

Aplicado tanto no caminho otimizado (CoT) quanto no fallback, para garantir consistência com a outra mudança recente.

### 5. Não fazer

- ❌ Não criar passo novo no wizard (continua 14 passos)
- ❌ Não criar 9 layouts — só adicionar 1 (Premium/Luxo)
- ❌ Não tocar em `LayoutMockupSvg` dos 6 layouts existentes (só adicionar o novo case)
- ❌ Não mexer no Stage 3 (composição de logo) — ele já lê o `logoPosition` indiretamente via composição final

## Detalhes técnicos

**Mapeamento de `colorTone` no prompt:**
| Tom | Tradução no prompt visual |
|---|---|
| `brand` | Use brand palette: primary `{primaryColor}`, secondary `{secondaryColor}` |
| `neutral` | Neutral palette: warm grays, off-white, charcoal — no saturated colors |
| `vibrant` | Vibrant saturated palette with bold high-energy colors |
| `dark` | Dark luxurious palette: near-black background with single bright accent |
| `pastel` | Soft pastel palette: muted desaturated tones with high lightness |

**Locais exatos de edição:**
- `src/components/cliente/social/constants.ts` (~linha 49 — adicionar entry no `LAYOUT_TYPES`; ~linha 80+ — adicionar entrada no `GRID_MAPS`)
- `src/components/cliente/social/LayoutMockupSvg.tsx` (final do switch — novo case)
- `src/components/cliente/social/LayoutPreviewSvg.tsx` (arquivo novo)
- `src/components/cliente/social/ArtWizard.tsx` (~linha 145+ — novos estados; `handleGenerate` — incluir no payload)
- `src/components/cliente/social/ArtWizardSteps.tsx` (passo 8 — refatorar para 2 colunas com personalizador + preview)
- `src/pages/cliente/ClienteRedesSociais.tsx` (~linha 157-200 — incluir campos no `body` enviado para `generate-social-image`)
- `supabase/functions/generate-social-image/index.ts` (extender tipo do contexto + injetar regras no `buildVisualPrompt` antes das `CRITICAL TEXT RENDERING RULES`)

**Memórias a atualizar após implementação:**
- `mem://features/cliente-final/marketing/content-and-art-wizard-logic`: registrar personalizador inline e novos campos
- `mem://features/cliente-final/marketing/post-generation-quality-rules`: registrar layout Premium/Luxo e nova hierarquia de instruções de fundo/logo no prompt




# Reestruturação do Motor de Redes Sociais — Diagramação + Logo + Direção Criativa

## Problema identificado

1. **Logo não aparece**: A IA tenta extrair logo das referências mas falha. Precisa de upload separado e envio explícito ao pipeline.
2. **Step 3 (Estilo) é abstrato demais**: Mostra "Minimalista", "Bold", "Editorial" — conceitos de design, não de diagramação. O usuário leigo precisa ver **layouts concretos** (mockups visuais).
3. **Texto manual desnecessário**: O wizard pede headline, subheadline, CTA manualmente. A IA deveria gerar tudo a partir do briefing + objetivo.

## Arquitetura proposta — 3 camadas

```text
┌─────────────────────────────────────┐
│  CAMADA 1: Escolha de Diagramação   │ ← 9 layouts com thumbnail/mockup
│  (substitui Step 3 "Estilo")        │
├─────────────────────────────────────┤
│  CAMADA 2: Referências + Logo       │ ← Logo separado + refs obrigatórias
│  (com peso de preferência)          │   + "qual ref mais gostou?"
├─────────────────────────────────────┤
│  CAMADA 3: Geração de Copy          │ ← IA gera headline/sub/CTA
│  (usuário só descreve objetivo)     │   do briefing automaticamente
└─────────────────────────────────────┘
         ↓
   Prompt técnico em inglês → Nano Banana
```

## Mudanças detalhadas

### 1. Novo Step 3 — Diagramação (9 layouts com mockup)

Substituir `ART_STYLES` por `LAYOUT_TYPES` em `constants.ts`. Cada layout terá:
- `value`: identificador (ex: `hero_central`, `split_texto_imagem`, `card_moldura`, `imagem_overlay`, `grid_carrossel`, `minimalista_clean`, `anuncio_agressivo`, `premium_luxo`, `texto_dominante`)
- `label`, `desc`: nome e descrição curta
- `mockupSvg` ou `mockupClass`: representação visual inline (SVG simplificado ou CSS art) que mostra a composição — **não emoji, não gradiente**

Cada layout gera regras de composição específicas que vão direto no prompt:
```text
hero_central → Headline grande centralizada, sub abaixo, fundo texturizado
split_texto_imagem → Texto à esquerda, imagem à direita, CTA visível
card_moldura → Card com bordas arredondadas sobre fundo, texto dentro
imagem_overlay → Foto full-bleed com overlay escuro + texto sobreposto
grid_carrossel → Grid organizado estilo resumo/carrossel
minimalista_clean → 60%+ espaço vazio, poucos elementos
anuncio_agressivo → Alto contraste, texto enorme, cores vibrantes
premium_luxo → Tipografia serifada, fundos escuros, detalhes dourados
texto_dominante → Texto como elemento principal, imagem mínima
```

### 2. Logo separado no Step 4 (Referências)

Adicionar ao `RefUploader` (ou criar sub-componente):
- Campo dedicado "Logo da marca" com upload separado
- Auto-preenche do `visualIdentity.logo_url` se existir
- Logo é enviado como campo `logo_url` separado no payload (não misturado com referências)

No prompt final, instrução explícita: "Place the brand logo [position] in the composition. Use the attached logo image exactly as provided."

### 3. Peso das referências

Após upload das 3+ refs, mostrar as thumbnails com opção "⭐ Principal" — a referência marcada ganha peso 0.6, as demais dividem 0.4.

No CoT (Stage 1), incluir: "Reference 1 is the PRIMARY reference (weight 60%). Match its design language most closely."

### 4. Simplificar Steps de texto (Steps 6-7 atuais)

- **Remover** campos manuais de headline, subheadline, CTA, cena, elementos visuais
- **Substituir** por 2-3 perguntas simples:
  - "Sobre o que é a arte?" (campo existente do briefing)
  - "Qual resultado quer gerar?" (dropdown: vender, educar, engajar, informar, lançamento)
  - "Tem alguma frase obrigatória?" (opcional)
- A IA (generate-social-briefing) gera todos os textos automaticamente
- Mostrar preview dos textos gerados com opção de editar antes de gerar

### 5. Atualizar Edge Functions

**`generate-social-briefing`**: Receber `layout_type` e incluí-lo no prompt de extração.

**`generate-social-image`**:
- Receber `layout_type` e `logo_url` como novos campos
- Adicionar instruções de layout específicas ao prompt baseado no `layout_type` escolhido
- Enviar logo como imagem separada na chamada de geração (Stage 2) com instrução explícita de posicionamento
- Incluir peso de referência no CoT (Stage 1)

### 6. Novo fluxo do wizard (6 steps em vez de 8)

| Step | Conteúdo |
|------|----------|
| 1 | Briefing (o que comunicar + objetivo) — mantém |
| 2 | Tipo de postagem + quantidade — mantém |
| 3 | **Diagramação** — 9 layouts com mockup visual |
| 4 | **Referências + Logo** — refs obrigatórias + logo separado + peso |
| 5 | Formato (1:1, 4:5, 9:16) — mantém |
| 6 | **Review** — textos gerados pela IA + preview + edição opcional |

## Arquivos modificados

- `src/components/cliente/social/constants.ts` — substituir `ART_STYLES` por `LAYOUT_TYPES` com mockups SVG
- `src/components/cliente/social/ArtWizard.tsx` — reestruturar steps, adicionar logo, peso de refs, remover campos manuais
- `src/components/cliente/social/RefUploader.tsx` — adicionar upload de logo separado + seleção de ref principal
- `supabase/functions/generate-social-image/index.ts` — receber `layout_type` + `logo_url`, ajustar prompts
- `supabase/functions/generate-social-briefing/index.ts` — receber `layout_type`, gerar textos com base no layout

## Resultado esperado

O usuário leigo: escolhe um layout visual → envia logo + refs → descreve objetivo → IA gera tudo → arte profissional com logo correta e diagramação fiel.


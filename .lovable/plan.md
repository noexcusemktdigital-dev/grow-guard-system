

# Correções e Melhorias: Artes para Redes Sociais

## Problemas Identificados

1. **Quantidade incorreta**: Se o usuario seleciona 2 layouts e 2 pecas, gera 4 (multiplica). Deveria gerar exatamente a quantidade selecionada.
2. **Cores das referências ignoradas**: IA gera cores erradas (vermelho em vez de amarelo). O Stage 1 (CoT) não está dando peso suficiente às cores extraídas das referências.
3. **Logo duplicada**: Stage 3 (composição) às vezes adiciona uma segunda logo em vez de uma só.
4. **Sem opção de formatos diferentes por peça**: Quando gera múltiplas peças, todas usam o mesmo formato.
5. **Sem modo impressão (CMYK)**: Não existe opção para cartão de visita, flyer ou banner impresso.

---

## Correção 1: Quantidade exata de peças

**Problema**: `handleArtGenerate` em `ClienteRedesSociais.tsx` (linha 150-184) faz um loop duplo: `for layout × for quantity`. Se 2 layouts e 2 peças = 4 geradas.

**Solução**: Distribuir as peças entre os layouts. Ex: 2 peças com 2 layouts = 1 peça por layout. Se quantidade < layouts, gerar 1 por layout até atingir a quantidade.

**`src/pages/cliente/ClienteRedesSociais.tsx`**:
- Reescrever o loop de geração para produzir exatamente `quantity` peças
- Se há 2 layouts e 3 peças: layout1 gets 2, layout2 gets 1 (round-robin)
- Se há 1 layout e 3 peças: todas com o mesmo layout

**`src/components/cliente/social/ArtWizard.tsx`** (Step 6 summary):
- Corrigir o cálculo `totalPieces` para mostrar apenas `quantity` (não `quantity × layouts`)

## Correção 2: Fidelidade às cores das referências

**Problema**: O CoT (Stage 1) analisa referências mas não prioriza cores o suficiente. O modelo de geração (Stage 2) ignora a paleta extraída.

**Solução**: Reforçar no prompt a obrigatoriedade de usar as cores das referências.

**`supabase/functions/generate-social-image/index.ts`**:
- No `systemPrompt` do CoT, adicionar regra: "CRITICAL: The color palette you output MUST match the dominant colors from the reference images. Do NOT invent new colors. Extract the EXACT hex codes visible."
- No `buildFinalPrompt`, adicionar bloco enfático: "MANDATORY COLOR RULE: Use ONLY the colors listed in the color_palette section. Do NOT substitute or invent colors."
- Aumentar o limite de referências de 3 para 5 na conversão base64
- Adicionar instrução de prioridade de cor no prompt de referência

## Correção 3: Logo duplicada

**Problema**: Stage 3 (composição da logo) às vezes adiciona a logo mas a imagem do Stage 2 já contém uma logo "inventada" pela IA, resultando em 2 logos.

**Solução**: Reforçar no Stage 2 que NÃO deve renderizar nenhuma logo, e no Stage 3 que deve usar APENAS a logo fornecida.

**`supabase/functions/generate-social-image/index.ts`**:
- No prompt final do Stage 2, reforçar: "DO NOT render any logo, logotype, brand mark, or brand name text in the image. Leave the logo space COMPLETELY EMPTY."
- No prompt do Stage 3, adicionar: "If there is already a logo or brand mark visible in the design, REMOVE IT and replace with the provided logo. There must be EXACTLY ONE logo in the final image."

## Correção 4: Formatos diferentes por peça

**Problema**: Todas as peças usam o mesmo formato (1:1, 4:5 ou 9:16). O usuário quer escolher formatos diferentes quando gera múltiplas peças.

**Solução**: Quando `quantity > 1`, permitir selecionar formato por peça.

**`src/components/cliente/social/ArtWizard.tsx`**:
- No Step 5, quando `quantity > 1`, mostrar lista de peças com seletor de formato individual
- Estado: `artFormats: string[]` (array de formatos, um por peça) em vez de `artFormat: string`
- Se quantity = 1, manter UI simples como hoje
- Atualizar `ArtGeneratePayload` para incluir `formats: string[]`

**`src/pages/cliente/ClienteRedesSociais.tsx`**:
- No loop de geração, usar `payload.formats[i]` para cada peça

## Correção 5: Modo Impressão (CMYK)

**Problema**: Só existe modo digital. Usuário quer gerar cartão de visita, flyer e banner para impressão.

**Solução**: Adicionar Step 0 (antes do briefing) para escolher "Digital" ou "Impressão". No modo impressão, oferecer formatos em cm e instruir o modelo a usar paleta CMYK.

**`src/components/cliente/social/ArtWizard.tsx`**:
- Novo Step 1: "Onde será usada?" → Digital (rede social) | Impressão
- Se "Impressão", Step 5 (formato) mostra formatos de impressão:
  - Cartão de visita (9×5 cm, frente e verso)
  - Flyer A5 (14.8×21 cm)
  - Flyer A4 (21×29.7 cm)
  - Banner (100×60 cm)
- Total de steps sobe para 7 com o novo step inicial

**`src/components/cliente/social/constants.ts`**:
- Adicionar `PRINT_FORMATS` com dimensões em cm e resolução (300dpi)
- Adicionar `PRINT_TYPES` (cartão, flyer, banner)

**`supabase/functions/generate-social-image/index.ts`**:
- Receber `output_mode: "digital" | "print"` e `print_format` no body
- Se print: instruir o modelo "Use CMYK-safe colors only (no neon/fluorescent). High resolution for print at 300dpi."
- Mapear dimensões em cm para pixels (ex: 9×5cm @ 300dpi = 1063×591px)

---

## Tabela de Arquivos

| Arquivo | Ação |
|---------|------|
| `src/components/cliente/social/ArtWizard.tsx` | Step 0 digital/print, formatos por peça, fix totalPieces |
| `src/components/cliente/social/constants.ts` | PRINT_FORMATS, PRINT_TYPES |
| `src/pages/cliente/ClienteRedesSociais.tsx` | Fix loop de geração (quantidade exata), formatos por peça |
| `supabase/functions/generate-social-image/index.ts` | Cores obrigatórias, logo única, modo print, mais refs |

## Ordem de Execução

1. Fix quantidade exata de peças (bug crítico)
2. Fix cores das referências no prompt
3. Fix logo duplicada
4. Formatos diferentes por peça
5. Modo impressão (digital vs print)


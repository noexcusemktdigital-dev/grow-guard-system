

## Plano: Reescrever o pipeline de prompt para geração de artes com Nano Banana

### Problema
O prompt final enviado ao modelo de geração de imagem (`google/gemini-3-pro-image-preview`) está misturando português e inglês, com instruções genéricas e campos opcionais mal estruturados. Isso resulta em artes de baixa qualidade que não correspondem ao briefing.

### Diagnóstico técnico
O arquivo `supabase/functions/generate-social-image/index.ts` tem dois estágios:
1. **Chain-of-thought** (Gemini Flash) — analisa o briefing e gera seções estruturadas
2. **Geração final** (Gemini Pro Image) — recebe o prompt montado e gera a imagem

Os problemas:
- O `enrichedPrompt` (linhas 300-308) mistura campos em português (`Cena:`, `Elementos:`, `Marca:`)
- O prompt do chain-of-thought é bom mas o **prompt final montado** (linhas 354-401) não é suficientemente direto e específico para o modelo de imagem
- A seção de texto (`textSection`, linhas 343-352) mistura instruções de layout com o conteúdo textual
- Quando não há chain-of-thought (fallback), o prompt é muito fraco

### Ações

**1. Reescrever o system prompt do chain-of-thought** para ser mais prescritivo:
- Exigir que TODAS as seções sejam em inglês fluente
- Adicionar instrução explícita sobre como descrever texto que deve aparecer na imagem
- Incluir exemplos de prompts bem-sucedidos para calibrar o modelo

**2. Reescrever a montagem do prompt final** (linhas 354-401):
- Estrutura clara em inglês: `SCENE → LAYOUT → COLORS → TEXT OVERLAY → STYLE`
- Separar claramente "texto que deve aparecer na imagem" de "instruções de composição"
- Adicionar instruções explícitas de qualidade para o modelo de imagem (resolução, nitidez, tipografia)

**3. Melhorar o fallback** (quando chain-of-thought falha):
- Criar um prompt template robusto em inglês que funcione sem o chain-of-thought
- Traduzir automaticamente os campos do briefing para inglês antes de montar

**4. Adicionar instrução de referência visual mais forte**:
- Reescrever `referenceInstruction` (linha 410) para ser mais assertiva sobre replicar a identidade visual

### Arquivo editado
- `supabase/functions/generate-social-image/index.ts`

### Resultado esperado
Prompts 100% em inglês, bem estruturados, com separação clara entre composição visual e texto a renderizar, resultando em artes profissionais e consistentes com a identidade visual.


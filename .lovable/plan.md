

## Plano: Chain-of-Thought na Geracao de Artes

Adicionar uma etapa intermediaria de "analise e planejamento" antes da geracao da imagem. A IA primeiro analisa todo o contexto (briefing, marca, persona, estilo) e produz um prompt visual otimizado e detalhado. Esse prompt refinado e entao usado para gerar a imagem final.

---

### Arquitetura

```text
ANTES (1 chamada):
  prompt bruto do usuario --> gemini-3-pro-image --> imagem

DEPOIS (2 chamadas):
  prompt + contexto --> gemini-3-flash (texto) --> prompt otimizado --> gemini-3-pro-image --> imagem
```

---

### Mudancas

**Arquivo: `supabase/functions/generate-social-image/index.ts`**

Adicionar uma funcao `analyzeAndOptimizePrompt()` que faz a primeira chamada (chain step 1):

- Modelo: `google/gemini-3-flash-preview` (rapido e barato, so texto)
- Usa tool calling para retornar JSON estruturado com:
  - `optimized_prompt`: prompt visual detalhado em ingles, com 200-400 palavras
  - `composition_notes`: notas sobre composicao e foco
  - `color_strategy`: como as cores da marca serao aplicadas
- Recebe como entrada: prompt original do usuario, identidade visual, persona, formato, nivel de qualidade, estilo, tipo de composicao
- System prompt instrui a IA a agir como um "prompt engineer especialista em image generation", analisando o contexto e produzindo um prompt que maximize a qualidade da imagem

Integrar no fluxo principal:
1. Chamar `analyzeAndOptimizePrompt()` com todos os dados de contexto
2. Usar o `optimized_prompt` retornado no lugar do prompt manual montado hoje
3. Manter as instrucoes fixas (ABSOLUTE RULES, formato, etc.) no prompt final de imagem
4. Logar o prompt otimizado no console para debug

Nao ha mudanca de creditos -- o custo da chamada flash e minimo e fica absorvido.

**Nenhuma mudanca no frontend** -- o chain-of-thought e transparente para o usuario. A melhoria e interna na edge function.

---

### Detalhes Tecnicos

A primeira chamada usa tool calling para garantir saida estruturada:

```typescript
tools: [{
  type: "function",
  function: {
    name: "optimized_visual_prompt",
    parameters: {
      type: "object",
      properties: {
        optimized_prompt: { type: "string" },
        composition_notes: { type: "string" },
        color_strategy: { type: "string" }
      },
      required: ["optimized_prompt", "composition_notes", "color_strategy"]
    }
  }
}]
```

O prompt otimizado substitui apenas a secao "VISUAL BRIEF" do prompt final, mantendo todas as regras fixas (ABSOLUTE RULES, formato, estilo) intactas.

Se a chamada de otimizacao falhar (timeout, rate limit), o sistema faz fallback para o prompt original -- sem quebrar o fluxo.

---

### Resumo de Arquivos

| Arquivo | Mudanca |
|---------|---------|
| `supabase/functions/generate-social-image/index.ts` | Adicionar funcao chain-of-thought com chamada flash antes da geracao de imagem |


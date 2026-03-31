

## Diagnóstico — GPS do Negócio não gera resultado

### Causa raiz

O TOOL_SCHEMA do `generate-strategy` é extremamente grande (17 propriedades top-level obrigatórias, com objetos profundamente aninhados incluindo o novo `diagnostico_comercial`). Isso causa **timeout na Edge Function** — o modelo AI precisa gerar um JSON estruturado gigante via tool calling, e a execução excede o limite de tempo da Edge Function (150s).

Os logs confirmam: a função faz boot mas nunca registra erro nem resposta — simplesmente morre por timeout silencioso.

### Solução: Dividir a geração em 2 chamadas sequenciais

Em vez de pedir tudo em uma única chamada AI (que excede o timeout), dividir em:

1. **Chamada 1 — Marketing** (~12 seções existentes): `diagnostico`, `icp`, `proposta_valor`, `analise_concorrencia`, `tom_comunicacao`, `estrategia_aquisicao`, `estrategia_conteudo`, `plano_crescimento`, `benchmarks_setor`, `plano_execucao`, `estrutura_recomendada`, + campos simples
2. **Chamada 2 — Comercial** (`diagnostico_comercial` completo): radar 5 eixos, projeções, funil reverso, estratégias de vendas, plano de ação

Cada chamada fica dentro do limite de tempo. O frontend faz as duas chamadas em sequência e junta os resultados antes de salvar.

### Mudanças

| Arquivo | Ação |
|---------|------|
| `supabase/functions/generate-strategy/index.ts` | Aceitar parâmetro `section` (`marketing` ou `comercial`). Quando `section=marketing`, usar TOOL_SCHEMA e SYSTEM_PROMPT só de marketing (como era antes). Quando `section=comercial`, usar TOOL_SCHEMA e SYSTEM_PROMPT só do diagnóstico comercial. Não debitar créditos na chamada comercial (debitar só na marketing). |
| `src/pages/cliente/ClienteGPSNegocio.tsx` | Na função de geração: chamar `generate-strategy` com `section: "marketing"` primeiro, depois chamar com `section: "comercial"`. Juntar os dois resultados em um objeto unificado antes de salvar em `marketing_strategies`. Mostrar progresso ("Gerando estratégia de marketing..." → "Gerando diagnóstico comercial..."). |
| `src/hooks/useMarketingStrategy.ts` | Sem mudança (o hook `useGenerateStrategy` já retorna `data` genérico). |

### Alternativa considerada e descartada

Queue-based (salvar job no banco, processar em background): mais complexo, requer polling no frontend, nova tabela, novo worker. A divisão em 2 chamadas é mais simples e resolve o problema diretamente.

### Benefício adicional

Dividir também reduz o risco de o modelo falhar no parse do JSON gigante — schemas menores = respostas mais confiáveis.


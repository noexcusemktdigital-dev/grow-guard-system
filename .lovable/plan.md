

## Diagnóstico: O GPS está gerando dados completos, mas há problemas de mapeamento de campos

### Problema encontrado

Analisei os dados no banco e confirmei que o GPS **está gerando o diagnóstico completo** — todos os campos existem (`diagnostico_gps`, `etapas`, `projecoes`, `persona`, `analise_concorrencia`, etc.) com score_geral = 42.5.

O problema é de **mapeamento de campos** entre o que o backend retorna e o que o frontend espera:

1. **`score_percentage` salvo como 0**: Na hora de salvar, o código busca `unifiedResult.diagnostico.score_geral`, mas o campo real é `diagnostico_gps.score_geral`. Resultado: score salvo como 0, aparentando que nada foi gerado.

2. **`diagnostico_comercial` não existe mais**: O schema unificado GPS retorna tudo dentro de `diagnostico_gps` (scores de marketing E comercial), mas o dashboard ainda procura `diagnostico_comercial` separado (da arquitetura antiga de 3 chamadas).

3. **Normalização parcial**: A normalização `diagnostico_gps → diagnostico` foi adicionada, mas não cobre todos os componentes — os sub-componentes comerciais (`ComScoreRadar`, `ComFunilReverso`, etc.) ainda recebem `result.diagnostico_comercial` que é `undefined`.

### Plano de correção

**Arquivo 1: `src/pages/cliente/ClienteGPSNegocio.tsx`**
- Corrigir a linha de save para ler `diagnostico_gps.score_geral` em vez de `diagnostico.score_geral`

**Arquivo 2: `src/pages/cliente/ClientePlanoMarketingStrategy.tsx`**
- Expandir a normalização para mapear campos comerciais do `diagnostico_gps` para `diagnostico_comercial` (score_comercial, etc.)
- Garantir que todas as referências usem `result_` em vez de `result`

**Arquivo 3: `src/hooks/useStrategyData.ts`**
- Atualizar o hook para ler dados de `diagnostico_gps` além de `diagnostico_comercial`, garantindo compatibilidade com a nova estrutura

Essas correções são não-destrutivas — estratégias antigas com `diagnostico_comercial` separado continuarão funcionando.


# Evals — Sistema Noé

Suíte de avaliação para prompts/features IA. Roda em CI ou local pra detectar regressão de qualidade ao trocar modelo/prompt.

## Por quê
- Cada `generate-*` invoca LLM (Gemini via Lovable AI Gateway)
- Trocar prompt ou modelo pode degradar silenciosamente
- Sem eval = bug de IA só percebido quando cliente reclama

## Como rodar

### Local
```bash
# Setup (1x)
export LOVABLE_API_KEY=<seu-token>
export LOVABLE_SEND_URL=<endpoint>

# Rodar todos
npm run evals

# Rodar específico
npm run evals -- generate-prospection
```

### CI (futuro)
Adicionar workflow `.github/workflows/evals.yml` rodando 1x/dia ou em PRs que tocam `supabase/functions/generate-*`.

## Estrutura

- `fixtures/` — inputs de teste (sintéticos, sem PII real)
- `tests/` — definições de eval (1 arquivo por fn)
- `lib/` — runner + matchers reutilizáveis

## Matchers disponíveis

| Matcher | Uso |
|---------|-----|
| `contains(text)` | output contém substring |
| `notContains(text)` | output não contém |
| `matchesRegex(re)` | output bate regex |
| `minLength(n)` | tamanho mínimo |
| `maxLength(n)` | tamanho máximo |
| `isJSON()` | é JSON parseável |
| `hasKeys(keys)` | JSON com chaves esperadas |
| `semanticMatch(expected)` | (futuro) similaridade via embedding |

## Padrão de teste

Cada teste roda N fixtures × 1+ matchers. Resultado: pass rate %.

Threshold padrão: 90% pass. Abaixo disso, gate falha.

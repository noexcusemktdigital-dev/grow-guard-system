

## Plano — Retomar GPS do Negócio de onde parou

### Problema

Quando Rafael (comercial) completa mas Sofia (marketing) falha, as respostas do Rafael ficam apenas no estado React (`useState`). Ao recarregar a página, o estado é perdido e o GPS recomeça do zero, obrigando o usuário a responder tudo de novo.

### Solução

Persistir as respostas do Rafael imediatamente após ele completar, e ao carregar a página, detectar se já existem respostas salvas sem resultado final — pulando direto para a fase da Sofia.

### Mudanças

| Arquivo | Ação |
|---------|------|
| `src/pages/cliente/ClienteGPSNegocio.tsx` | 1. Em `handleRafaelComplete`: salvar as respostas do Rafael no `sales_plans` imediatamente (já faz isso no `handleSofiaComplete`, mover para antes). 2. No `useEffect` de auto-detect: se existe `salesPlan` com respostas mas NÃO existe `activeStrategy` com `strategy_result`, carregar as respostas do Rafael do `salesPlan` no state e pular direto para `chat-sofia`. 3. Adicionar botão "Continuar de onde parou" na tela welcome quando detectar esse estado parcial. |

### Fluxo corrigido

```text
1. Rafael completa → salva respostas no sales_plans imediatamente
2. Transição → Sofia inicia
3. Sofia completa → gera estratégia (marketing + comercial)
4. Se falhar na geração → respostas do Rafael já estão salvas
5. Usuário recarrega → detecta sales_plan sem strategy_result
6. Mostra "Continuar de onde parou" → pula direto pra Sofia
```

### Detalhes técnicos

- O hook `useSalesPlan` já existe e retorna as respostas salvas
- O hook `useSaveSalesPlan` já faz upsert por `organization_id`
- A detecção é: `salesPlan?.answers` tem dados + `!hasResult` (sem strategy_result na marketing_strategies)
- As respostas do Rafael são carregadas no `rafaelAnswers` state via `setRafaelAnswers(salesPlan.answers)`
- Na tela welcome, mostrar card diferenciado: "Você já completou a etapa comercial. Continuar com a Sofia?"




## Plano — Permitir gerar resultado sem preencher novamente

### Problema

Quando ambas as fases (Rafael + Sofia) são preenchidas mas a geração falha, as respostas da Sofia são perdidas — elas só existem em memória durante `handleSofiaComplete`. Ao recarregar, o sistema só encontra as respostas do Rafael no `sales_plans` e pede para refazer tudo.

### Solução

1. **Persistir as respostas da Sofia junto com as do Rafael** — no início de `handleSofiaComplete`, antes de chamar a IA, salvar o `allAnswers` (Rafael + Sofia merged) no `sales_plans` via `saveSalesPlan.mutate`.

2. **Detectar progresso completo sem resultado** — se `salesPlan.answers` tem chaves suficientes (respostas de ambos os agentes, ~25+ chaves) mas `activeStrategy.strategy_result` é null, significa que tudo foi preenchido mas a geração falhou.

3. **Botão "Gerar Resultado"** — na tela welcome, quando esse estado é detectado, mostrar um botão direto para gerar o resultado sem refazer perguntas. Esse botão chama `handleSofiaComplete({})` com answers vazio (os dados completos já estão no `salesPlan.answers`).

### Mudanças

| Arquivo | Ação |
|---------|------|
| `src/pages/cliente/ClienteGPSNegocio.tsx` | 1. No início de `handleSofiaComplete`: persistir `allAnswers` no `sales_plans`. 2. Novo estado `hasFullProgress` (salesPlan com ~25+ respostas + sem resultado). 3. Na welcome screen: botão "Gerar Resultado Agora" que carrega answers do banco e vai direto para a fase `generating`. 4. Ajustar `handleSofiaComplete` para usar `salesPlan.answers` como fallback quando `rafaelAnswers` está vazio (caso de retry). |

### Fluxo corrigido

```text
Rafael completa → salva no sales_plans (só Rafael)
Sofia completa → salva no sales_plans (Rafael + Sofia merged)
Geração inicia → se falhar, answers já estão salvos
Usuário volta → detecta answers completos sem resultado
→ Mostra botão "Gerar Resultado Agora"
→ Carrega answers do banco e vai direto pra geração
```

### Detalhes técnicos

- `hasFullProgress`: `salesPlan?.answers && Object.keys(salesPlan.answers).length >= 20 && !hasResult`
- O botão de gerar chama uma nova função `handleRetryGeneration` que faz `setRafaelAnswers(salesPlan.answers)` e depois chama a lógica de geração diretamente (as 3 chamadas sequenciais)
- O `hasPartialProgress` existente (só Rafael) continua funcionando para quem parou antes da Sofia


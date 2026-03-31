

## Reformulação do Layout do GPS do Negócio — Resultado Final

### Problemas identificados nas screenshots

1. **Insights Comerciais**: Exibem JSON bruto `{"tipo":"opportunity","texto":"..."}` — o código busca `insight.descricao` mas a AI retorna `insight.texto`
2. **Plano de Ação**: Usa `fase.acoes` mas a AI retorna `fase.items`; o label `fase.fase` (ex: "Estruturação e Aquisição") é forçado dentro de um círculo de 32px, causando overflow
3. **Score Comercial**: O ScoreRing funciona mas o card é pobre — sem termômetro/barra de progresso visual, sem contexto do nível
4. **9 abas flat**: Confuso — Marketing e Comercial misturados sem hierarquia

### Solução: Duas abas principais (Marketing / Comercial)

```text
┌─────────────────────────────────────────────┐
│  [42/100 Marketing]  [34/100 Comercial]     │
│  Pendente · 30 mar 2026                     │
├─────────────────────────────────────────────┤
│  [ Marketing ]  [ Comercial ]               │ ← 2 abas principais
├─────────────────────────────────────────────┤
│  Marketing selecionado:                     │
│  [Resumo][ICP][Concorrência][Tom][Aquisição]│ ← sub-abas
│  [Conteúdo][Projeção][Execução]             │
├─────────────────────────────────────────────┤
│  Comercial selecionado:                     │
│  [Score & Radar][Funil Reverso][Insights]   │ ← sub-abas
│  [Estratégias][Projeções][Plano de Ação]    │
└─────────────────────────────────────────────┘
```

### Correções de dados no TabComercial

| Bug | Campo da AI | Campo no código atual | Correção |
|-----|-------------|----------------------|----------|
| Insights JSON | `insight.texto` + `insight.tipo` | `insight.descricao \|\| JSON.stringify` | Adicionar `insight.texto` no fallback |
| Plano de Ação vazio | `fase.items` (array strings) | `fase.acoes` | Ler `fase.items \|\| fase.acoes` |
| Label overflow | `fase.fase` = "Estruturação..." | Forçado num `w-8 h-8` círculo | Usar `fase.periodo` (ex: "30 dias") no círculo, `fase.fase` como título texto |
| colorMap keys | AI retorna `"success"`, `"warning"`, `"opportunity"` | Código mapeia `"sucesso"`, `"alerta"`, `"oportunidade"` | Adicionar ambas as chaves no mapa |

### Melhorias visuais no Comercial

- **Score**: Card com barra de progresso horizontal + badge de nível colorido (Básico=vermelho, Intermediário=amber, Avançado=green) + análise textual
- **Insights**: Cards com ícones por tipo (success=CheckCircle verde, warning=AlertTriangle laranja, opportunity=Lightbulb azul) + bordas coloridas
- **Plano de Ação**: Timeline vertical com período no badge, fase como título, items como checklist

### Arquivo a modificar

| Arquivo | Mudanças |
|---------|----------|
| `src/pages/cliente/ClientePlanoMarketingStrategy.tsx` | Reorganizar tabs em 2 níveis (Marketing/Comercial com sub-tabs), corrigir mapeamento de campos nos insights/plano de ação, melhorar layout visual do score e insights comerciais |


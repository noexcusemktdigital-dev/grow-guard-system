

## Plano: Corrigir formatação numérica nas telas de Metas & Ranking

### Problemas encontrados

1. **MetasRanking.tsx (Franqueadora)** — linhas 210-211: `formatBRL()` é usado para TODOS os tipos de meta, inclusive "leads" e "contratos". Resultado: "R$ 50" para uma meta de 50 leads. O FranqueadoMetasRanking já faz a verificação correta (`isMonetary`), mas a franqueadora não.

2. **MetasRanking.tsx** — linha 437: Campo "Valor Alvo" é `<Input type="number">` sem formatação. O usuário digita "10000" e vê "10000" em vez de "10.000". Precisa de máscara ou formatação visual.

3. **MetasRanking.tsx** — linha 239: `formatBRL(gp.requiredPacePerDay)` está correto para faturamento, mas incorreto para metas de leads/contratos (mostra "R$ 2/dia" para leads).

4. **MetasRanking.tsx** — linha 278: Pontos do ranking (`r.score`) não usa separador de milhar. Ex: "1500" em vez de "1.500".

5. **FranqueadoMetasRanking.tsx** — linha 203: Valores não-monetários exibem o número cru sem `toLocaleString`, ex: "1500" em vez de "1.500".

### Solução

#### Arquivo: `src/pages/MetasRanking.tsx`

1. **Criar helper `formatMetricValue`**: Verifica se o tipo é monetário (`faturamento`, `avg_ticket`) e usa `formatBRL`, senão usa `toLocaleString("pt-BR")`.

2. **Linhas 210-211 (renderMetas)**: Substituir `formatBRL(g.target_value)` e `formatBRL(currentValue)` por `formatMetricValue(valor, tipo)`.

3. **Linha 239 (ritmo/dia)**: Condicionar ao tipo — se monetário, `formatBRL`; senão, `valor.toLocaleString("pt-BR")`.

4. **Linha 278 (pontos ranking)**: Adicionar `.toLocaleString("pt-BR")` ao score.

5. **Linha 437 (input valor alvo)**: Trocar `type="number"` por `type="text"` com máscara que:
   - Aceita apenas dígitos e vírgula
   - Exibe formatado com separador de milhar (ponto) ao digitar
   - Converte para número limpo ao salvar

#### Arquivo: `src/pages/franqueado/FranqueadoMetasRanking.tsx`

1. **Linha 203**: Para valores não-monetários, adicionar `.toLocaleString("pt-BR")` ao `currentValue`.
2. **Linha 206**: Idem para `goal.target_value`.

### Arquivos (2)
- `src/pages/MetasRanking.tsx`
- `src/pages/franqueado/FranqueadoMetasRanking.tsx`


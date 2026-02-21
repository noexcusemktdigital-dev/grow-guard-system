

# Reorganizar Propostas e Mover Estrategia para Diagnostico NOE

## Resumo

Tres mudancas principais:
1. Na pagina de Propostas, a aba "Estrategia" vira "Propostas" (lista de propostas existentes)
2. A calculadora perde a lista de propostas que ficava embaixo e fica so com o wizard
3. A secao de Estrategia (objetivos, plano de acao, projecao, justificativa) muda para o Diagnostico NOE, como uma aba/secao adicional no resultado

## O que muda

### Pagina de Propostas (`FranqueadoPropostas.tsx`)

**Tabs: "Propostas" + "Calculadora"** (antes era "Estrategia" + "Calculadora")

- **Aba "Propostas"**: Contem a tabela de propostas existentes (que antes ficava abaixo de tudo). Cada proposta pode ser clicada para ver detalhes, exportar PDF, converter em contrato.
- **Aba "Calculadora"**: Permanece com o wizard de 3 steps (Servicos, Valores/Excedente, Resumo). Remove a tabela de propostas que ficava embaixo.

**Descricoes dos servicos**: Atualizar para usar os textos EXATOS do site de referencia (mais longos e detalhados). Os nomes tambem ajustados para igualar: "Artes (Criativos Organicos)", "Videos (Reels)", "Gestao de Trafego Google (inclui YouTube)", "Configuracao CRM + Acompanhamento (RD Station)", "Fluxo/Funil (Etapas de venda + roteiro comercial)".

**Quantidades e valores**: Mantidos como estao (quantidade x valor = subtotal). O site de referencia nao mostra valores -- isso e interno da franquia.

### Diagnostico NOE (`FranqueadoDiagnostico.tsx`)

No resultado do diagnostico (tela pos-finalizacao), adicionar novas secoes de estrategia:

- **Objetivos Identificados** -- gerados com base nas respostas do diagnostico (recomendacoes ja existentes)
- **Plano de Acao Recomendado** -- 5 passos estrategicos (mock)
- **Projecao de Resultados** -- mini tabela mes 1/3/6/12 com leads, conversoes, faturamento
- **Como Bater a Meta** -- texto com base nos gargalos identificados
- **Entregas do Projeto** -- lista de entregas recomendadas com base no nivel de maturidade (o franqueado depois leva isso para a calculadora)
- **Justificativa Tecnica** -- texto usando dados do diagnostico

Botao "Gerar Proposta" continua no final, levando para a calculadora.

---

## Secao Tecnica

### Arquivos modificados

```
src/pages/franqueado/FranqueadoPropostas.tsx   -- tabs renomeadas, lista de propostas na aba Propostas, remove lista de baixo, descricoes atualizadas
src/pages/franqueado/FranqueadoDiagnostico.tsx -- adiciona secoes de estrategia no resultado
```

### Detalhes de implementacao

**FranqueadoPropostas.tsx:**
- Renomear TabsTrigger "Estrategia" para "Propostas" com icone FileText
- Conteudo da aba "Propostas" = tabela de propostas (mover de baixo para dentro da aba)
- Remover Card "Propostas Existentes" que fica apos o Tabs
- Remover todo o conteudo da antiga aba Estrategia (diagnostico cards, projecao, justificativa)
- Atualizar descricoes dos servicos nos `modulosNOE` para textos identicos ao site de referencia
- Ajustar nomes: "Artes (Criativos Organicos)", "Videos (Reels)", "Gestao de Trafego Google (inclui YouTube)", etc.

**FranqueadoDiagnostico.tsx:**
- No bloco `if (concluido)`, apos os cards de Gargalos e Recomendacoes, adicionar:
  - Card "Plano de Acao Recomendado" com 5 items
  - Card "Projecao de Resultados" com tabela mes 1/3/6/12
  - Card "Como Bater a Meta" com texto baseado nos gargalos
  - Card "Entregas Recomendadas" com lista de servicos sugeridos por nivel de maturidade
  - Card "Justificativa Tecnica" com texto usando dados do diagnostico

### Ordem de implementacao

1. `FranqueadoPropostas.tsx` -- reorganizar tabs, mover lista, atualizar descricoes
2. `FranqueadoDiagnostico.tsx` -- adicionar secoes de estrategia no resultado


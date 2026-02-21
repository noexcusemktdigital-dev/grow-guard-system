
# Modulo Gestao -- Financeiro Unidade + Meus Contratos (Rewrite Completo)

## Visao Geral

Reescrever completamente as 2 paginas do modulo Gestao do Franqueado e expandir os dados em `franqueadoData.ts` para suportar:
- Logica de excedente (quem emitiu a cobranca define a % retida)
- Dashboard financeiro com 8 KPIs + graficos
- Entradas detalhadas por cliente
- Saidas locais do franqueado
- Fechamentos/DRE com download
- Alertas automaticos
- Contratos com filtros, geracao, detalhe rico e alertas de vencimento

---

## Arquivo 1: `src/data/franqueadoData.ts`

### Substituir interfaces e dados existentes

**Substituir `FranqueadoContrato`** para incluir:
- `valorBase`, `valorExcedente`, `emissorExcedente` ("franqueado" | "matriz" | null)
- `status` agora inclui "vencendo"
- `tipo` agora e "Recorrente" | "Unitario"
- `assinado: boolean`, `propostaId?: string`

**Substituir `FranqueadoFinanceiroResumo`** para incluir:
- `receitaBruta`, `repasse`, `excedenteGerado`, `excedenteEmitido`
- `valorLiquidoEstimado`, `royalties`, `sistemaMensalidade`, `resultadoEstimado`

### Novos tipos

- **`FranqueadoEntrada`**: clienteNome, tipo (Recorrente/Unitario/SaaS/Excedente), valorContrato, repasseValor (20%), excedente, emissorExcedente, valorFinalFranqueado (calculado), statusCobranca, recebido, data
- **`FranqueadoSaida`**: descricao, tipo, valor, categoria (Pessoas/Estrutura/Marketing/Ferramentas/Outros), mes, status
- **`FranqueadoFechamento`**: mes, receita, repasse, excedenteFranqueado, royalties, sistema, valorLiquido, status (Disponivel/Pago/Pendente)
- **`FranqueadoAlertaFinanceiro`**: tipo (warning/info/clock), mensagem

### Novas funcoes

- `getFranqueadoEntradas()` -- 5 entradas com mix de emissores e status
- `getFranqueadoSaidas()` -- 5 despesas locais (aluguel, salario, ads, licenca, material)
- `getFranqueadoFechamentos()` -- 5 meses com status variados
- `getFranqueadoAlertasFinanceiros()` -- 4 alertas (contrato vencendo, cobranca pendente, fechamento disponivel, DRE aguardando)
- `getFranqueadoReceitaMensal()` -- 6 meses de receita + repasse para grafico

### Logica do Excedente (regra de negocio)

```text
Se emissorExcedente === "franqueado":
  valorFinalFranqueado = (20% do valorBase) + 100% do excedente

Se emissorExcedente === "matriz":
  valorFinalFranqueado = (20% do valorBase) + 20% do excedente

Se excedente === 0:
  valorFinalFranqueado = 20% do valorBase
```

---

## Arquivo 2: `src/pages/franqueado/FranqueadoFinanceiro.tsx` (rewrite completo)

### Estrutura: 4 abas via Tabs component

#### Aba 1 -- Dashboard Financeiro
- **8 KPI cards** em grid 2x4:
  - Receita Bruta do Mes
  - Repasse (20%)
  - Excedente Gerado
  - Excedente Emitido por Voce
  - Valor Liquido Estimado
  - Royalties (1%)
  - Sistema Mensalidade
  - Resultado Estimado
- **Grafico Recharts** (BarChart): Receita vs Repasse nos ultimos 6 meses
- **Card de Alertas** com lista dos alertas financeiros (usando AlertCard ou similar)

#### Aba 2 -- Entradas
- Tabela com colunas: Cliente, Tipo, Valor Contrato, 20% Repasse, Excedente, Status Cobranca (quem emitiu), Recebido (sim/nao badge), Data
- Tooltip ou badge explicando a logica do excedente por linha
- Totalizador no rodape

#### Aba 3 -- Saidas
- Tabela com colunas: Descricao, Tipo, Valor, Categoria, Mes, Status
- Filtro por categoria (tabs secundarias ou badges)
- Totalizador
- Texto explicativo: "Gestao interna da unidade -- nao interfere no financeiro da matriz"

#### Aba 4 -- Fechamentos (DRE)
- Tabela com colunas: Mes, Receita, Repasse, Excedente Franqueado, Royalties, Sistema, Valor Liquido, Status
- Badge de status colorido (Disponivel = azul, Pago = verde, Pendente = amarelo)
- Botoes de download PDF e Excel por linha
- Somente leitura -- sem edicao

---

## Arquivo 3: `src/pages/franqueado/FranqueadoContratos.tsx` (rewrite completo)

### Estrutura: 3 abas + detalhe

#### Aba 1 -- Lista de Contratos
- **4 KPI cards**: Contratos Ativos, Receita Recorrente, Vencendo em 15 dias, Pendentes (sem assinatura)
- **Filtros**: Status (todos/ativo/vencendo/pendente/encerrado), Tipo (todos/recorrente/unitario)
- **Tabela** com colunas: Cliente, Tipo, Valor Base, Excedente, Data Inicio, Data Vencimento, Status, Assinado
- Clicar na linha abre o detalhe (aba 3)
- Status badges coloridos (ativo=verde, vencendo=laranja, pendente=amarelo, encerrado=cinza)

#### Aba 2 -- Gerar Novo Contrato
- Formulario com campos:
  - Select de cliente (do CRM -- getFranqueadoLeads)
  - Select de proposta vinculada (getFranqueadoPropostas, filtrado por status aceita)
  - Valor base (auto-preenchido da proposta)
  - Valor excedente (input numerico)
  - Forma de cobranca (select: Franqueado / Matriz)
  - Prazo (select: 6 meses / 12 meses / 24 meses)
  - Tipo (Recorrente / Unitario)
- Botao "Gerar Contrato" (mock -- adiciona toast de sucesso)
- Botao "Baixar PDF" (mock)

#### Aba 3 -- Detalhe do Contrato (exibido ao clicar em um contrato)
- Card com todos os dados: cliente, valor base, excedente, % repasse calculado, emissor, data inicio, vencimento, status assinatura
- Historico placeholder (lista de eventos)
- Botoes: Download PDF, Anexar Assinado (mock upload)
- Botao Voltar retorna para aba 1

#### Alertas (exibidos na aba 1)
- Card de alertas: contratos vencendo em 15 dias, contratos sem assinatura, cliente sem cobranca emitida

---

## Arquivos modificados

```text
src/data/franqueadoData.ts                        -- substituir interfaces + adicionar 6 novas funcoes
src/pages/franqueado/FranqueadoFinanceiro.tsx      -- rewrite completo com 4 abas
src/pages/franqueado/FranqueadoContratos.tsx       -- rewrite completo com 3 abas + detalhe
```

Nenhum arquivo da franqueadora e tocado.

---

## Ordem de implementacao

1. `franqueadoData.ts` -- novos tipos, dados e funcoes
2. `FranqueadoFinanceiro.tsx` -- 4 abas completas com graficos e alertas
3. `FranqueadoContratos.tsx` -- lista com filtros, gerador, detalhe e alertas



# Plano de Vendas -- Cerebro Estrategico do SaaS

## Resumo

Transformar o Plano de Vendas de um formulario simples em um diagnostico estrategico completo com 6 abas, calculos automaticos em cascata, funil grafico dinamico, radar de maturidade comercial e plano de acao integrado ao CRM/Scripts/IA.

---

## Estrutura: 6 Abas com Barra de Progresso

No topo da pagina: barra de progresso indicando quantas abas foram preenchidas (0-6). Cada aba salva seu estado via useState.

| Aba | Nome | Conteudo principal |
|-----|------|--------------------|
| 1 | Visao Geral | Periodo, receita atual/desejada, tipo de venda, grafico de crescimento |
| 2 | Meta Financeira | Meta, ticket, conversao, funil grafico cascata |
| 3 | Estrutura Comercial | Vendedores, canais, ferramentas, insights automaticos |
| 4 | Mercado | Concorrentes, diferenciais, posicionamento |
| 5 | Diagnostico | Score de maturidade comercial com radar |
| 6 | Plano de Acao | Metas diarias/semanais, sugestoes, botoes de integracao |

---

## Detalhamento por Aba

### Aba 1 -- Visao Geral

Campos editaveis:
- Periodo do plano: Select (Mensal / Trimestral / Semestral / Anual)
- Receita atual media (R$): Input numerico
- Receita desejada (R$): Input numerico
- Crescimento desejado (%): Calculado automaticamente (desejada - atual) / atual * 100
- Mercado de atuacao: Input texto
- Tipo de venda: Select (B2B / B2C / Hibrido)

Visual:
- Grafico AreaChart do Recharts mostrando projecao de crescimento meses a frente
- Card comparativo "Atual vs Meta" com barra de progresso

### Aba 2 -- Meta Financeira (Motor de Calculos)

Campos editaveis:
- Meta de faturamento (R$)
- Ticket medio (R$)
- Taxa de conversao lead-venda (%)
- Taxa de conversao lead-proposta (%)

Calculos automaticos em cascata:
```
Vendas necessarias = Meta / Ticket
Propostas necessarias = Vendas / (conversaoVenda / 100)
Leads necessarios = Propostas / (conversaoProposta / 100)
Contatos necessarios = Leads * 1.5 (fator estimado)
```

Visual:
- **Funil grafico dinamico**: 4 barras horizontais decrescentes (Contatos > Leads > Propostas > Vendas) com valores calculados em tempo real
- Grid 4 KpiCards com os resultados
- Card "Meta Mensal Detalhada": Meta/dia util, Meta/semana

### Aba 3 -- Estrutura Comercial

Campos:
- Quantidade de vendedores: Input numerico
- Canais de aquisicao: Checkboxes (Google Ads, Instagram, Indicacao, Site, LinkedIn, Outro)
- Ferramentas usadas: Checkboxes (CRM, WhatsApp, Email, Telefone)
- Tempo medio de fechamento (dias): Input numerico
- Processo estruturado: Switch (Sim/Nao)

Insights automaticos gerados com base nos dados:
- Se conversao < 15%: "Seu funil indica baixa conversao. Recomendamos revisar a etapa de proposta."
- Se leads necessarios > leads ativos * 1.3: "Sua meta exige X% mais leads do que voce tem hoje."
- Se vendedores < vendas necessarias / 10: "Sua equipe pode estar subdimensionada para a meta."
- Se sem processo estruturado: "A falta de processo impacta diretamente a previsibilidade comercial."

Cards de insights com icone AlertTriangle e cor amarela/vermelha conforme severidade.

### Aba 4 -- Mercado e Concorrencia

Campos:
- Principais concorrentes: 3 inputs de texto
- Diferenciais competitivos: Textarea
- Posicionamento de preco: Select (Abaixo do mercado / Na media / Acima do mercado / Premium)
- Saturacao do mercado: Slider (1-10, com labels Baixa/Media/Alta)

Card "Sugestoes de IA" (placeholder visual):
- "Baseado no seu nicho, considere diferenciacao por atendimento personalizado"
- "Posicionamento premium requer prova social forte -- invista em cases"
- Badge "Powered by IA" no canto

### Aba 5 -- Diagnostico de Maturidade Comercial

5 perguntas com escala 1-5:
1. Seu processo de vendas esta documentado?
2. Voce acompanha taxa de conversao por etapa?
3. Existe gestao ativa de leads e follow-up?
4. Suas metas sao baseadas em dados historicos?
5. Voce usa CRM integrado ao dia a dia?

Calculo: media das respostas normalizada para 0-100%

Classificacao (4 niveis, mesmo padrao do DiagnosticoTermometro):
- 0-25%: Inicial (vermelho)
- 26-50%: Estruturando (laranja)
- 51-75%: Escalavel (amarelo)
- 76-100%: Alta Performance (verde)

Visual:
- Termometro visual (reutilizar conceito do DiagnosticoTermometro)
- RadarChart do Recharts com 5 eixos (Processo, Conversao, Gestao Leads, Metas, CRM)
- Badge do nivel com cor correspondente

### Aba 6 -- Plano de Acao

Gerado automaticamente com base nos dados das abas anteriores.

Secoes:
- **Metas calculadas**: Leads/dia, Leads/semana, Vendas/semana, Valor/semana
- **Estrategia de abordagem**: Texto gerado baseado no tipo de venda e canais selecionados
- **Sugestoes**: Lista de acoes recomendadas baseadas nos insights da aba 3

3 botoes de integracao:
- "Criar Scripts Automaticamente" -> navega para `/cliente/scripts` com toast
- "Gerar Playbook" -> navega para `/cliente/scripts` com toast
- "Atualizar Metas no CRM" -> navega para `/cliente/crm` com toast

Card resumo com todos os dados consolidados do plano.

---

## Secao Tecnica

### Arquivos modificados

```
src/pages/cliente/ClientePlanoVendas.tsx  -- reescrever completamente com 6 abas
src/data/clienteData.ts                   -- expandir getPlanoVendasData() com dados completos
```

### Estado do componente

Todos os campos gerenciados por um unico useState com objeto:

```
interface PlanoVendasState {
  // Aba 1
  periodo: "mensal" | "trimestral" | "semestral" | "anual";
  receitaAtual: number;
  receitaDesejada: number;
  mercado: string;
  tipoVenda: "B2B" | "B2C" | "Hibrido";
  // Aba 2
  metaFaturamento: number;
  ticketMedio: number;
  conversaoVenda: number;
  conversaoProposta: number;
  // Aba 3
  vendedores: number;
  canais: string[];
  ferramentas: string[];
  tempoFechamento: number;
  processoEstruturado: boolean;
  // Aba 4
  concorrentes: string[];
  diferenciais: string;
  posicionamento: string;
  saturacao: number;
  // Aba 5
  respostasDiagnostico: number[];
}
```

### Calculos derivados (useMemo)

```
vendasNecessarias = metaFaturamento / ticketMedio
propostasNecessarias = vendasNecessarias / (conversaoVenda / 100)
leadsNecessarios = propostasNecessarias / (conversaoProposta / 100)
contatosNecessarios = leadsNecessarios * 1.5
metaDiaria = metaFaturamento / 22
metaSemanal = metaFaturamento / 4
leadsDiarios = leadsNecessarios / 22
scoreMaturidade = media(respostasDiagnostico) / 5 * 100
```

### Componentes utilizados

- Tabs/TabsList/TabsTrigger/TabsContent (Radix)
- Input, Select, Switch, Slider, Textarea, Checkbox (UI)
- KpiCard, PageHeader, SectionHeader (projeto)
- AreaChart, BarChart, RadarChart (Recharts)
- Progress (barra de progresso do plano)
- Badge, Card, Button (UI)

### Funil visual (Aba 2)

4 barras horizontais com largura proporcional:
- Contatos (100% largura, cor cinza)
- Leads (proporcional, cor amarela)
- Propostas (proporcional, cor laranja)
- Vendas (proporcional, cor verde)

Cada barra com label e valor numerico.

### Dados expandidos em clienteData.ts

Expandir `getPlanoVendasData()` para retornar defaults completos para todas as abas, incluindo valores iniciais para diagnostico, mercado, estrutura comercial.

### Ordem de implementacao

1. Expandir `getPlanoVendasData()` em `clienteData.ts`
2. Reescrever `ClientePlanoVendas.tsx` com as 6 abas completas



# Prospeccao com Historico + Diagnostico Termometro Estrategico

## Resumo

Duas melhorias no fluxo comercial do franqueado:

1. **Prospeccao IA -- Aba Historico**: Salvar planos e scripts gerados em lista persistente com visualizacao
2. **Diagnostico -- Termometro de Maturidade**: Redesenhar resultado com 4 niveis (Caotico, Reativo, Estruturado, Analitico), grafico radar por area, estrategia em 3 fases (Estruturacao, Coleta de Dados, Escala), e conexao com a calculadora de propostas

---

## 1. Prospeccao IA -- Historico

### O que muda

Adicionar uma terceira aba "Historico" na pagina de Prospeccao IA:

- **Aba Planejamento**: igual ao atual
- **Aba Script Comercial**: igual ao atual
- **Aba Historico** (nova): lista de prospeccoes salvas

Ao gerar um plano ou script, um botao "Salvar no Historico" adiciona o resultado na lista com:
- Data de criacao
- Tipo (Plano ou Script)
- Parametros usados (regiao/nicho ou perfil/canal)
- Preview resumido do conteudo
- Opcao de expandir para ver detalhes completos

Estado gerenciado via useState com lista acumulativa (persiste na sessao).

### Mudancas tecnicas

```text
src/pages/franqueado/FranqueadoProspeccaoIA.tsx
```

- Adicionar estado: `const [historico, setHistorico] = useState<ProspeccaoHistorico[]>([])`
- Interface `ProspeccaoHistorico { id, tipo, data, params, conteudo }`
- TabsList de 2 para 3 colunas
- Nova TabsContent "historico" com lista de cards expansiveis
- Botao "Salvar no Historico" apos gerar plano/script

---

## 2. Diagnostico -- Termometro de Maturidade

### Conceito estrategico

O diagnostico e a ferramenta de venda mais importante: oferecemos uma estrategia gratuita que mostra ao cliente exatamente onde ele esta e o que precisa fazer. O resultado precisa ser visualmente impactante e estrategicamente solido.

### 4 Niveis de Maturidade (conforme imagem de referencia)

Em vez dos 3 niveis atuais (Inicial/Intermediario/Avancado), usar 4 niveis com identidade visual forte:

| Pontuacao | Nivel | Cor | Descricao |
|-----------|-------|-----|-----------|
| 0-25% | 01 CAOTICO | Vermelho escuro | Tudo e feito no improviso |
| 26-50% | 02 REATIVO | Vermelho/Laranja | Acoes pontuais sem continuidade |
| 51-75% | 03 ESTRUTURADO | Amarelo/Verde | Tem base, falta otimizacao |
| 76-100% | 04 ANALITICO | Verde | Sabe o que da resultado, falta escala |

Cada nivel tem:
- Sinais comuns (bullets descritivos)
- Problema principal identificado

### Termometro Visual

Componente visual com gradiente horizontal (vermelho -> amarelo -> verde) e ponteiro indicando a posicao exata da pontuacao. Abaixo, os 4 niveis com marcadores verticais.

### Grafico Radar (Spider Chart)

Usar RadarChart do Recharts para mostrar pontuacao por bloco:
- Marketing
- Comercial
- Receita
- Objetivos

Visualizacao clara de onde estao os gaps (areas com pontuacao baixa ficam evidentes).

### Estrategia em 3 Fases (conforme imagem de referencia)

Substituir as recomendacoes genericas por 3 fases estrategicas adaptadas ao nivel:

**Fase 01 -- ESTRUTURACAO**
- Diagnostico completo do funil de vendas e comunicacao
- Mapeamento de produto e jornada de compra
- Criacao/revisao de identidade de marca e presenca digital
- Linha editorial estrategica e calendario de conteudo
- Implantacao tecnica de canais digitais
- Padronizacao de processos comerciais
- Criacao e integracao de CRM
- Treinamento da equipe comercial

**Fase 02 -- COLETA DE DADOS**
- Campanhas de trafego pago (Meta + Google + LinkedIn)
- Criacao de dashboards e relatorios
- Otimizacao de funil e jornada
- Testes A/B continuos
- Calculo e padronizacao de indicadores financeiros
- Implementacao de benchmark interno
- Criacao de plano de retencao e recompra

**Fase 03 -- ESCALA**
- Planejamento de escala e redistribuicao de midia
- Criacao e otimizacao de estrategias de monetizacao
- Fluxos de remarketing e reativacao
- Retencao e aumento de LTV
- Expansao comercial e treinamento de escala
- Implementacao de growth loops

As fases mostradas dependem do nivel:
- Caotico: destaque na Fase 1 (precisa estruturar tudo)
- Reativo: Fases 1 e 2 (estruturar + comecar a medir)
- Estruturado: Fases 2 e 3 (medir + escalar)
- Analitico: Fase 3 (escalar)

### Entregas recomendadas vinculadas a servicos

As entregas recomendadas ja existentes serao mantidas, mas com uma conexao mais clara com os servicos da calculadora. O botao "Gerar Proposta" navegara para a calculadora com query params indicando o nivel, para facilitar a selecao de servicos.

### Projecao de resultados

Manter a tabela de projecao (1, 3, 6, 12 meses) mas adaptar os valores conforme o nivel do termometro.

---

## Secao Tecnica

### Arquivos modificados

```text
src/pages/franqueado/FranqueadoProspeccaoIA.tsx
  - Adicionar aba Historico (3a aba)
  - Estado para lista de prospeccoes salvas
  - Botao salvar apos gerar plano/script

src/pages/franqueado/FranqueadoDiagnostico.tsx
  - Mudar de 3 niveis para 4 (Caotico/Reativo/Estruturado/Analitico)
  - Adicionar componente termometro visual com gradiente
  - Adicionar RadarChart do Recharts por bloco
  - Redesenhar resultado com fases estrategicas

src/components/diagnostico/DiagnosticoEstrategia.tsx
  - Reescrever com 3 fases (Estruturacao/Coleta de Dados/Escala)
  - Mostrar fases relevantes conforme nivel
  - Cards visuais para cada fase com bullets
  - Manter projecao e entregas adaptadas ao nivel
```

### Dados do termometro (4 niveis)

```text
getNivelTermometro(pontuacao):
  0-25  -> { id: 1, label: "Caotico",      cor: "#dc2626", desc: "Tudo e feito no improviso" }
  26-50 -> { id: 2, label: "Reativo",       cor: "#ea580c", desc: "Acoes pontuais sem continuidade" }
  51-75 -> { id: 3, label: "Estruturado",   cor: "#eab308", desc: "Tem base, falta otimizacao" }
  76-100-> { id: 4, label: "Analitico",     cor: "#16a34a", desc: "Sabe o que da resultado, falta escala" }
```

### Sinais comuns por nivel

Cada nivel tera uma lista de sinais comuns e problema principal exibidos no resultado, conforme a imagem de referencia.

### Grafico Radar

Usar `RadarChart`, `PolarGrid`, `PolarAngleAxis`, `Radar` do Recharts (ja instalado):

```text
data = blocos.map(bloco => ({
  area: bloco,
  pontuacao: calcularPontuacao(respostas, perguntasDoBloco),
  fullMark: 100
}))
```

### Ordem de implementacao

1. Prospeccao IA -- adicionar aba Historico e logica de salvar
2. Diagnostico -- refatorar niveis para 4 com termometro visual
3. Diagnostico -- adicionar RadarChart por area
4. DiagnosticoEstrategia -- reescrever com 3 fases estrategicas
5. Conectar botao "Gerar Proposta" com nivel do diagnostico


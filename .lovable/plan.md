
# Reestruturacao do Modulo Comercial (Franqueado)

## Resumo

Reorganizar a secao "Comercial AI" na sidebar para a ordem correta e renomear itens, depois reescrever completamente os 4 modulos: CRM de Vendas (nucleo com indicadores de vinculacao), Prospeccao IA (planejamento + scripts), Diagnostico NOE (questionario estruturado com calculo de maturidade), e Gerador de Proposta (estrategia + calculadora).

---

## Mudancas

### 1. Sidebar (`src/components/FranqueadoSidebar.tsx`)

Reordenar e renomear a secao "Comercial AI" para "Comercial":

```text
ANTES:                              DEPOIS:
- Prospeccao IA                     - CRM de Vendas
- Diagnostico Maiar                 - Prospeccao IA
- Gerador de Propostas              - Diagnostico NOE
- CRM de Vendas                     - Gerador de Proposta
```

Rotas permanecem as mesmas.

### 2. CRM de Vendas (`src/pages/franqueado/FranqueadoCRM.tsx`) -- Rewrite

O CRM ja existe e funciona. As mudancas sao:

**No Kanban (cards de lead):**
- Adicionar indicadores visuais de vinculacao em cada card:
  - Icone check verde: "Diagnostico feito"
  - Icone check azul: "Proposta gerada"
  - Icone check laranja: "Proposta aceita"
  - Icone check roxo: "Contrato ativo"
- Manter botoes existentes de "Gerar Proposta" (Sheet) e "Converter em Contrato" (Dialog)

**No detalhe do lead:**
- Adicionar secao "Historico do Lead" com timeline visual mostrando:
  - Data de criacao
  - Diagnostico NOE (se vinculado) com link para ver
  - Proposta (se vinculada) com link para ver
  - Contrato (se convertido)
- Adicionar campo `notas` editavel (textarea)
- Adicionar secao "Tarefas" (lista simples com checkbox, titulo, data)
- Adicionar botao "Iniciar Diagnostico NOE" que navega para `/franqueado/diagnostico?leadId=X`

**Dados (`franqueadoData.ts`):**
- Adicionar campo `diagnosticoId?: string` na interface `FranqueadoLead`
- Adicionar campo `contratoId?: string` na interface `FranqueadoLead`
- Vincular leads mock: L-7 (Marcos Silva) com diagnosticoId e contratoId

### 3. Prospeccao IA (`src/pages/franqueado/FranqueadoProspeccaoIA.tsx`) -- Rewrite

Substituir o gerador de mensagens simples por duas abas:

**Aba A: Planejamento de Prospeccao**
- Formulario com campos: Regiao, Nicho, Meta mensal, Produto foco, Ticket medio desejado, Tipo de abordagem
- Botao "Gerar Plano" que retorna (mock): ideias de prospeccao, plano de acao, canais recomendados, abordagens sugeridas
- Botao "Criar Lead no CRM" que navega para `/franqueado/crm` (ou abre sheet inline)

**Aba B: Script Comercial**
- Formulario com campos: Perfil do cliente, Objecoes comuns, Canal de contato
- Botao "Gerar Script" que retorna (mock): script inicial, perguntas estrategicas, quebra de objecoes, CTA final
- Botao "Copiar" e "Salvar vinculado ao lead" (select de leads existentes)

### 4. Diagnostico NOE (`src/pages/franqueado/FranqueadoDiagnostico.tsx`) -- Rewrite

Renomear de "Diagnostico Maiar" para "Diagnostico NOE". Reestruturar completamente:

**Questionario expandido em 4 blocos:**

Bloco Marketing:
- Investimento atual em marketing (faixa de valor)
- Canais ativos (multiselect)
- Volume de leads mensal (faixa)
- CAC estimado (faixa de valor)

Bloco Comercial:
- Processo de vendas estruturado? (sim/nao)
- Taxa de conversao estimada (%)
- Tamanho da equipe comercial (numero)
- Estrutura de atendimento (opcoes)

Bloco Receita:
- Receita mensal atual (faixa)
- Ticket medio (faixa)
- Quantidade de clientes ativos (faixa)
- Time interno (numero)

Bloco Objetivos:
- Meta de crescimento (%)
- Prazo para atingir meta (meses)
- Meta de faturamento (valor)

**Calculo de maturidade:**
- Sistema pontua cada resposta (peso por bloco)
- Gera nivel: Inicial (0-40%), Intermediario (41-70%), Avancado (71-100%)
- Exibe barra de progresso colorida e label do nivel

**Resultado do Diagnostico:**
- Card com pontuacao, nivel de maturidade, badge colorido
- Lista de principais gargalos identificados (gerados automaticamente com base nas respostas fracas)
- Recomendacoes estrategicas (3-5 bullet points mock)
- Botao "Exportar PDF"
- Botao "Gerar Proposta" que navega para `/franqueado/propostas?leadId=X&diagnosticoId=Y`
- Diagnostico fica salvo e vinculado ao lead

**Aceita query param `?leadId=X`:**
- Pre-preenche nome e empresa do lead
- Vincula automaticamente ao retornar

### 5. Gerador de Proposta (`src/pages/franqueado/FranqueadoPropostas.tsx`) -- Rewrite

Reestruturar em duas abas dentro da mesma pagina:

**Aba A: Estrategia**
- Se diagnosticoId presente via query param, carrega dados do diagnostico
- Exibe apresentacao executiva com:
  - Objetivos identificados (do diagnostico)
  - Plano de acao recomendado (mock, 3-5 itens)
  - Projecao de resultados (mini tabela: mes 1/3/6/12)
  - Justificativa tecnica (texto mock)
- Visual tipo apresentacao com cards separados por secao

**Aba B: Calculadora (ja existe parcialmente no drawer do CRM)**
- Campos: Entregas selecionadas (checkboxes: Marketing Digital, SEO, Trafego Pago, Gestao de Redes, CRM, Branding, Consultoria)
- Valor base (calculado ou editavel)
- Excedente
- Recorrencia (mensal/trimestral/semestral/anual)
- Prazo
- Emissor da cobranca
- Calculo automatico:
  - Valor total
  - Repasse 20%
  - Projecao da unidade
  - Impacto financeiro estimado (12 meses)

**Botao "Gerar Proposta":**
- Cria proposta na lista
- Toast de sucesso
- Opcao de "Converter em Contrato" na mesma tela (para propostas aceitas)

**Lista de propostas existentes permanece abaixo** (tabela atual)

### 6. Dados (`src/data/franqueadoData.ts`)

Mudancas na camada de dados:

- Adicionar `diagnosticoId?: string` e `contratoId?: string` em `FranqueadoLead`
- Adicionar interface `FranqueadoDiagnosticoNOE` com campos: id, leadId, leadNome, empresa, blocos (marketing, comercial, receita, objetivos), pontuacao, nivel, gargalos, recomendacoes, criadoEm
- Adicionar funcao `getDiagnosticosNOE()` com 2 diagnosticos mock vinculados a leads existentes
- Atualizar `getDiagnosticoPerguntas()` para retornar os 4 blocos novos (Marketing, Comercial, Receita, Objetivos) com as perguntas especificadas
- Vincular lead L-7 com diagnosticoId e contratoId nos dados mock

---

## Arquivos Modificados

```text
src/components/FranqueadoSidebar.tsx               -- reordenar secao Comercial
src/data/franqueadoData.ts                         -- novos campos, interface DiagnosticoNOE, perguntas expandidas
src/pages/franqueado/FranqueadoCRM.tsx              -- indicadores visuais, historico, tarefas no detalhe
src/pages/franqueado/FranqueadoProspeccaoIA.tsx     -- rewrite: 2 abas (Planejamento + Script)
src/pages/franqueado/FranqueadoDiagnostico.tsx      -- rewrite: NOE com 4 blocos, maturidade, gargalos
src/pages/franqueado/FranqueadoPropostas.tsx        -- rewrite: 2 abas (Estrategia + Calculadora) + lista
```

## Ordem de Implementacao

1. `FranqueadoSidebar.tsx` -- reordenar e renomear
2. `franqueadoData.ts` -- novos campos e dados
3. `FranqueadoCRM.tsx` -- indicadores e historico
4. `FranqueadoProspeccaoIA.tsx` -- planejamento + script
5. `FranqueadoDiagnostico.tsx` -- NOE completo
6. `FranqueadoPropostas.tsx` -- estrategia + calculadora

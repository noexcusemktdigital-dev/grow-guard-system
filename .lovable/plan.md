
# Ajustes no Modulo Financeiro

## Resumo

Tres alteracoes principais:
1. **Receitas**: Remover aba "Clientes". Adicionar CRUD completo (adicionar, editar, excluir) em cada aba de produto (Assessoria, SaaS, Sistema, Venda de Franquia).
2. **Dashboard**: Remover toda a secao de Simulacao/Projecao (Bloco B inteiro com sliders, tabela de projecao e graficos).
3. **Fechamentos (DRE)**: Corrigir a logica de repasse — 20% vai para o franqueado (receita dele), 80% fica com a franqueadora. O documento DRE deve parecer uma planilha profissional que o franqueado baixa em PDF/Excel.

---

## 1. Receitas — Remover aba Clientes + CRUD por produto

### Remover
- Remover a tab "Clientes" do TabsList e o TabsContent correspondente
- Remover o componente `ClientesTab` inteiro (linhas 278-493)

### Adicionar CRUD em cada aba
Cada aba (Assessoria, SaaS, Sistema, Venda de Franquia) tera:
- Botao "+ Nova Receita" no topo
- Botoes de Editar (icone lapiz) e Excluir (icone lixeira) em cada linha
- Dialog/modal para criar e editar receita com campos relevantes ao produto
- Campos do modal variam por produto:
  - **Assessoria/SaaS**: Cliente, Valor, Origem, Status (A Receber/Recebido/Atrasado), NF emitida, Gera repasse, % repasse, Observacoes
  - **Sistema**: Franqueado, Valor (R$250), Status pagamento
  - **Venda de Franquia**: Franqueado, Valor, Status pagamento, Contrato, Data, Onboarding

### Visao Geral
- Permanece somente leitura (dashboard de receita), sem CRUD

---

## 2. Dashboard — Remover Simulacao

Remover tudo a partir da linha 238 (`BLOCO B — PROJECAO INTELIGENTE`):
- O separador, titulo "Projecao Inteligente" e o componente `<ProjecaoInteligente />`
- Remover a funcao `ProjecaoInteligente` inteira (linhas 250-409)
- Remover imports nao utilizados (`Slider`)
- Remover chamadas a `getProjection`, `getBreakEven` que fiquem sem uso

O Dashboard ficara apenas com o Bloco A (Resumo: KPIs, graficos, alertas, top clientes, parcelas).

---

## 3. Fechamentos (DRE) — Corrigir logica de repasse

### Regra de negocio corrigida
- Receita bruta do franqueado = soma dos clientes dele
- O franqueado recebe 20% da receita dos clientes dele (esse e o repasse PARA o franqueado)
- A franqueadora fica com 80%
- Deducoes do franqueado: royalties 1%, imposto proporcional, sistema R$250
- Resultado liquido do franqueado = (20% da receita bruta) - royalties - imposto proporcional - sistema

### Atualizar `getDREFranqueado` em mockData.ts
- `repasseFranqueado = receitaBruta * 0.20` (o que o franqueado recebe)
- `retencaoFranqueadora = receitaBruta * 0.80` (o que fica com a matriz)
- Resultado liquido do franqueado = repasseFranqueado - royalties - impostoProporcional - sistema

### Atualizar interface `DREFranqueado`
- Renomear `repasseMatriz` para `retencaoFranqueadora` (80%)
- Adicionar campo `repasseFranqueado` (20%)

### Atualizar visual do DRECard
- Formato de planilha profissional com:
  - Cabecalho: Logo Skillzy + nome franqueado + competencia
  - Linha: Receita Bruta (100%)
  - Linha: (-) Retencao Franqueadora (80%)
  - Linha: = Repasse Franqueado (20%)
  - Linha: (-) Royalties (1%)
  - Linha: (-) Imposto proporcional
  - Linha: (-) Sistema (R$250)
  - Linha: = **Resultado Liquido do Franqueado**
- Bordas e fundo alternado para parecer planilha
- Botoes Excel e PDF mantidos

---

## Detalhes Tecnicos

### Arquivos modificados

```text
src/pages/FinanceiroReceitas.tsx   -- remover ClientesTab, adicionar CRUD nas abas de produto
src/pages/FinanceiroDashboard.tsx  -- remover Bloco B (Projecao Inteligente) e imports relacionados
src/pages/FinanceiroFechamentos.tsx -- corrigir DRE com 80/20 e layout planilha
src/data/mockData.ts               -- corrigir getDREFranqueado com logica 80/20
```

### Ordem de implementacao
1. mockData.ts (corrigir DRE 80/20)
2. FinanceiroFechamentos.tsx (novo layout planilha + logica corrigida)
3. FinanceiroDashboard.tsx (remover simulacao)
4. FinanceiroReceitas.tsx (remover Clientes, CRUD por aba)

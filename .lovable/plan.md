

# Fluxo Integrado CRM → Proposta → Contrato → Financeiro → DRE

## Resumo

Implementar o fluxo operacional completo onde o franqueado nunca sai do contexto desnecessariamente. Cada etapa alimenta a seguinte automaticamente com feedback visual.

## Arquivos Modificados

```text
src/data/franqueadoData.ts                        -- adicionar campos de vinculacao (leadId nas propostas, propostaConvertida nos leads)
src/pages/franqueado/FranqueadoCRM.tsx             -- adicionar drawer "Gerar Proposta" + modal "Converter em Contrato" no kanban
src/pages/franqueado/FranqueadoPropostas.tsx       -- adicionar botao "Converter em Contrato" nas propostas aceitas + modal
src/pages/franqueado/FranqueadoContratos.tsx       -- receber navegacao com highlight do contrato recem-criado
src/pages/franqueado/FranqueadoFinanceiro.tsx      -- adicionar modal de visualizacao do fechamento DRE
src/pages/franqueado/FranqueadoDashboard.tsx       -- pequeno ajuste: mostrar indicador de novo contrato/impacto estimado
```

---

## Detalhes por Arquivo

### 1. `franqueadoData.ts` -- Vinculos entre modulos

Adicionar campo `leadId` na interface `FranqueadoProposta` (opcional, para vincular ao lead de origem).
Nos dados mock, vincular P-1 ao lead L-1 (Carlos Mendes) e P-3 ao lead L-7 (Marcos Silva).

### 2. `FranqueadoCRM.tsx` -- Drawer + Modal integrados

**No card do kanban (etapa "Proposta"):**
- Adicionar botao vermelho "Gerar Proposta" que abre um **Sheet** (drawer lateral direito, `sm:max-w-lg`)
- Drawer contem formulario: Valor Base, Excedente, Tipo (Recorrente/Unitario), Prazo, Quem emite cobranca
- Botao "Gerar Proposta" no drawer: salva no state local, fecha drawer, mostra toast "Proposta criada com sucesso", atualiza badge no card

**No card do kanban (etapa "Proposta" com proposta vinculada, ou etapa "Venda"):**
- Adicionar botao verde "Converter em Contrato" que abre um **Dialog** (modal central)
- Modal mostra resumo: Cliente, Valor Base, Excedente, Tipo, Data Inicio, Data Vencimento
- Botao "Criar Contrato" no modal: toast "Contrato ativado com sucesso", redireciona para `/franqueado/contratos`

**No detalhe do lead (view existente):**
- Se etapa === "Proposta": botao "Gerar Proposta" abrindo o mesmo drawer
- Se proposta aceita vinculada: botao "Converter em Contrato" abrindo o mesmo modal

### 3. `FranqueadoPropostas.tsx` -- Botao Converter

**No detalhe da proposta (quando status === "aceita"):**
- Adicionar botao "Converter em Contrato" que abre o mesmo Dialog de confirmacao
- Ao confirmar: toast + redirecionar para `/franqueado/contratos`

**Na tabela (coluna Acoes):**
- Para propostas aceitas: icone de conversao direto na linha

### 4. `FranqueadoContratos.tsx` -- Highlight + link financeiro

- Aceitar query param `?novo=CT-ID` para destacar visualmente o contrato recem-criado (borda primary pulsando)
- Adicionar botao "Ver impacto financeiro" no detalhe do contrato que navega para `/franqueado/financeiro`

### 5. `FranqueadoFinanceiro.tsx` -- Modal DRE

**Na aba Fechamentos:**
- Ao clicar "Visualizar" em uma linha: abre **Dialog** elegante com:
  - Receita total, Repasse, Excedente, Royalties, Sistema, Valor final
  - Mini comparativo vs mes anterior (texto, nao grafico complexo)
  - Botoes: Baixar PDF, Baixar Excel, Fechar
- Substituir os botoes de download por: botao "Visualizar" (abre modal) + botoes de download na propria linha

### 6. `FranqueadoDashboard.tsx` -- Indicador

- Na secao de KPIs ou logo apos "Hoje eu preciso de...": card simples que mostra "+1 novo contrato ativo" e "Impacto estimado no mes: R$ X" (mock estatico por enquanto)

---

## Componentes UI Utilizados

- **Sheet** (drawer lateral): ja disponivel em `src/components/ui/sheet.tsx` -- para formulario de proposta
- **Dialog**: ja disponivel em `src/components/ui/dialog.tsx` -- para confirmacao de contrato e visualizacao DRE
- **toast** (sonner): ja utilizado -- para feedback em todas as acoes

## Fluxo UX Resumido

```text
CRM Kanban
  └─ Card na etapa "Proposta"
       └─ [Gerar Proposta] → Sheet lateral (formulario)
            └─ [Gerar] → Toast + badge atualizado no card
                 └─ [Converter em Contrato] → Dialog central (resumo)
                      └─ [Criar Contrato] → Toast + navega /contratos (highlight)
                           └─ Financeiro recebe entrada automatica
                                └─ DRE → [Visualizar] → Dialog modal
```

Nenhuma navegacao forcada. Drawers e modais mantem o contexto. Toasts confirmam cada acao.


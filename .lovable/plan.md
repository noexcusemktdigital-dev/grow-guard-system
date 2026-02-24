

# Financeiro Completo + Meus Contratos com Criacao e Vinculacao CRM

## 1. Financeiro Unidade - Reformulacao Completa

O financeiro atual mostra apenas uma lista flat de receitas e despesas sem vinculacao com contratos. Vamos reformular em 3 abas:

### Aba "Resumo"
- KPIs: Receita Recorrente (contratos ativos), Total Receitas, Total Despesas, Resultado Liquido
- Lista de contratos ativos com valor mensal de cada um (puxando da tabela `contracts`)
- Grafico simples de receitas vs despesas dos ultimos 6 meses (recharts BarChart)

### Aba "Receitas e Despesas"
- Manter a tabela atual de receitas e despesas
- Adicionar botao para registrar nova receita e nova despesa (Dialog com formulario)
- Filtro por mes/periodo
- Coluna indicando se a receita esta vinculada a um contrato

### Aba "Fechamentos"
- Drive de arquivos de fechamento enviados pela franqueadora
- Organizado por mes/ano
- Franqueado pode visualizar e baixar os PDFs/documentos
- Utilizar um storage bucket `closing-files` para armazenar os arquivos
- Tabela `finance_closings` para registrar os metadados (mes, ano, arquivo_url, status)

### Mudancas no banco
- Criar tabela `finance_closings` com colunas: id, organization_id, unit_id, title, month, year, file_url, status, notes, created_at
- Criar bucket `closing-files` para armazenamento
- RLS: membros da org podem visualizar, admins podem inserir/gerenciar

---

## 2. Meus Contratos - Criacao Completa pelo Franqueado

A pagina atual e apenas uma tabela de visualizacao. Vamos transformar em um modulo completo de criacao e gestao.

### Mudancas no banco (tabela `contracts`)
Adicionar colunas para suportar dados completos do contrato:
- `lead_id` (uuid, nullable) - vinculo com CRM
- `client_document` (text) - CPF/CNPJ
- `client_phone` (text) - telefone
- `client_address` (text) - endereco
- `service_description` (text) - descricao dos servicos
- `monthly_value` (numeric) - valor mensal
- `total_value` (numeric) - valor total
- `duration_months` (integer) - duracao em meses
- `start_date` (date) - data inicio
- `end_date` (date) - data fim

### Novo layout com abas

**Aba "Contratos" (lista)**
- Tabela com todos os contratos: titulo, cliente, valor mensal, status, data inicio, vinculacao CRM
- Filtros por status (Rascunho, Ativo, Assinado, Cancelado)
- Badge indicando se esta vinculado a um lead do CRM
- Acoes: Editar, Baixar PDF, Vincular ao CRM

**Aba "Novo Contrato" (formulario completo)**
Formulario em secoes com todos os dados necessarios:

| Secao | Campos |
|-------|--------|
| Dados do Cliente | Nome, Email, CPF/CNPJ, Telefone, Endereco |
| Contratacao | Titulo do contrato, Descricao dos servicos, Template (se houver) |
| Valores | Valor mensal, Duracao (meses), Valor total (calculado), Data inicio, Data fim |
| Vinculacao | Selecionar lead do CRM (opcional), importar dados do lead automaticamente |

- Ao selecionar um lead do CRM, os campos de nome, email e telefone sao preenchidos automaticamente
- Botao "Salvar como Rascunho" e "Gerar Contrato"
- Contrato gerado pode ser baixado como PDF (usando html2pdf.js ja instalado)

### Download PDF
- Gerar PDF do contrato preenchido usando `html2pdf.js` (ja disponivel no projeto)
- Layout do PDF: cabecalho com dados da empresa, dados do cliente, servicos, valores, assinatura

### Vinculacao CRM
- Dropdown de leads do CRM para vincular contrato
- Ao vincular, o lead recebe indicador visual no Kanban
- Campo `lead_id` na tabela contracts faz o link

---

## Resumo de arquivos

| Arquivo | Acao |
|---------|------|
| Migracao SQL | Criar `finance_closings`, adicionar colunas em `contracts`, criar bucket `closing-files` |
| `src/pages/franqueado/FranqueadoFinanceiro.tsx` | Reescrever com 3 abas (Resumo, Receitas/Despesas, Fechamentos) |
| `src/pages/franqueado/FranqueadoContratos.tsx` | Reescrever com lista + formulario de criacao + download PDF + vinculacao CRM |
| `src/hooks/useContracts.ts` | Expandir mutations para suportar novos campos e lead_id |
| `src/hooks/useFinance.ts` | Adicionar hook `useFinanceClosings` |


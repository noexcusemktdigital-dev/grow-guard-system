
# Contatos dentro do CRM + Importacao CSV com Padrao de Planilha

## Resumo

Integrar os Contatos como uma aba dentro do CRM (em vez de pagina separada), transformar o botao "Novo Lead" em um menu com opcoes (criar lead ou importar planilha), e criar um sistema completo de importacao CSV com modelo padrao para download, preview com mapeamento de colunas e confirmacao antes de importar.

---

## 1. Contatos como aba dentro do CRM

Adicionar um estado `activeTab` (`"pipeline"` | `"contatos"`) no `ClienteCRM.tsx`. Um botao "Contatos" em destaque no header alterna para a visualizacao de contatos.

**Aba Contatos inclui:**
- Busca por nome, email, telefone, empresa
- Filtros em Popover (tags, origem, empresa)
- Lista de contatos com avatar, dados, badge de leads vinculados
- Criar/editar/excluir contatos (Dialog e Sheet)
- Botao "Criar Lead" a partir de um contato selecionado
- Importacao CSV de contatos

A logica atual do `ClienteContatos.tsx` sera absorvida pelo `ClienteCRM.tsx`.

---

## 2. Botao "Novo Lead" com Menu

Substituir o botao simples por um `DropdownMenu` com duas opcoes:
- **Criar Lead** -- abre o dialog `CrmNewLeadDialog`
- **Importar Planilha** -- abre dialog de importacao CSV de leads

---

## 3. Importacao CSV com Padrao de Planilha

### Modelo padrao de planilha

Gerar um CSV padrao com as colunas esperadas e uma linha de exemplo. O usuario pode baixar esse modelo clicando em "Baixar modelo".

**Colunas do modelo:**
```
nome,email,telefone,empresa,cargo,origem,tags,notas
João Silva,joao@email.com,11999999999,Empresa XYZ,Diretor,Indicação,"tag1, tag2",Observações aqui
```

O download e feito via `Blob` + `URL.createObjectURL` no frontend, sem necessidade de backend.

### Fluxo de importacao

1. **Botao "Baixar modelo"** -- gera e baixa o CSV padrao
2. **Upload do arquivo** -- usuario seleciona o CSV
3. **Preview com mapeamento** -- mostra uma tabela com as primeiras 5 linhas do CSV, mapeando automaticamente colunas reconhecidas (nome, name, email, telefone, phone, empresa, company, etc.)
4. **Confirmacao** -- mostra resumo: "X contatos serao importados" com os dados formatados
5. **Importar** -- executa a importacao em batch
6. **Resultado** -- mostra quantos foram importados com sucesso e quantos tiveram erro

### Dialog de importacao

Um Dialog dedicado `CrmCsvImportDialog` que encapsula todo o fluxo:
- Passo 1: Instrucoes + botao "Baixar modelo" + area de upload
- Passo 2: Preview dos dados com tabela (primeiras 5 linhas)
- Passo 3: Botao "Importar X contatos" com loading

---

## 4. Limpeza

- Remover item "Contatos" do `ClienteSidebar.tsx`
- Remover rota `/cliente/contatos` do `App.tsx`
- Deletar `src/pages/cliente/ClienteContatos.tsx` (funcionalidade movida para CRM)

---

## Arquivos a editar

| Acao | Arquivo |
|------|---------|
| Reescrever | `src/pages/cliente/ClienteCRM.tsx` -- adicionar aba contatos, menu no botao novo lead, dialog de importacao CSV |
| Editar | `src/components/ClienteSidebar.tsx` -- remover item "Contatos" |
| Editar | `src/App.tsx` -- remover rota `/cliente/contatos` |
| Deletar | `src/pages/cliente/ClienteContatos.tsx` |

## Detalhes Tecnicos

- O modelo CSV e gerado com `new Blob([csvContent], { type: "text/csv" })` e baixado via `<a>` temporario
- O mapeamento de colunas aceita nomes em portugues e ingles: nome/name, telefone/phone, empresa/company, cargo/position, origem/source
- O preview mostra uma mini-tabela HTML com as 5 primeiras linhas e destaca colunas reconhecidas em verde
- A importacao reutiliza `useCrmContactMutations().createContact` para cada linha
- O estado `activeTab` controla se o CRM mostra pipeline ou contatos; o header muda conforme a aba ativa
- Os filtros de contatos ficam em um Popover independente dos filtros de leads

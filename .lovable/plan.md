

# Modulo Contratos -- Administrativo

## Resumo

Criar o modulo completo de **Contratos** dentro do Administrativo com 4 paginas: **Gerenciamento**, **Gerador de Contratos**, **Templates** e **Configuracoes**. Ativar o item "Contratos" no sidebar (atualmente `disabled: true`) e adicionar submenus. Criar dados mock para contratos, templates e configuracoes.

---

## Estrutura do Menu

Contratos (submenu expandivel, mesmo padrao do Financeiro):
- Gerenciamento (icone `FileText`)
- Gerador de Contratos (icone `FilePlus`)
- Templates (icone `FileStack` ou `Copy`)
- Configuracoes (icone `Settings`)

---

## Arquivos a Criar

```text
src/pages/ContratosGerenciamento.tsx
src/pages/ContratosGerador.tsx
src/pages/ContratosTemplates.tsx
src/pages/ContratosConfiguracoes.tsx
src/data/contratosData.ts
```

## Arquivos a Modificar

```text
src/components/FranqueadoraSidebar.tsx  -- ativar Contratos com children
src/App.tsx                             -- adicionar 4 rotas
```

---

## 1. Dados Mock (`src/data/contratosData.ts`)

### Interfaces

```text
Contrato {
  id, numero, tipo ("Assessoria"|"SaaS"|"Sistema"|"Franquia"),
  dono ("Interno"|"Franqueado"|"Parceiro"),
  clienteNome, clienteDocumento, clienteEmail,
  franqueadoId?, franqueadoNome?,
  produto ("Assessoria"|"SaaS"|"Sistema"|"Franquia"),
  recorrencia ("Mensal"|"Anual"|"Unitaria"),
  valorMensal, valorTotal,
  dataInicio, dataFim,
  status ("Rascunho"|"Gerado"|"Enviado"|"Aguardando Assinatura"|"Assinado"|"Vencido"|"Cancelado"),
  templateId?,
  propostaVinculada?,
  arquivoUrl?,
  observacoes,
  criadoEm, atualizadoEm,
  // Asaas placeholders
  asaasCustomerId?, asaasSubscriptionId?, asaasInvoiceId?
}

ContratoTemplate {
  id, nome, tipo, descricao, conteudo (string com placeholders),
  placeholders (lista de variaveis),
  aprovado (boolean), criadoEm
}
```

### Dados iniciais
- 8-10 contratos mock com diferentes status
- 3-4 templates mock com placeholders como `{{cliente_nome}}`, `{{valor_mensal}}`, `{{data_inicio}}`, `{{produto}}`, `{{franqueado_nome}}`

---

## 2. Gerenciamento (`ContratosGerenciamento.tsx`)

### Visualizacoes
- **Tabs**: Kanban | Lista
- Toggle entre as duas visoes

### Kanban
- Colunas por status: Rascunho, Gerado, Enviado, Aguardando Assinatura, Assinado, Vencido, Cancelado
- Cards com: numero, cliente, produto, valor, data
- Cores distintas por coluna

### Lista (Tabela)
- Colunas: Numero, Cliente, Tipo, Produto, Valor, Status (badge colorido), Data Inicio, Data Fim, Acoes
- Acoes: Editar, Excluir, Ver detalhes

### Filtros (chips no topo)
- Status (multi-select)
- Dono: Interno / Franqueado / Parceiro
- Produto: Assessoria / SaaS / Sistema / Franquia
- Recorrencia: Mensal / Anual / Unitaria
- Periodo (mes)
- Cliente (texto)
- Franqueado (select)

### CRUD
- Dialog para criar/editar contrato com todos os campos
- Campo de upload/anexo do contrato assinado (input file, armazena nome -- placeholder para Storage futuro)
- Botao excluir com confirmacao

---

## 3. Gerador de Contratos (`ContratosGerador.tsx`)

### Wizard em 5 etapas (Stepper visual)

**Etapa 1 -- Tipo de Contrato**
- Selecionar: Assessoria, SaaS, Sistema, Franquia
- Selecionar template (filtrado por tipo)

**Etapa 2 -- Dono / Origem**
- Dono: Interno, Franqueado, Parceiro
- Se Franqueado/Parceiro: selecionar qual

**Etapa 3 -- Dados do Cliente**
- Nome, Documento (CPF/CNPJ), Email, Telefone
- Vincular cliente existente (select) ou criar novo

**Etapa 4 -- Dados da Contratacao**
- Produto, Recorrencia, Valor mensal, Valor total
- Data inicio, Data fim
- Vincular proposta (campo texto -- placeholder para modulo Propostas)
- Observacoes

**Etapa 5 -- Revisao e Geracao**
- Preview dos dados preenchidos
- Preview do template com variaveis substituidas
- Botoes: "Gerar Contrato" (cria registro com status "Gerado") e "Salvar Rascunho"
- Botoes placeholder: "Exportar PDF" e "Exportar DOCX" (toast "Em breve")

---

## 4. Templates (`ContratosTemplates.tsx`)

### Lista de Templates
- Cards com: nome, tipo, descricao, status (aprovado/rascunho), data criacao
- Botao "+ Novo Template"

### CRUD de Template
- Dialog com:
  - Nome
  - Tipo (Assessoria/SaaS/Sistema/Franquia)
  - Descricao
  - Conteudo (textarea grande com placeholders)
  - Aprovado? (toggle -- somente franqueadora pode aprovar)

### Painel de Placeholders
- Lista lateral com variaveis disponiveis:
  - `{{cliente_nome}}`, `{{cliente_documento}}`, `{{cliente_email}}`
  - `{{produto}}`, `{{valor_mensal}}`, `{{valor_total}}`
  - `{{recorrencia}}`, `{{data_inicio}}`, `{{data_fim}}`
  - `{{franqueado_nome}}`, `{{franqueado_unidade}}`
  - `{{numero_contrato}}`, `{{data_geracao}}`
- Clicar numa variavel copia para clipboard

---

## 5. Configuracoes (`ContratosConfiguracoes.tsx`)

### Campos editaveis
- Numeracao automatica: prefixo (ex: "CTR-") + sequencia
- Validade padrao de contrato (meses)
- Tipos de contrato habilitados
- Recorrencias habilitadas
- Texto padrao de observacao
- Campos Asaas (placeholders):
  - API Key Asaas (campo texto desabilitado com mensagem "Integracao futura")
  - Webhook URL (desabilitado)

---

## 6. Sidebar e Rotas

### FranqueadoraSidebar.tsx
Transformar "Contratos" de item simples `disabled: true` para item com children (mesmo padrao do Financeiro):

```text
{
  label: "Contratos", icon: FileText, path: "/franqueadora/contratos",
  children: [
    { label: "Gerenciamento", icon: FileText, path: "/franqueadora/contratos" },
    { label: "Gerador", icon: FilePlus, path: "/franqueadora/contratos/gerador" },
    { label: "Templates", icon: Copy, path: "/franqueadora/contratos/templates" },
    { label: "Configurações", icon: Settings, path: "/franqueadora/contratos/configuracoes" },
  ]
}
```

### App.tsx
Adicionar 4 rotas dentro do `<Route path="franqueadora">`:

```text
<Route path="contratos" element={<ContratosGerenciamento />} />
<Route path="contratos/gerador" element={<ContratosGerador />} />
<Route path="contratos/templates" element={<ContratosTemplates />} />
<Route path="contratos/configuracoes" element={<ContratosConfiguracoes />} />
```

---

## 7. Permissoes (preparacao visual)

- No topo de cada pagina, badge indicando perfil: "Franqueadora (acesso total)" ou "Franqueado (somente seus contratos)"
- Em Templates, franqueado so ve templates aprovados
- Em Gerador, franqueado so pode usar templates aprovados
- Nota: controle real de permissao sera implementado com autenticacao futura. Por ora, visao padrao e franqueadora.

---

## Ordem de implementacao

1. `contratosData.ts` (interfaces, mock data, helpers)
2. `ContratosGerenciamento.tsx` (Kanban + Lista + Filtros + CRUD)
3. `ContratosGerador.tsx` (Wizard 5 etapas)
4. `ContratosTemplates.tsx` (CRUD templates + placeholders)
5. `ContratosConfiguracoes.tsx` (campos de config)
6. `FranqueadoraSidebar.tsx` + `App.tsx` (menu e rotas)


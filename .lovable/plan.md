

# Modulo Unidades -- Cadastro e Gerenciamento de Franquias

## Resumo

Criar o modulo "Unidades" dentro da secao Rede do sidebar, substituindo o item "Franquias" (atualmente desabilitado). O modulo permite cadastro e gerenciamento administrativo das franquias com CRUD completo, sem CRM, onboarding ou metricas. Inclui 7 unidades reais pre-cadastradas.

---

## Arquivos

```text
CRIAR:
src/data/unidadesData.ts           -- tipos, interfaces, mock data (7 unidades reais)
src/pages/Unidades.tsx             -- pagina principal (lista) + detalhe com abas
src/components/unidades/UnidadesList.tsx        -- tabela de unidades + dialog nova unidade
src/components/unidades/UnidadeDados.tsx         -- aba Dados da Unidade (formulario)
src/components/unidades/UnidadeUsuarios.tsx      -- aba Usuarios (CRUD)
src/components/unidades/UnidadeDocumentos.tsx    -- aba Documentos (upload simulado)
src/components/unidades/UnidadeFinanceiro.tsx    -- aba Configuracao Financeira

MODIFICAR:
src/components/FranqueadoraSidebar.tsx  -- trocar "Franquias" por "Unidades", remover disabled, path /franqueadora/unidades
src/App.tsx                            -- adicionar rota /franqueadora/unidades
```

---

## 1. Dados (`src/data/unidadesData.ts`)

### Tipos

```text
UnidadeStatus = "Ativa" | "Suspensa" | "Encerrada"
UserRole = "Franqueado" | "Comercial" | "Atendimento" | "Performance" | "Criativo" | "Financeiro"
UserPermission = "Admin da Unidade" | "Operador" | "Somente leitura"
UserStatus = "Ativo" | "Inativo"
DocType = "Contrato de franquia" | "Documentos administrativos" | "Arquivos internos" | "Outros"
DocVisibility = "Somente Franqueadora" | "Ambos"

Unidade:
  id, nome, cidade, estado, responsavel, email, telefone,
  dataInicio, status, observacoes,
  repassePercent (20), royaltiesPercent (1), mensalidadeSistema (250),
  sistemaAtivo (bool), observacoesFinanceiras

UnidadeUser:
  id, unidadeId, nome, email, funcao (UserRole), permissao (UserPermission), status (UserStatus)

UnidadeDoc:
  id, unidadeId, tipo (DocType), nome, data, visibilidade (DocVisibility), observacao
```

### Mock Data -- 7 Unidades Reais

Todas com status Ativa, repasse 20%, royalties 1%, sistema R$250:

1. Curitiba
2. N3W Sao Paulo
3. Maringa -- Gabriel
4. Maringa -- Victor
5. Bauru -- Marcia
6. Batatais -- Alisson
7. Bahia -- Gregory

Cada unidade com 1-2 usuarios mock (pelo menos 1 Admin por unidade) e 1 documento mock (contrato de franquia).

---

## 2. Pagina Principal (`src/pages/Unidades.tsx`)

### Navegacao interna via state

- State `selectedUnidade`: null (lista) ou id da unidade (detalhe)
- Quando null: renderiza `UnidadesList`
- Quando selecionada: renderiza detalhe com 4 abas (Tabs do shadcn)

### Header

- Titulo "Unidades" com icone Building2
- Subtitulo: "Cadastro e gerenciamento das franquias da rede"
- Botao "Voltar" quando em detalhe

---

## 3. Lista de Unidades (`UnidadesList.tsx`)

### Topo

- Botao "Nova Unidade" (abre Dialog com formulario de criacao)

### Tabela

Colunas: Unidade, Cidade/Estado, Responsavel, Status (badge colorido), Usuarios ativos (count), Data de inicio, Botao "Gerenciar"

- Status cores: Ativa = verde, Suspensa = amarelo, Encerrada = vermelho
- Clicar "Gerenciar" seta selectedUnidade

### Dialog Nova Unidade

Formulario com todos os campos de Unidade (valores padrao: repasse 20%, royalties 1%, sistema 250, ativa).

---

## 4. Aba Dados da Unidade (`UnidadeDados.tsx`)

Formulario editavel com todos os campos:
- Nome, Cidade, Estado, Responsavel, Email, Telefone, Data inicio
- Status (Select: Ativa/Suspensa/Encerrada)
- Observacoes (Textarea)
- Botao Salvar (toast de confirmacao, atualiza state local)

---

## 5. Aba Usuarios (`UnidadeUsuarios.tsx`)

- Tabela com: Nome, Email, Funcao, Permissao, Status, Acoes (Editar/Remover)
- Botao "+ Novo Usuario" (Dialog)
- Dialog: Nome, Email, Funcao (Select com 6 opcoes), Permissao (Select com 3 opcoes), Status
- Validacao: impedir remover ultimo Admin (toast de erro)

---

## 6. Aba Documentos (`UnidadeDocumentos.tsx`)

- Lista de documentos com: Tipo (badge), Nome, Data, Visibilidade, Observacao, Acoes
- Botao "+ Novo Documento" (Dialog)
- Dialog: Tipo (Select), Nome (Input), Data, Upload (Input file simulado -- salva nome apenas), Observacao, Visibilidade (Select)
- Sem upload real (mock), apenas registra o nome do arquivo

---

## 7. Aba Configuracao Financeira (`UnidadeFinanceiro.tsx`)

Cards editaveis:
- % Repasse padrao (Input numerico, default 20)
- % Royalties (Input numerico, default 1)
- Mensalidade do Sistema (Input numerico, default 250)
- Sistema ativo (Switch)
- Observacoes financeiras (Textarea)
- Nota informativa: "Estas configuracoes alimentam automaticamente Repasse, DRE e Fechamentos do modulo Financeiro."
- Botao Salvar

---

## 8. Sidebar e Rotas

### FranqueadoraSidebar.tsx

Na secao `redeSection`, trocar o item "Franquias" (disabled) por:
```text
{ label: "Unidades", icon: Building2, path: "/franqueadora/unidades" }
```
(sem disabled)

### App.tsx

Adicionar rota dentro do bloco franqueadora:
```text
<Route path="unidades" element={<Unidades />} />
```

---

## 9. Design

- Seguir o padrao visual existente (cards, badges, tabelas com hover)
- Status com badges coloridos (verde/amarelo/vermelho)
- Abas usando componente Tabs do shadcn
- Formularios com Labels e Inputs padrao do projeto
- Dialogs com DialogHeader/Footer padrao
- Animacao fade-in nas transicoes lista/detalhe

---

## 10. Ordem de Implementacao

1. `unidadesData.ts` -- tipos + 7 unidades + usuarios + documentos mock
2. `UnidadesList.tsx` -- tabela + dialog nova unidade
3. `UnidadeDados.tsx` -- formulario de dados
4. `UnidadeUsuarios.tsx` -- CRUD usuarios
5. `UnidadeDocumentos.tsx` -- CRUD documentos
6. `UnidadeFinanceiro.tsx` -- config financeira
7. `Unidades.tsx` -- pagina hub com lista/detalhe + abas
8. `FranqueadoraSidebar.tsx` + `App.tsx` -- ativar menu e rota


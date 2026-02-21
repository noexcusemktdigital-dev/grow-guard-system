
# Modulo Comunicados -- Sistema Central de Avisos

## Resumo

Criar o modulo "Comunicados" dentro da secao Principal do sidebar. Sistema completo para criacao, segmentacao, programacao e rastreamento de comunicados da franqueadora para toda a rede. Inclui editor de comunicado, segmentacao por publico-alvo, opcoes de exibicao (dashboard, popup, confirmacao de leitura), rastreamento de visualizacoes e historico permanente.

---

## Arquivos

```text
CRIAR:
src/data/comunicadosData.ts                          -- tipos, mock data, helpers
src/pages/Comunicados.tsx                            -- pagina principal (lista + criar/editar + detalhe)
src/components/comunicados/ComunicadosList.tsx        -- lista de comunicados com filtros
src/components/comunicados/ComunicadoForm.tsx         -- formulario de criacao/edicao
src/components/comunicados/ComunicadoDetail.tsx       -- detalhe com rastreamento de leitura

MODIFICAR:
src/components/FranqueadoraSidebar.tsx  -- remover disabled do item "Comunicados"
src/App.tsx                            -- adicionar rota /franqueadora/comunicados
```

---

## 1. Dados (`src/data/comunicadosData.ts`)

### Tipos

```text
ComunicadoStatus = "Ativo" | "Programado" | "Expirado" | "Rascunho" | "Arquivado"

ComunicadoTipo = "Informativo" | "Atualizacao de sistema" | "Alerta operacional" | "Campanha" | "Institucional" | "Urgente"

ComunicadoPrioridade = "Normal" | "Alta" | "Critica"

PublicoAlvo = "Franqueadora" | "Franqueados" | "Clientes finais" | "Todos"

Comunicado:
  id, titulo, conteudo (texto rico simulado como string/html),
  imagemUrl?, linkExterno?, anexo?,
  publico (PublicoAlvo[]),
  unidadesEspecificas (string[] -- ids de unidades, vazio = todas),
  tipo (ComunicadoTipo),
  prioridade (ComunicadoPrioridade),
  mostrarDashboard (bool), mostrarPopup (bool),
  exigirConfirmacao (bool),
  dataProgramada?, dataExpiracao?,
  status (ComunicadoStatus),
  autorId, autorNome,
  criadoEm, atualizadoEm

ComunicadoVisualizacao:
  id, comunicadoId, usuarioId, usuarioNome,
  unidadeNome?,
  visualizadoEm, confirmadoEm?
```

### Mock Data

- 6-8 comunicados variados:
  - 1x "Critica" + popup + exigir confirmacao (alteracao de royalties)
  - 1x "Campanha" ativa (campanha da rede)
  - 1x "Atualizacao de sistema" ativa
  - 1x "Programado" (data futura)
  - 1x "Expirado"
  - 1x "Rascunho"
  - 1x "Institucional" ativo
  - 1x "Alerta operacional" prioridade Alta
- 10-15 visualizacoes mock distribuidas entre comunicados ativos
- Autores: "Davi", "Lucas", "Amanda"

### Helpers

- `getComunicadosByStatus(status)` -- filtra por status
- `getVisualizacoes(comunicadoId)` -- retorna visualizacoes
- `getStatusColor(status)` -- cor do badge
- `getPrioridadeColor(prioridade)` -- cor do badge
- `getTipoColor(tipo)` -- cor do badge

---

## 2. Pagina Principal (`src/pages/Comunicados.tsx`)

### Navegacao via state

- State `view`: "list" | "create" | "edit" | "detail"
- State `selectedComunicadoId`: null ou id

### Header

- Titulo "Comunicados" com icone Megaphone
- Badge "Franqueadora"
- Subtitulo: "Central de comunicados e avisos da rede"
- Botao "Voltar" quando em detail/create/edit
- Botao "+ Novo Comunicado" na lista

---

## 3. Lista de Comunicados (`src/components/comunicados/ComunicadosList.tsx`)

### Cards resumo no topo

4 cards:
- Comunicados ativos (count)
- Programados (count)
- Confirmacoes pendentes (count de comunicados que exigem confirmacao e nao tem 100%)
- Prioridade critica (count de ativos com prioridade critica)

### Filtros

- Publico (Select: Todos, Franqueadora, Franqueados, Clientes finais)
- Tipo (Select)
- Status (Select)
- Prioridade (Select)
- Busca por titulo (Input)

### Tabela

Colunas:
- Titulo
- Publico-alvo (badges)
- Tipo (badge colorido)
- Prioridade (badge)
- Status (badge)
- Data publicacao
- Autor
- Visualizacoes (numero)
- Acoes: Ver, Editar, Duplicar, Arquivar

### Indicadores visuais

- Prioridade Critica: badge vermelho
- Popup ativo: icone de popup
- Confirmacao exigida: icone de check
- Expirado: texto cinza

---

## 4. Formulario de Criacao/Edicao (`src/components/comunicados/ComunicadoForm.tsx`)

### Secao 1 -- Informacoes Basicas

- Titulo (Input, obrigatorio)
- Conteudo (Textarea grande, simulando editor rico)
- Imagem URL (Input, opcional)
- Link externo (Input, opcional)
- Anexo nome (Input, opcional -- placeholder)

### Secao 2 -- Publico-Alvo

- Multi-select com checkboxes:
  - Franqueadora (equipe interna)
  - Franqueados
  - Clientes finais
  - Todos (seleciona todos)
- Unidades especificas (multi-select com checkboxes das unidades mockUnidades, aparece se "Franqueados" selecionado)

### Secao 3 -- Classificacao

- Tipo (Select: Informativo, Atualizacao de sistema, Alerta operacional, Campanha, Institucional, Urgente)
- Prioridade (Select: Normal, Alta, Critica)
- Se "Critica": mostrar aviso "Comunicados criticos forcam popup ao login"

### Secao 4 -- Opcoes de Exibicao

Checkboxes:
- Mostrar no dashboard
- Mostrar como pop-up no login
- Exigir confirmacao de leitura
- Programar publicacao (se marcado, mostra Input date/time)
- Definir data de expiracao (se marcado, mostra Input date)

### Botoes

- "Publicar" (status Ativo)
- "Salvar Rascunho" (status Rascunho)
- "Cancelar"

---

## 5. Detalhe do Comunicado (`src/components/comunicados/ComunicadoDetail.tsx`)

### Layout

#### Secao Superior -- Conteudo

Card com:
- Titulo (grande)
- Badges: tipo, prioridade, status, publico
- Conteudo completo
- Imagem (se houver)
- Link externo (se houver)
- Anexo (se houver)
- Data publicacao, autor
- Flags: dashboard, popup, confirmacao

#### Secao Inferior -- Rastreamento

Tabela "Visualizacoes e Confirmacoes":
- Usuario
- Unidade
- Visualizado em (data/hora)
- Confirmado em (data/hora ou "Pendente")

Resumo:
- Total visualizacoes / total publico-alvo estimado
- % confirmacoes (se exigir confirmacao)

### Acoes

- Editar
- Duplicar (copia para novo com status Rascunho)
- Arquivar
- Excluir (dialog de confirmacao)

---

## 6. Sidebar e Rotas

### FranqueadoraSidebar.tsx

Na secao `principalSection`, remover `disabled: true` do item "Comunicados":
```text
{ label: "Comunicados", icon: Megaphone, path: "/franqueadora/comunicados" }
```

### App.tsx

Importar e adicionar rota:
```text
import Comunicados from "./pages/Comunicados";
<Route path="comunicados" element={<Comunicados />} />
```

---

## 7. Design

- Seguir padrao visual existente (cards, badges, tabelas, dialogs)
- Prioridade Critica: badge vermelho com pulse
- Tipo Urgente: badge vermelho
- Status Ativo: badge verde, Programado: badge azul, Expirado: badge cinza, Rascunho: badge amarelo
- Publico-alvo como badges multiplos
- Checkboxes de exibicao com icones ao lado
- Formulario em secoes com separadores visuais

---

## 8. Ordem de Implementacao

1. `comunicadosData.ts` -- tipos, mock comunicados (6-8), visualizacoes (10-15), helpers
2. `ComunicadosList.tsx` -- lista com filtros, tabela, cards resumo
3. `ComunicadoForm.tsx` -- formulario criacao/edicao com todas secoes
4. `ComunicadoDetail.tsx` -- detalhe com rastreamento
5. `Comunicados.tsx` -- pagina hub com navegacao por state
6. `FranqueadoraSidebar.tsx` + `App.tsx` -- ativar menu e rota

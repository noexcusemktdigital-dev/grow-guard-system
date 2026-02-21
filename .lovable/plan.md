

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

## 1. Dados (comunicadosData.ts)

### Tipos

- **ComunicadoStatus**: Ativo, Programado, Expirado, Rascunho, Arquivado
- **ComunicadoTipo**: Informativo, Atualizacao de sistema, Alerta operacional, Campanha, Institucional, Urgente
- **ComunicadoPrioridade**: Normal, Alta, Critica
- **PublicoAlvo**: Franqueadora, Franqueados, Clientes finais, Todos
- **Comunicado**: id, titulo, conteudo (HTML string), imagemUrl, linkExterno, anexo, publico (PublicoAlvo[]), unidadesEspecificas (string[]), tipo, prioridade, mostrarDashboard, mostrarPopup, exigirConfirmacao, dataProgramada, dataExpiracao, status, autorId, autorNome, criadoEm, atualizadoEm
- **ComunicadoVisualizacao**: id, comunicadoId, usuarioId, usuarioNome, unidadeNome, visualizadoEm, confirmadoEm

### Mock Data

- 8 comunicados variados cobrindo todos os tipos e status:
  - 1x Critica + popup + confirmacao (alteracao de royalties)
  - 1x Campanha ativa
  - 1x Atualizacao de sistema ativa
  - 1x Programado (data futura)
  - 1x Expirado
  - 1x Rascunho
  - 1x Institucional ativo
  - 1x Alerta operacional prioridade Alta
- 12-15 visualizacoes mock distribuidas entre comunicados ativos
- Autores: "Davi", "Lucas", "Amanda"

### Helpers

- `getComunicadosByStatus(status)` -- filtra por status
- `getVisualizacoes(comunicadoId)` -- retorna visualizacoes do comunicado
- `getStatusColor(status)` -- cor do badge por status
- `getPrioridadeColor(prioridade)` -- cor do badge por prioridade
- `getTipoColor(tipo)` -- cor do badge por tipo

---

## 2. Pagina Principal (Comunicados.tsx)

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

## 3. Lista de Comunicados (ComunicadosList.tsx)

### Cards resumo no topo (4 cards)

- Comunicados ativos (count)
- Programados (count)
- Confirmacoes pendentes (comunicados que exigem confirmacao sem 100%)
- Prioridade critica (count de ativos com prioridade critica)

### Filtros

- Publico (Select: Todos, Franqueadora, Franqueados, Clientes finais)
- Tipo (Select)
- Status (Select)
- Prioridade (Select)
- Busca por titulo (Input)

### Tabela

Colunas: Titulo, Publico-alvo (badges), Tipo (badge), Prioridade (badge), Status (badge), Data publicacao, Autor, Visualizacoes, Acoes (Ver, Editar, Duplicar, Arquivar)

### Indicadores visuais

- Prioridade Critica: badge vermelho com pulse
- Popup ativo: icone indicativo
- Confirmacao exigida: icone de check
- Expirado: texto cinza

---

## 4. Formulario de Criacao/Edicao (ComunicadoForm.tsx)

### Secao 1 -- Informacoes Basicas

- Titulo (Input obrigatorio)
- Conteudo (Textarea grande simulando editor rico)
- Imagem URL (Input opcional)
- Link externo (Input opcional)
- Anexo nome (Input opcional -- placeholder)

### Secao 2 -- Publico-Alvo

- Multi-select com checkboxes: Franqueadora, Franqueados, Clientes finais, Todos
- "Todos" seleciona todos automaticamente
- Unidades especificas: checkboxes das unidades (aparece se "Franqueados" selecionado)

### Secao 3 -- Classificacao

- Tipo (Select com os 6 tipos)
- Prioridade (Select: Normal, Alta, Critica)
- Se "Critica": aviso visual "Comunicados criticos forcam popup ao login"

### Secao 4 -- Opcoes de Exibicao

Checkboxes com icones:
- Mostrar no dashboard
- Mostrar como pop-up no login
- Exigir confirmacao de leitura
- Programar publicacao (revela Input date/time)
- Definir data de expiracao (revela Input date)

### Botoes

- "Publicar" (status Ativo)
- "Salvar Rascunho" (status Rascunho)
- "Cancelar"

---

## 5. Detalhe do Comunicado (ComunicadoDetail.tsx)

### Secao Superior -- Conteudo

Card com titulo grande, badges (tipo, prioridade, status, publico), conteudo completo, imagem, link externo, anexo, data publicacao, autor, flags de exibicao

### Secao Inferior -- Rastreamento

Tabela "Visualizacoes e Confirmacoes":
- Usuario, Unidade, Visualizado em, Confirmado em (ou "Pendente")
- Resumo: total visualizacoes / publico estimado, % confirmacoes

### Acoes

- Editar, Duplicar (copia como Rascunho), Arquivar, Excluir (dialog de confirmacao)

---

## 6. Sidebar e Rotas

### FranqueadoraSidebar.tsx

Remover `disabled: true` do item "Comunicados" na secao `principalSection`

### App.tsx

Adicionar rota: `<Route path="comunicados" element={<Comunicados />} />`

---

## 7. Design

- Seguir padrao visual existente do projeto (cards, badges, tabelas, dialogs)
- Status Ativo: badge verde, Programado: azul, Expirado: cinza, Rascunho: amarelo, Arquivado: cinza escuro
- Prioridade Critica: badge vermelho com pulse
- Tipo Urgente: badge vermelho
- Publico-alvo como badges multiplos lado a lado
- Formulario em secoes com separadores visuais e titulos de secao
- Checkboxes de exibicao com icones descritivos ao lado

---

## 8. Ordem de Implementacao

1. `comunicadosData.ts` -- tipos, mock comunicados (8), visualizacoes (12-15), helpers
2. `ComunicadosList.tsx` -- lista com filtros, tabela, cards resumo
3. `ComunicadoForm.tsx` -- formulario criacao/edicao com todas as 4 secoes
4. `ComunicadoDetail.tsx` -- detalhe com rastreamento
5. `Comunicados.tsx` -- pagina hub com navegacao por state
6. `FranqueadoraSidebar.tsx` + `App.tsx` -- ativar menu e rota


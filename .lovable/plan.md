

# Melhorar Visualizacao de Grupos vs Pessoas no Chat

## Problema Atual

O filtro que adicionamos esta removendo completamente os contatos de grupo da lista. Na verdade, o usuario quer **ver todos os contatos**, mas com uma diferenciacao visual clara entre:
- Conversas individuais (telefone simples como `554491416561`)
- Grupos (telefone no formato `554497402747-1515347495`)
- Contatos via LID (formato `148485642956928@lid`)

## Solucao

Em vez de filtrar/esconder os grupos, vamos **classificar** cada contato e exibir todos com indicadores visuais distintos.

### 1. Hook `useWhatsApp.ts` - Remover filtro, adicionar classificacao

- Remover o filtro que esconde grupos
- Adicionar um campo computado `contact_type` a cada contato: `"individual"`, `"group"` ou `"lid"`
- A deteccao usa o formato do telefone:
  - `@g.us` ou regex `^\d+-\d{10,}$` -> grupo
  - `@lid` -> contato via LID (link de anuncio)
  - Resto -> individual

### 2. `ChatContactList.tsx` - Indicadores visuais

- Icone de grupo (Users) no avatar para contatos tipo "group"
- Badge colorido "Grupo" ao lado do nome
- Adicionar filtro de modo "Grupos" nos pills existentes (junto com Todos/IA/Humano/Espera)

### 3. `ChatContactList.tsx` - Filtro por tipo

- Novo pill "Grupos" que filtra apenas conversas de grupo
- O filtro "Todos" continua mostrando tudo (individuais + grupos)

### 4. Webhook - Manter protecao no backend

- O webhook continua bloqueando mensagens de grupo para **nao processar** com o agente IA
- Porem, se o usuario quiser ver as mensagens de grupo no futuro, podemos adicionar uma flag para permitir

## Arquivos a modificar

| Arquivo | Alteracao |
|---------|-----------|
| `src/hooks/useWhatsApp.ts` | Remover filtro, adicionar `contact_type` computado |
| `src/components/cliente/ChatContactList.tsx` | Icone de grupo, badge, novo filtro pill |
| `src/pages/cliente/ClienteChat.tsx` | Passar `contact_type` se necessario |

## Detalhes Visuais

- Contato individual: avatar normal com iniciais
- Contato grupo: avatar com icone `Users` e borda roxa, badge "Grupo" pequeno
- Contato LID: avatar normal com badge "Anuncio"
- Na lista, grupos aparecem com fundo levemente diferente


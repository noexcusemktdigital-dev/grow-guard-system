

# Modulo Chat -- Hub de Comunicacao Comercial WhatsApp

## Resumo

Reconstruir completamente o modulo Chat, transformando-o de um chat interno simples em um hub de comunicacao tipo WhatsApp Web com 3 colunas (Contas, Conversas, Conversa Ativa), suporte a multiplos numeros WhatsApp conectados, integracao com CRM, gestao de atendentes e indicadores de IA/Humano. Tudo com dados mock simulando o fluxo real.

---

## Layout: 3 Colunas tipo WhatsApp Web

```text
+------------------+------------------------+----------------------------------+
|   CONTAS (Col1)  |   CONVERSAS (Col2)     |   CONVERSA ATIVA (Col3)          |
|                  |                        |                                  |
|  WA Comercial    |  Joao Silva        10m |  Header: nome + status + CRM     |
|  [conectado]     |  "Ola, quero saber..." |                                  |
|                  |                        |  [mensagens com bolhas]           |
|  WA Suporte      |  Maria Oliveira    25m |                                  |
|  [conectado]     |  "Obrigada pelo..."    |  Indicador: IA ou Humano         |
|                  |                        |                                  |
|  WA Pessoal      |  Carlos Mendes      1h |  [input + enviar + acoes]         |
|  [desconectado]  |  "Preciso de ajuda..." |                                  |
|                  |                        |  Painel lateral: info contato     |
|  + Conectar novo |                        |                                  |
+------------------+------------------------+----------------------------------+
```

---

## Detalhamento por Coluna

### Coluna 1 -- Contas WhatsApp (200px)

Lista vertical de numeros conectados:
- Icone de status (verde = conectado, cinza = desconectado)
- Nome personalizado do numero
- Contagem de mensagens nao lidas
- Ao clicar, filtra conversas da Coluna 2

Footer da coluna:
- Botao "+ Conectar WhatsApp" (abre dialog placeholder com badge "Integracao em breve")

Dados mock: 3 numeros (Comercial, Suporte, Pessoal)

### Coluna 2 -- Lista de Conversas (300px)

Filtrada pelo WhatsApp selecionado na Col1.

Cada conversa mostra:
- Avatar (iniciais)
- Nome do contato
- Ultima mensagem (truncada)
- Timestamp
- Badge de status: "IA" (roxo), "Humano" (verde), "Encerrado" (cinza), "Espera" (amarelo)
- Tag: "Lead" (azul), "Cliente" (verde), "Pos-venda" (laranja)
- Bolinha vermelha para mensagens nao lidas

No topo: barra de busca + filtro por status

### Coluna 3 -- Conversa Ativa (flex-1)

**Header:**
- Nome do contato + telefone
- Badge de atendimento (IA/Humano)
- Botoes: "Assumir" (se IA), "Devolver p/ IA", "Transferir", "Encerrar"
- Botao "Vincular ao CRM" ou badge "Lead - Proposta" se ja vinculado

**Area de mensagens:**
- Bolhas estilo WhatsApp (direita = enviado, esquerda = recebido)
- Mensagens de IA com icone de robo e fundo diferenciado (roxo/10)
- Mensagens de sistema ("Conversa assumida por Voce", "IA encerrou atendimento") centralizadas com fundo muted
- Timestamp em cada mensagem

**Footer:**
- Input de mensagem
- Botao enviar
- Botoes: Emoji (placeholder), Anexar (placeholder)

**Painel lateral direito (toggle):**
- Info do contato (nome, telefone, email)
- Se vinculado ao CRM: etapa do funil, responsavel, tarefas pendentes
- Se nao vinculado: botao "Criar Lead no CRM"

---

## Metricas Rapidas (Top Bar)

Barra acima do layout com 4 mini KPIs:
- Conversas ativas
- Tempo medio de resposta
- Conversas fechadas hoje
- Taxa de resposta

---

## Gestao de Atendentes

Status possiveis por conversa (gerenciado via state):
- "ia" -- Agente IA respondendo
- "humano" -- Atendente humano ativo
- "encerrado" -- Conversa finalizada
- "espera" -- Aguardando atendimento

Acoes:
- "Assumir conversa" muda status de "ia" para "humano"
- "Devolver p/ IA" muda de "humano" para "ia"
- "Encerrar" muda para "encerrado"
- "Transferir" abre select com lista de atendentes (mock)

---

## Agentes de IA no Chat

Cada conta WhatsApp pode ter um agente vinculado:
- SDR (para leads novos)
- Closer (para propostas)
- Suporte (para clientes ativos)
- Pos-venda

No header da conversa, quando IA ativa:
- Icone de robo + "Atendido por IA (SDR)"
- Quando humano: icone de pessoa + "Atendido por [Nome]"

Mensagens do agente IA tem visual diferenciado (borda roxa, icone de robo no avatar).

---

## Secao Tecnica

### Arquivos modificados

```
src/pages/cliente/ClienteChat.tsx   -- Reescrever completamente com layout 3 colunas
src/data/clienteData.ts              -- Expandir dados mock do chat com contas, conversas, mensagens, status
```

### Novos tipos em clienteData.ts

```typescript
interface WhatsAppAccount {
  id: string;
  name: string;
  phone: string;
  status: "connected" | "disconnected";
  agentType: "SDR" | "Closer" | "Suporte" | "Pos-venda" | null;
  unreadCount: number;
}

interface ChatConversation {
  id: string;
  accountId: string;
  contactName: string;
  contactPhone: string;
  contactEmail?: string;
  avatar: string;
  lastMessage: string;
  lastMessageTime: string;
  unread: number;
  attendanceStatus: "ia" | "humano" | "encerrado" | "espera";
  attendant?: string;
  tag: "Lead" | "Cliente" | "Pos-venda";
  crmLinked: boolean;
  crmStage?: string;
  crmResponsible?: string;
  messages: ChatMessage[];
}

interface ChatMessage {
  id: string;
  sender: "contact" | "user" | "ia" | "system";
  senderName: string;
  text: string;
  time: string;
  avatar?: string;
}
```

### Estado do componente (useState)

```
selectedAccount: string | "all"
selectedConversation: string | null
searchQuery: string
filterStatus: "all" | "ia" | "humano" | "espera" | "encerrado"
showContactPanel: boolean
conversations: ChatConversation[]  (para permitir mudanca de status)
messageInput: string
```

### Funcao de dados mock

`getChatData()` retornara:
- 3 contas WhatsApp
- 8-10 conversas distribuidas entre as contas
- Cada conversa com 3-6 mensagens (mix de contact, user, ia, system)
- Conversas em diferentes status (ia, humano, espera, encerrado)

### Componentes utilizados

- ScrollArea (listas e mensagens)
- Badge (status, tags)
- Button (acoes)
- Input (busca, mensagem)
- Card (containers)
- Dialog (conectar WhatsApp, transferir)
- Select (filtros)
- Tooltip (botoes de acao)

### Responsividade

Em mobile (< lg):
- Col1 e Col2 viram drawer/sheet lateral
- Col3 ocupa tela inteira
- Botao voltar para lista de conversas

### Ordem de implementacao

1. Expandir `clienteData.ts` com tipos e dados mock do chat
2. Reescrever `ClienteChat.tsx` com layout 3 colunas completo


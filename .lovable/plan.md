

# Agentes de IA -- Redesign Completo

## Resumo

Transformar a pagina "Agentes de IA" de uma simples lista de prompts em um painel de gestao de agentes inteligentes que se integram ao Chat e ao CRM. Cada agente sera configuravel, vinculavel a contas WhatsApp e com metricas de performance. Seguindo o padrao visual do Kivo (cards limpos, layout estruturado, badges de status).

---

## Nova Estrutura da Pagina

### Top: KPIs de Agentes
4 mini cards horizontais:
- Agentes ativos
- Conversas atendidas por IA (hoje)
- Taxa de resolucao IA
- Tempo medio de resposta IA

### Secao Principal: Grid de Agent Cards

Cada agente e um card grande e visual com:

```text
+---------------------------------------------------+
|  [icone tipo]    SDR - Qualificacao de Leads       |
|                  "Qualifica leads novos..."    [ON] |
|                                                     |
|  Vinculado a: WA Comercial                         |
|  Tags: Lead                                         |
|  Conversas hoje: 12  |  Resolvidas: 8  |  Taxa: 67%|
|                                                     |
|  [Configurar]  [Ver Conversas]  [Pausar]           |
+---------------------------------------------------+
```

### Agentes Disponiveis (4 tipos)

| Agente | Tipo | Descricao | Cor |
|--------|------|-----------|-----|
| SDR | Qualificacao | Aborda leads novos, qualifica e agenda | Azul |
| Closer | Fechamento | Envia propostas, quebra objecoes | Verde |
| Suporte | Atendimento | Responde duvidas de clientes ativos | Amarelo |
| Pos-venda | Retencao | Follow-up, NPS, reativacao | Laranja |

### Dialog de Configuracao do Agente

Ao clicar "Configurar", abre dialog com:
- Nome personalizado do agente
- Tom de voz: Select (Formal / Casual / Tecnico / Amigavel)
- Resposta automatica: Switch (On/Off)
- Vinculacao a conta WhatsApp: Select com contas conectadas
- Tags de atuacao: Checkboxes (Lead, Cliente, Pos-venda)
- Instrucoes personalizadas: Textarea (prompt base do agente)
- Horario de atuacao: Selects de hora inicio/fim

### Secao "Testar Agente"

Abaixo dos cards, secao expansivel (Collapsible):
- Selecionar agente
- Textarea para simular mensagem de cliente
- Botao "Simular Resposta"
- Area de resultado com visual de bolha de chat (igual ao Chat)
- Botao copiar resultado

---

## Secao Tecnica

### Arquivos modificados

```
src/pages/cliente/ClienteAgentesIA.tsx  -- Reescrever completamente
src/data/clienteData.ts                  -- Adicionar dados mock dos agentes
```

### Novos tipos em clienteData.ts

```typescript
interface IAAgent {
  id: string;
  type: "SDR" | "Closer" | "Suporte" | "Pos-venda";
  name: string;
  description: string;
  active: boolean;
  linkedAccountId: string | null;
  linkedAccountName: string | null;
  tags: string[];
  tone: "formal" | "casual" | "tecnico" | "amigavel";
  instructions: string;
  stats: {
    conversationsToday: number;
    resolved: number;
    avgResponseTime: string;
  };
}
```

### Estado do componente

```
agents: IAAgent[] (gerenciado via useState para toggle on/off)
configAgent: string | null (id do agente sendo configurado)
testAgent: string | null (id do agente sendo testado)
testInput: string
testResult: string
```

### Componentes utilizados

- KpiCard (metricas topo)
- Card (agent cards)
- Badge (status, tipo, tags)
- Switch (ativar/desativar agente)
- Dialog (configuracao)
- Select (tom de voz, conta WhatsApp)
- Textarea (instrucoes, teste)
- Collapsible (secao testar)
- Button, Input, Checkbox
- ScrollArea

### Integracao com Chat

Os dados de agentes serao referenciados pelo Chat -- o campo `agentType` das contas WhatsApp corresponde ao `type` do agente. Ao configurar vinculacao no dialog, atualiza-se o state local.

### Responsividade

- Desktop: grid 2 colunas de agent cards
- Mobile: stack vertical, dialog full-width

### Ordem de implementacao

1. Expandir `clienteData.ts` com tipos e dados mock dos agentes IA
2. Reescrever `ClienteAgentesIA.tsx` com layout completo


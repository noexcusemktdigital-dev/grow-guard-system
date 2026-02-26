

## Melhorias no Plano de Vendas, Relatorios, Chat e CRM

### 1. Plano de Vendas: icone de duvida em cada pergunta

**Arquivo**: `src/pages/cliente/ClientePlanoVendas.tsx`

- Adicionar um campo `helpText` em cada pergunta do array `salesSections`
- Na renderizacao de cada pergunta, exibir um icone `HelpCircle` ao lado do texto da pergunta
- Ao clicar/hover no icone, exibir um `Tooltip` com a explicacao contextual
- Exemplo: "Qual o segmento da sua empresa?" teria helpText "Identifique o setor principal de atuacao para personalizar as recomendacoes"
- O icone ja esta importado (linha 8: `HelpCircle`)

---

### 2. Relatorios mais completos

**Arquivo**: `src/pages/cliente/ClienteDashboard.tsx`

Adicionar metricas e graficos adicionais baseados nos dados ja disponiveis:

**Aba CRM:**
- Leads perdidos (count + motivos se disponiveis)
- Tempo medio de fechamento (diferenca entre `created_at` e `won_at`)
- Leads criados por periodo (grafico de linha com agrupamento por semana/mes)
- Valor total no pipeline (leads ativos)
- Taxa de perda (`lost / total`)

**Aba Chat:**
- Tempo medio de resposta (diferenca entre mensagem inbound e proxima outbound)
- Mensagens por dia (grafico de barras com ultimos 7/30 dias)
- Distribuicao por tipo de atendimento (IA vs humano)
- Contatos sem resposta (ultima msg inbound sem outbound)

**Aba Agentes IA:**
- Conversas por agente (grafico de barras)
- Taxa de handoff (quantas conversas foram transferidas para humano)
- Media de tokens por conversa

---

### 3. Chat: botao "Criar Lead" com destaque ao lado de "Assumir"

**Arquivo**: `src/components/cliente/ChatConversation.tsx`

- Mover o botao "Criar Lead" do painel colapsavel (linhas 364-367) para o header principal (linhas 285-331)
- Posicionar ao lado do botao "Assumir", mantendo visibilidade constante
- Usar `variant="default"` com cor destaque (verde ou primary) em vez de `variant="outline"`
- Se ja for lead vinculado, mostrar badge com status do lead no header (nome + etapa) em vez do botao

---

### 4. Chat: suporte a audio e regras IA/Humano

**4a. Audio**: O `ChatMessageBubble` ja renderiza placeholder para audio (linha 49: `message.type === "audio"` mostra icone Music). Para ouvir audio:
- Quando `message.type === "audio"` e `message.media_url` existe, renderizar um `<audio>` player inline em vez do bloco placeholder
- Usar `<audio controls src={message.media_url} className="w-48" />` com estilo compacto

**4b. Regras IA vs Humano**: Ja implementado - a regra e:
- Campo `attending_mode` no contato: `"ai"` = IA atende, `"human"` = humano atende
- Botao "Assumir" muda para modo humano; botao "IA" reativa o agente
- Limites do agente: max 10 mensagens por conversa, timeout de 48h de inatividade, horarios programados
- Se a IA nao conseguir resolver, ela solicita handoff automatico

**4c. Status do lead no chat**: Se o contato ja esta vinculado a um lead (`crm_lead_id`):
- Exibir badge com etapa do lead diretamente no header do chat (ao lado do nome)
- Ja existe parcialmente (linha 297), mas esta com `variant="outline"` discreto
- Melhorar para badge colorido com a cor da etapa do funil

**Arquivo**: `src/components/cliente/ChatMessageBubble.tsx`
- Substituir placeholder de audio por player `<audio>` real

**Arquivo**: `src/components/cliente/ChatConversation.tsx`
- Mover "Criar Lead" para header
- Melhorar badge de status do lead

---

### 5. CRM Kanban: temperatura nos cards + checkbox reposicionado

**Arquivo**: `src/pages/cliente/ClienteCRM.tsx`

**5a. Temperatura nos cards:**
- O banco `crm_leads` nao tem campo de temperatura. Sera necessario verificar se existe ou adicionar
- Se nao existir, adicionar via migracao: `ALTER TABLE crm_leads ADD COLUMN IF NOT EXISTS temperature text DEFAULT 'Morno'`
- No `DraggableLeadCard`, adicionar badges clicaveis de temperatura (Frio=azul, Morno=amarelo, Quente=vermelho) com icones (termometro ou circulos coloridos)
- Ao clicar, alterna entre frio/morno/quente e faz update no banco

**5b. Checkbox reposicionado:**
- Atualmente o checkbox esta posicionado `absolute top-2 left-2` (linha 632), sobrepondo o icone de drag `GripVertical` que esta `-ml-1` (linha 93)
- Mover o checkbox para `absolute top-2 right-2` ou para o canto inferior-direito do card
- Alternativa: mover para a direita do nome, antes do menu `MoreHorizontal`

---

### Migracao SQL necessaria

```text
ALTER TABLE crm_leads ADD COLUMN IF NOT EXISTS temperature text DEFAULT 'Morno';
```

### Ordem de implementacao

1. Migracao SQL (temperatura)
2. CRM Kanban: temperatura + checkbox (bug visual critico)
3. Chat: audio player + "Criar Lead" no header + status do lead
4. Plano de Vendas: helpText nas perguntas
5. Relatorios: metricas adicionais


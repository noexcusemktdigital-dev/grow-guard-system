
# Redesign: Conversas (Chat) + Dashboard Inicio

Duas melhorias principais: transformar o Chat em uma experiencia visual mais proxima do WhatsApp e reconstruir o Dashboard Inicio com dados reais, insights inteligentes e orientacao de proximos passos.

---

## PARTE 1 -- Conversas (renomear Chat)

### Sidebar
- Renomear "Chat" para "Conversas" em `ClienteSidebar.tsx`

### Layout Geral (ClienteChat.tsx)
- Renomear titulo para "Conversas"
- Layout fullscreen: remover `max-w-6xl` e usar `h-[calc(100vh-112px)]` para preencher tela
- Background da area de mensagens com pattern sutil (estilo WhatsApp wallpaper) usando CSS

### ChatContactList.tsx -- Redesign
- **Header da lista**: contador de conversas + badge "Online" da instancia
- **Preview da ultima mensagem** em cada contato (texto truncado 1 linha abaixo do nome)
- **Separador de data** entre contatos de hoje vs ontem vs mais antigos
- **Fixar contatos**: contatos com mensagens nao lidas ficam no topo, separados por divisor visual
- Melhorar estilos: hover mais suave, avatar maior (44px), tipografia mais clara

### ChatConversation.tsx -- Redesign
- **Header redesenhado**: avatar + nome + telefone + status online/offline + badges CRM tudo em uma linha premium
- **Painel de acoes colapsavel**: as acoes CRM (criar lead, mudar etapa, trocar agente, modo IA/Humano) ficam num painel que pode ser expandido/recolhido com botao
- **Separadores de data nas mensagens**: agrupar mensagens por dia com pill "Hoje", "Ontem", "12 de fev"
- **Input melhorado**: placeholder mais descritivo, icone de anexo (visual only), botao de envio com animacao, borda arredondada estilo WhatsApp
- **Estado vazio melhorado**: ilustracao e texto mais premium quando nenhum contato esta selecionado

### ChatMessageBubble.tsx -- Redesign
- **Tail da bolha**: adicionar CSS para a "cauda" triangular no canto da bolha (estilo WhatsApp)
- **Cores**: mensagens recebidas em tom neutro mais claro (bg-[#1a1a2e] no dark), enviadas em tom primary mais profundo
- **Media preview**: se houver `media_url`, mostrar thumbnail clicavel ao inves de link texto
- **Reacoes visuais**: badges de IA/Humano mais discretos (inline com horario ao inves de bloco separado)
- **Agrupamento**: mensagens consecutivas da mesma direcao compartilham avatar e reduzem espacamento

---

## PARTE 2 -- Dashboard Inicio

### Dados Reais (substituir mocks)
O dashboard atual usa valores hardcoded (`R$ 47.500`, `18,5%`, etc). Mudar para dados reais:

- **Receita Estimada**: somar `value` de `crm_leads` com `won_at` no mes atual (via `useCrmLeads`)
- **Leads do Mes**: contar leads criados no mes atual
- **Taxa de Conversao**: leads ganhos / total leads do mes
- **Meta vs Realizado**: usar `useActiveGoals` + `useGoalProgress` para pegar a meta principal e calcular %

### KPIs Dinamicos
Trocar os 4 KPIs hardcoded por calculos reais:
- Comparar com mes anterior para gerar trend (up/down)
- Sublabel dinamico ("vs mes anterior", "+X leads", etc)

### Frase do Dia
- Usar hook `useDailyMessages` para buscar a mensagem do dia da organizacao
- Se nao houver mensagem do dia, gerar uma frase motivacional automatica baseada no dia da semana
- Card premium com gradiente e icone Sparkles

### Insights Inteligentes (NOVO)
Secao "Insights" que analisa os dados do CRM e gera alertas reais:
- "X leads sem contato ha +48h" (calculado de `crm_leads` sem atividade recente)
- "Meta mensal em X%" (real do `useGoalProgress`)
- "X conversas aguardando resposta" (de `whatsapp_contacts` com `unread_count > 0`)
- Cards clicaveis que levam ao modulo correspondente

### Proximos Passos / Guia (NOVO)
Secao "Proximos Passos" que detecta o que o usuario ainda nao usou e sugere acoes:
- Verificar se tem WhatsApp conectado, se nao: "Conecte seu WhatsApp para atender leads automaticamente"
- Verificar se tem agentes IA criados, se nao: "Crie seu primeiro Agente IA para automatizar atendimento"
- Verificar se tem metas configuradas, se nao: "Configure suas metas do mes para acompanhar resultados"
- Verificar se tem conteudos criados, se nao: "Gere conteudos com IA para suas redes sociais"
- Cada sugestao e um card com icone, descricao e botao de acao que navega para o modulo

### Grafico de Receita Real
Substituir `revenueData` mock por dados agrupados semanalmente de `crm_leads` com `won_at` no mes atual

### Metas do Mes Reais
Substituir `monthlyGoals` mock por dados de `useActiveGoals` + `useGoalProgress`

### Layout Melhorado
- Frase do dia no topo, abaixo dos alertas
- KPIs reais
- Secao "Insights" com cards de alerta
- ProgressCtaCard com dados reais
- Grafico + Proximos Passos lado a lado
- Tarefas do dia + Metas do mes

---

## Detalhes Tecnicos

### Arquivos Modificados

| Arquivo | Acao |
|---------|------|
| `src/pages/cliente/ClienteChat.tsx` | Renomear titulo, layout fullscreen, background pattern |
| `src/components/cliente/ChatContactList.tsx` | Preview mensagem, separadores de data, contatos nao lidos no topo, tamanhos |
| `src/components/cliente/ChatConversation.tsx` | Header premium, painel acoes colapsavel, separadores de data, input melhorado |
| `src/components/cliente/ChatMessageBubble.tsx` | Cauda da bolha CSS, cores, agrupamento, badges inline |
| `src/pages/cliente/ClienteInicio.tsx` | Substituir mocks por dados reais, adicionar frase do dia, insights, proximos passos |
| `src/components/ClienteSidebar.tsx` | Renomear "Chat" para "Conversas" |

### Hooks Utilizados (ja existem)
- `useCrmLeads` -- leads do CRM para KPIs reais
- `useActiveGoals` + `useGoalProgress` -- metas e progresso
- `useDailyMessages` -- frase do dia
- `useWhatsAppContacts` -- contador de conversas pendentes
- `useWhatsAppInstance` -- verificar se WA esta conectado
- `useClienteAgents` -- verificar se tem agentes IA
- `useClienteChecklist` -- tarefas do dia

### Nenhuma migracao SQL necessaria
Todos os dados necessarios ja estao disponveis nas tabelas e hooks existentes.



## Separar Automações do Time e Automações de IA + Tutorial Educativo

### Arquitetura

Hoje tudo está em um único componente `CrmAutomations.tsx` com uma lista flat. A proposta é dividir em **duas abas internas** (Time e IA) dentro da mesma aba "Automações", cada uma com suas ações, recomendações e um tutorial introdutório.

### Classificação

**Automações do Time (humanas):**
- Criar tarefa, Adicionar/Remover tag, Mudar etapa, Notificar responsável, Enviar WhatsApp, Atribuir a pessoa, Atribuir a time, Mover para outro funil

**Automações de IA:**
- IA: Primeiro contato, IA: Follow-up automático, IA: Qualificar lead

### Mudanças

**1. `src/components/crm/CrmAutomations.tsx`** — Refatorar para ter sub-tabs:

- Adicionar **duas sub-abas**: "Automações do Time" (ícone Users2) e "Automações de IA" (ícone Bot)
- Cada aba filtra as automações existentes pelo campo `ai` das ACTIONS
- Cada aba mostra apenas as recomendações relevantes (IA vs Time)
- Cada aba mostra apenas os ACTIONS pertinentes no dialog de criação/edição
- O filtro de funil permanece global (acima das sub-abas)

**2. Tutorial introdutório em cada aba:**

Adicionar um bloco colapsável (usando `Collapsible` ou um card com toggle "Saiba mais") no topo de cada aba:

**Aba Time:**
- **O que são?** Regras automáticas que executam ações operacionais quando algo acontece no CRM
- **Por que usar?** Elimina tarefas manuais repetitivas, garante que nenhum lead fique sem atenção, padroniza processos
- **Exemplos práticos:** "Quando um lead é criado via Ads, atribuir automaticamente ao time de vendas" / "Quando lead fica parado 3 dias, notificar o responsável"

**Aba IA:**
- **O que são?** Automações que utilizam nossa IA para interagir com leads via WhatsApp de forma inteligente e personalizada
- **Por que usar?** Resposta imediata 24/7, qualificação automática com metodologia BANT, follow-ups persistentes sem esforço humano
- **Exemplos práticos:** "Quando lead chega, nossa IA envia mensagem de boas-vindas e inicia qualificação" / "Se lead não responde em 24h, nossa IA faz follow-up automático"
- Destaque: "Cada automação de IA precisa de um Agente configurado na seção Agentes IA"

**3. Tutorial na aba Integrações:**

Adicionar o mesmo padrão de bloco educativo no topo do `CrmIntegrationHub.tsx`:
- **O que são?** Conexões que trazem seus leads de diferentes fontes diretamente para o CRM
- **Por que usar?** Centraliza todos os leads em um só lugar, sem perder nenhum contato, independente da origem
- Breve: "Escolha abaixo de onde vêm seus leads e siga o passo a passo"

### Estrutura visual

```text
┌─────────────────────────────────────┐
│ Configurações do CRM                │
│ [Funis][Equipe]...[Integ.][Autom.]  │
│                                     │
│ Aba: Automações                     │
│ ┌──────────────┬───────────────┐    │
│ │ 👥 Do Time   │ 🤖 De IA     │    │
│ └──────────────┴───────────────┘    │
│                                     │
│ 📘 Saiba mais (colapsável)          │
│ "O que são? Por que usar?..."       │
│                                     │
│ ⭐ Recomendadas (filtradas)         │
│ ───────────────────────────────     │
│ Suas automações (filtradas)         │
│ [+ Nova automação]                  │
└─────────────────────────────────────┘
```

### Arquivos afetados

| Arquivo | Mudança |
|---------|---------|
| `src/components/crm/CrmAutomations.tsx` | Sub-tabs Time/IA, tutorial colapsável, filtro de ações por categoria |
| `src/components/crm/CrmIntegrationHub.tsx` | Bloco educativo no topo |

Nenhuma mudança de banco de dados necessária — a separação é puramente visual/UX.


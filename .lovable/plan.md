

# Testes Completos — Gamificação

## Contexto
A tela `ClienteGamificacao` (543 linhas) centraliza XP, níveis, medalhas, recompensas, ranking de equipe e avaliações. O sistema de gamificação é sustentado pela tabela `client_gamification` e triggers de XP no banco.

---

## Problemas Identificados

### 1. Medalhas são flat e genéricas — sem impacto visual 3D
As medalhas atuais são círculos com gradiente e um `box-shadow inset`. O visual é "bom o suficiente" mas não impressiona. O pedido é por medalhas mais robustas, 3D e visualmente impactantes.

**Fix**: Redesenhar o componente de medalha com múltiplas camadas de sombra/highlight, efeito de brilho metálico (radial gradient), anel exterior com "entalhe", e animação sutil de hover (rotateY 3D). Medalhas bloqueadas ficam monocromáticas com silhueta. Medalhas desbloqueadas ganham efeito de "pulse glow" no ring.

### 2. Medalhas não incentivam uso da plataforma além de CRM
Das 14 medalhas, 5 são de plataforma (perfil, empresa, WA, conteúdo) mas não cobrem: agendamento de eventos, uso de chat, criação de tarefas, uso da Academy, configuração de funis, ou preenchimento completo de leads. O pedido é expandir para induzir preenchimento e uso.

**Fix**: Adicionar 6 novas medalhas orientadas a uso/dados:
- **Organizador** — 5+ eventos na agenda
- **Estratégia Completa** — plano de vendas ou marketing preenchido
- **Lead Detalhista** — 10 leads com valor, telefone e email preenchidos
- **Funil Maestro** — funil customizado criado
- **Checklist Master** — 30 tarefas do dia concluídas (acumuladas)
- **Aluno Dedicado** — 3+ aulas da Academy concluídas

### 3. Sem `staleTime` na query de gamificação — flicker
`useClienteGamification()` não tem `staleTime`, causando refetch e flash ao voltar à tela.

**Fix**: Adicionar `staleTime: 1000 * 60 * 2`.

### 4. Seção de nível/XP é funcional mas pouco interativa
O card de evolução mostra XP e barra de progresso, mas não comunica claramente "o que fazer para subir". Falta didatismo.

**Fix**: Adicionar uma sub-seção "Próximas ações para XP" com 3-4 sugestões contextuais baseadas no estado atual (ex: "Complete seu perfil +25 XP", "Feche sua primeira venda +50 XP", "Crie um conteúdo +10 XP").

### 5. Rewards claim funciona mas sem feedback visual
O botão "Resgatar" funciona, mas a transição é abrupta — sem celebração visual.

**Fix**: Adicionar efeito confetti/sparkle ao resgatar recompensa (reutilizar `CelebrationEffect` que já existe no projeto).

### 6. Ranking da equipe é simplista
O ranking usa pontos calculados no frontend (`leads*10 + won*50`) mas não reflete XP real da gamificação. Também não mostra nível/medalhas dos colegas.

**Fix**: Buscar XP real da tabela `client_gamification` para cada membro e mostrar nível + ícone ao lado do nome no ranking.

### 7. Streak não tem feedback de "risco de perder"
O streak mostra dias mas não avisa "Volte amanhã para manter!" ou "Streak perdido!". Sem urgência.

**Fix**: Adicionar badge de alerta quando último acesso > 20h ("Mantenha seu streak! Volte amanhã").

### 8. Medalhas desbloqueadas sem data de desbloqueio
As medalhas calculadas no frontend não registram *quando* foram desbloqueadas. Sem senso de progressão temporal.

**Fix**: Para esta versão, adicionar tooltip com a condição cumprida. Persistência da data fica para uma v3.

---

## Melhorias Visuais (Foco principal do pedido)

| # | Melhoria | Impacto |
|---|---|---|
| 1 | Medalhas 3D com múltiplas camadas, brilho metálico, hover com rotateY | Visual premium |
| 2 | Medalhas bloqueadas com silhueta monocromática + cadeado sutil | Clareza |
| 3 | Efeito "glow pulse" no ring de medalhas desbloqueadas | Feedback visual |
| 4 | Card de nível com gradient mais rico e ícone maior | Impacto |
| 5 | Confetti no resgate de recompensa | Celebração |

## Melhorias Funcionais

| # | Melhoria | Impacto |
|---|---|---|
| 6 | +6 medalhas de uso da plataforma (agenda, lead completo, funil, checklist, academy, estratégia) | Indução de uso |
| 7 | Seção "Próximas ações para XP" contextual | Didatismo |
| 8 | Ranking com XP real + nível de cada membro | Precisão |
| 9 | `staleTime` na query de gamificação | Performance |
| 10 | Alerta de streak em risco | Engajamento |

## Arquivos a alterar
- `src/pages/cliente/ClienteGamificacao.tsx` — todo o visual e funcional
- `src/hooks/useClienteContent.ts` — `staleTime` na gamificação


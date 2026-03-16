

## Plano: Otimizar Plano de Vendas (Rafael) — de 33 para ~18 blocos

### Problema
O briefing do Rafael exibe "X/33" no header, o que assusta o usuário. São 4 intros + 29 perguntas, muitas redundantes com o que a plataforma já resolve.

### Análise dos 33 blocos atuais

| Seção | Blocos | Ação |
|-------|--------|------|
| Intros (info) | 4 | Condensar em 1 |
| Sobre o Negócio | 4 | Manter 4 |
| Financeiro Comercial | 5 | Manter 4 (ciclo_recompra condicional) |
| Equipe e Estrutura | 4 | Manter 3 (remover processo_documentado) |
| Gestão de Leads | 4 | Manter 3 (remover qtd_leads_mes) |
| Canais e Prospecção | 3 | Manter 2 (remover mede_roi) |
| Processo de Vendas | 3 | Manter 1 (só etapas_funil — scripts e reunião são da plataforma) |
| Ferramentas e Automação | 3 | Remover seção inteira (a plataforma substitui) |
| Metas e Performance | 3+2 cond | Manter 2 + 2 condicionais |

**Resultado: ~18 blocos** (vs 33 atuais), sem perder dados essenciais para a geração de estratégia.

### Mudanças

**1. `src/components/cliente/briefingAgents.ts`**
- Condensar 4 intros em 1 mensagem única
- Remover perguntas de baixo valor: `processo_documentado`, `qtd_leads_mes`, `mede_roi`, `usa_scripts`, `reuniao_recorrente`, `ferramentas_usadas`, `tem_automacoes`, `usa_agente_ia`, `relatorios`
- Tornar `ciclo_recompra` condicional (`skipIf: tem_recorrencia === "nao"`)

**2. `src/components/cliente/ChatBriefing.tsx`**
- Trocar o badge "X/33" por exibição da **seção atual** (ex: "Sobre o Negócio")
- Ou mostrar apenas a barra de progresso sem o contador numérico

### Arquivos impactados

| Arquivo | Mudança |
|---------|---------|
| `src/components/cliente/briefingAgents.ts` | Reduzir RAFAEL_STEPS de 33 → ~18 |
| `src/components/cliente/ChatBriefing.tsx` | Esconder contador "X/Y", mostrar seção |




# Reestruturação da Ferramenta de Estratégia de Marketing

## Resumo das Mudanças

Três camadas: (1) briefing expandido para 14 perguntas em 8 blocos, (2) output da IA reestruturado em 8 módulos estratégicos, (3) dashboard visual com abas, gráficos e botões de ação para outras ferramentas.

---

## 1. Briefing — Expandir `SOFIA_STEPS` em `briefingAgents.ts`

Substituir as 10 perguntas atuais por 14 perguntas em 8 blocos:

| Bloco | Perguntas | Tipo |
|---|---|---|
| **Negócio** | 1. Nome + o que faz (textarea) | 2. Produto principal (textarea) | 3. Ticket médio (select: R$500, R$2k, R$15k, custom) |
| **Público** | 4. Cliente ideal (chips + texto) | 5. Problema que resolve (textarea) |
| **Posicionamento** | 6. Por que escolher sua empresa (textarea) | 7. Diferencial claro (select: método, atendimento, nicho, custom) |
| **Estrutura atual** | 8. Canais atuais (multi-select: Instagram, Site, Tráfego, etc.) | 9. Investe em anúncios? (select: sim/não) + condicional: quanto/mês |
| **Objetivo** | 10. Objetivo principal (select) | 11. Meta de faturamento/crescimento (textarea) |
| **Presença digital** | 12. Links: site, Instagram, landing page (text, opcional) |
| **Região** | 13. Onde atua (text: cidade/estado/país) |
| **Orçamento** | 14. Investimento mensal em marketing (select com faixas) |

---

## 2. Edge Function — Reestruturar output da IA em `generate-strategy/index.ts`

Atualizar TOOL_SCHEMA e SYSTEM_PROMPT para gerar 8 blocos:

1. **diagnostico** — análise + gráfico radar (scores 0-10 para: Autoridade, Aquisição, Conversão, Retenção)
2. **icp** — demografia, perfil profissional, dores, desejos, objeções (substitui "persona")
3. **proposta_valor** — problema → método/solução → resultado prometido
4. **estrategia_aquisicao** — canais prioritários + funil (topo/meio/fundo)
5. **estrategia_conteudo** — 4 pilares (educação, autoridade, prova social, oferta) com exemplos
6. **plano_crescimento** — projeções numéricas: investimento, CPC, leads, clientes, receita por mês (6 meses)
7. **estrutura_recomendada** — checklist: site, landing page, tráfego, conteúdo, automação (com status: falta/tem)
8. **plano_execucao** — roadmap 3 meses com passos vinculados às ferramentas do sistema

---

## 3. Dashboard Visual — Reescrever `ClientePlanoMarketing.tsx`

Substituir o layout atual (collapsibles) por interface com **abas** + **gráficos** + **botões de ação**.

**Abas da página de resultado:**
- Resumo — 4 KPI cards + gráfico radar do diagnóstico
- Cliente Ideal — card ICP completo + proposta de valor (Problema → Solução → Resultado)
- Aquisição — gráfico funil (Visitantes → Leads → Clientes) + canais prioritários (gráfico pizza: Orgânico/Pago/Parcerias)
- Conteúdo — cards dos 4 pilares + ideias de conteúdo + botão "Gerar Conteúdos"
- Projeção — gráfico de linha (Leads, Clientes, Receita por mês) + KPIs (CPC, CPL, CAC, ROI)
- Plano de Execução — timeline 3 meses com botões diretos para cada ferramenta (Conteúdos, Postagens, Sites, Tráfego)

**Componentes visuais:**
- Recharts: RadarChart (diagnóstico), PieChart (canais), LineChart (projeções), BarChart (funil)
- Tabs do Radix para navegação entre seções
- Cards com badges de status para estrutura recomendada
- Botões de ação com ícones linkando para `/cliente/conteudos`, `/cliente/redes-sociais`, `/cliente/sites`, `/cliente/trafego-pago`

---

## Arquivos

| Arquivo | Ação |
|---|---|
| `src/components/cliente/briefingAgents.ts` | Reescrever `SOFIA_STEPS` — 14 perguntas em 8 blocos |
| `supabase/functions/generate-strategy/index.ts` | Atualizar TOOL_SCHEMA e prompt para 8 módulos |
| `src/pages/cliente/ClientePlanoMarketing.tsx` | Reescrever resultado como dashboard com abas e gráficos |


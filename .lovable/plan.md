

## Plano: Revisão do Módulo de Prospecção

### Mudanças

**1. Renomear e reordenar abas (`FranqueadoProspeccaoIA.tsx`, linhas 637-654)**

- "Histórico" → "Minhas Prospecções"
- "Configurar Prospecção" → "Criar Prospecção" (título do card, linha 121)
- Reordenar abas: Prospecção IA | Minhas Prospecções | Playbooks

**2. Revisar formulário de prospecção (mesma página, linhas 115-203)**

Ajustar campos e objetivos para o foco No Skills (vender diagnóstico/estratégia gratuita):
- Campo "Objetivo da Abordagem": trocar opções para refletir cenários reais:
  - "Agendar diagnóstico gratuito" (padrão)
  - "Retomar conversa com lead"  
  - "Lead quente por indicação — agendar reunião"
- Adicionar campo "Contexto do Contato" (textarea) para explicar como chegou ao lead (indicação, evento, orgânico)
- Ajustar label "Desafio Principal do Prospect" → "Principal dor ou necessidade identificada"

**3. Atualizar prompt da edge function (`generate-prospection/index.ts`)**

Ajustar o system prompt e user prompt para focar em:
- Objetivo final = agendar conversa de diagnóstico/estratégia gratuita
- Considerar nível de contato (frio/retomada/quente por indicação)
- Gerar scripts personalizados para convite ao diagnóstico

**4. Revisar Playbooks (`constants/prospectionPlaybooks.ts`)**

Ajustar o conteúdo para o contexto No Skills:
- Playbook "Primeiro Contato": scripts focados em oferecer diagnóstico gratuito
- Playbook "Diagnóstico Comercial": reforçar que o objetivo é criar estratégia gratuita para o prospect
- Atualizar referências genéricas para mencionar "diagnóstico" e "estratégia gratuita" como gancho principal
- Ajustar playbook de Qualificação para incluir cenário "lead quente por indicação"

### Arquivos

| Arquivo | Ação |
|---------|------|
| `src/pages/franqueado/FranqueadoProspeccaoIA.tsx` | Renomear abas, reordenar, ajustar formulário |
| `supabase/functions/generate-prospection/index.ts` | Ajustar prompts para foco em diagnóstico |
| `src/constants/prospectionPlaybooks.ts` | Revisar conteúdo dos playbooks |


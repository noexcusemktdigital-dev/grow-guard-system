

## Plano: Inteligencia Especializada por Funcao dos Agentes + Modulo Trafego Pago com IA

Duas grandes entregas neste plano: (1) refinar a inteligencia dos agentes por funcao com onboarding explicativo, e (2) reconstruir o modulo de Trafego Pago para gerar estrategias reais com IA.

---

### PARTE 1: Inteligencia Especializada por Funcao do Agente

**Problema atual**: Os `rolePrompts` no `ai-agent-reply/index.ts` sao genericos (4-5 linhas cada). As descricoes no `agentRoleConfig` sao curtas ("Prospeccao e qualificacao"). Nao ha explicacao ao usuario sobre o que cada funcao faz.

**Mudancas**:

#### 1.1 Expandir `agentRoleConfig` em `src/types/cliente.ts`
- Adicionar campo `longDescription` com explicacao detalhada de cada funcao
- Adicionar campo `workflow` descrevendo o fluxo de trabalho do agente
- Adicionar campo `defaultObjectives` com objetivos mais especificos

| Funcao | Foco | Fluxo |
|--------|------|-------|
| **SDR** | Qualificar leads com perguntas assertivas, identificar decisor, necessidade e orcamento. Enviar leads qualificados aos vendedores | Pergunta -> Qualifica -> Classifica -> Agenda/Handoff |
| **Closer** | Qualificar e ja enviar links de venda/produtos. Nao agenda, fecha direto | Qualifica -> Apresenta produto -> Envia link -> Fecha |
| **Suporte** | Compreender a dor real, resolver com base de dados, verificar se resolveu, se nao envia para humano com problema identificado | Escuta -> Diagnostica -> Resolve -> Confirma -> Handoff especialista |
| **Pos-venda** | Colher feedback e NPS apos venda/contratacao | Parabeniza -> Pergunta experiencia -> Coleta NPS -> Registra |

#### 1.2 Tela explicativa ao selecionar funcao no `AgentFormSheet.tsx`
- Ao selecionar a funcao na aba "Identidade", exibir um card explicativo com:
  - Descricao longa da funcao
  - Fluxo de trabalho visual (passos numerados)
  - Objetivos padrao que serao configurados
- Isso molda o restante da criacao (objetivos, prompt, persona)

#### 1.3 Expandir `rolePrompts` no `ai-agent-reply/index.ts`
- Prompts detalhados por funcao com instrucoes especificas de comportamento:
  - **SDR**: Fazer perguntas de qualificacao (BANT), ser objetivo, enviar lead qualificado com resumo
  - **Closer**: Qualificar rapidamente, apresentar produto/servico, enviar links de venda, usar acao `[AI_ACTION:SEND_LINK:url]`
  - **Suporte**: Fazer perguntas diagnosticas, buscar na base de dados, confirmar resolucao, handoff com resumo do problema
  - **Pos-venda**: Iniciar com parabens pela compra, perguntar sobre experiencia, coletar nota NPS (1-10), registrar feedback

#### 1.4 Nova acao de IA: `SEND_PRODUCT_LINK`
- Para Closers: permitir enviar links de produtos/servicos configurados na base de conhecimento
- Formato: `[AI_ACTION:SEND_PRODUCT_LINK:url_do_produto]`

#### 1.5 Nova acao de IA: `REGISTER_NPS`
- Para Pos-venda: registrar nota NPS e comentario
- Formato: `[AI_ACTION:REGISTER_NPS:nota|comentario]`
- Salvar em tabela `client_nps_responses` (nova)

**Nova tabela**: `client_nps_responses`
```text
id, organization_id, contact_id, agent_id, score (1-10), comment, created_at
```

---

### PARTE 2: Modulo Trafego Pago com IA

**Problema atual**: A pagina `ClienteTrafegoPago.tsx` usa dados mockados. Nao consome estrategia de marketing nem metas. Os tutoriais sao estaticos.

**Mudancas**:

#### 2.1 Nova Edge Function: `generate-traffic-strategy`
- Recebe: dados do plano de vendas (metas), estrategia de marketing ativa, conteudos gerados, informacao do site
- Gera estrategia de trafego por plataforma (Google, Meta, TikTok, LinkedIn) com:
  - Objetivo da campanha
  - Publico-alvo detalhado
  - Orcamento sugerido (baseado nas metas)
  - Copies de anuncio
  - Formatos de criativos
  - KPIs estimados (alcance, cliques, CPC, CPL)
  - Palavras-chave (para Google)
  - Interesses/comportamentos (para Meta)

#### 2.2 Nova tabela: `traffic_strategies`
```text
id, organization_id, platforms (JSONB - array com estrategia por plataforma),
source_data (JSONB - snapshot das metas e estrategia usadas),
created_at, is_active, created_by
```

#### 2.3 Hook: `useTrafficStrategy`
- `useActiveTrafficStrategy()` - estrategia ativa
- `useGenerateTrafficStrategy()` - mutation que chama a edge function
- `useTrafficStrategyHistory()` - historico

#### 2.4 Reconstruir `ClienteTrafegoPago.tsx` com 3 abas:

**Aba 1 - Estrategia (nova)**
- Botao "Gerar Estrategia de Trafego com IA" que consome metas + estrategia de marketing
- Exibe estrategia por plataforma em cards expandiveis com todos os detalhes
- Cada card de plataforma tem botao "Criar Campanha" que leva para a aba Tutoriais filtrada por aquela plataforma

**Aba 2 - Tutoriais (melhorada)**
- Manter tutoriais existentes (Meta, Google, TikTok, LinkedIn)
- Adicionar checklist interativo com estado persistido
- Botao de link externo para abrir a plataforma de anuncios

**Aba 3 - Historico**
- Estrategias anteriores com data e dados usados

#### 2.5 Credito: 200 creditos por geracao de estrategia de trafego

---

### Arquivos a Criar

| Arquivo | Descricao |
|---------|-----------|
| `supabase/functions/generate-traffic-strategy/index.ts` | Edge function que gera estrategia de trafego com IA |
| `src/hooks/useTrafficStrategy.ts` | Hooks para estrategia de trafego |

### Arquivos a Editar

| Arquivo | Mudanca |
|---------|---------|
| `src/types/cliente.ts` | Expandir `agentRoleConfig` com `longDescription`, `workflow`, `defaultObjectives` |
| `src/components/cliente/AgentFormSheet.tsx` | Card explicativo da funcao selecionada na aba Identidade |
| `supabase/functions/ai-agent-reply/index.ts` | Expandir rolePrompts com instrucoes detalhadas + novas acoes SEND_PRODUCT_LINK e REGISTER_NPS |
| `src/pages/cliente/ClienteTrafegoPago.tsx` | Reconstruir com 3 abas: Estrategia (IA), Tutoriais, Historico |

### Migracoes de Banco

1. Tabela `client_nps_responses` para armazenar NPS coletado pelo agente pos-venda
2. Tabela `traffic_strategies` para armazenar estrategias de trafego geradas


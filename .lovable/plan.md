

## Reformulação — Tráfego Pago focado em Estratégias + Tutoriais + Repositório

### Visão geral

Remover a aba "Métricas" (que depende de integração com Google/Meta) e reestruturar o módulo em 3 abas: **Estratégia** (wizard + resultado), **Campanhas** (repositório salvo) e **Histórico**. Cada plataforma ganha um botão "Criar Campanha" que abre um tutorial detalhado e salva a campanha no repositório.

### Estrutura de abas

```text
┌──────────────────────────────────────────────┐
│  [Estratégia]  [Campanhas]  [Histórico]      │
├──────────────────────────────────────────────┤
│  Estratégia: wizard 8 etapas → resultado     │
│  por plataforma com CTA "Criar Campanha"     │
├──────────────────────────────────────────────┤
│  Campanhas: repositório de campanhas salvas  │
│  (cards por plataforma, status, data)        │
├──────────────────────────────────────────────┤
│  Histórico: estratégias anteriores           │
└──────────────────────────────────────────────┘
```

### Mudanças no resultado da estratégia

Cada card de plataforma ganha um botão **"Criar Campanha"** que:
1. Abre um `Dialog` com tutorial passo-a-passo específico da plataforma
2. O tutorial é visual com steps numerados, screenshots descritivos, e dicas
3. Ao final do tutorial, botão **"Salvar Campanha"** persiste na tabela `client_campaigns` com `type = platform`, `content = { strategy data + tutorial }`, `status = "draft"`

### Tutoriais por plataforma

Cada plataforma terá um tutorial detalhado hardcoded com ~8-12 passos:

- **Google Ads**: Criar conta → Escolher objetivo → Configurar campanha → Definir público → Definir orçamento → Criar grupos de anúncios → Escrever copies → Configurar extensões → Publicar
- **Meta Ads**: Acessar Gerenciador → Criar campanha → Escolher objetivo → Definir público (interesses, lookalike) → Definir posicionamentos → Criar criativos → Configurar pixel → Publicar
- **TikTok Ads**: Criar conta → Escolher objetivo → Configurar público → Criar criativo (vídeo) → Definir orçamento → Publicar
- **LinkedIn Ads**: Criar Campaign Manager → Escolher objetivo → Definir segmentação (cargo, empresa, setor) → Criar anúncio → Definir orçamento → Publicar

Cada passo terá: título, descrição detalhada, dica contextual baseada nos dados da estratégia gerada (ex: "Use o público-alvo: Empresários de São Paulo que a IA sugeriu").

### Aba "Campanhas" (Repositório)

- Lista todas as campanhas salvas em `client_campaigns` filtradas por `type` contendo a plataforma
- Cards com: nome da plataforma, objetivo, orçamento sugerido, data de criação, status (Rascunho/Ativa/Pausada)
- Botão para ver detalhes (reabre o tutorial com dados da estratégia)
- Filtro por plataforma

### Arquivos a modificar

| Arquivo | Ação |
|---------|------|
| `src/pages/cliente/ClienteTrafegoPago.tsx` | Remover aba "Métricas" e imports de `AdConnectionCards`, `AdMetricsDashboard`, `AdAIAnalysis`. Adicionar aba "Campanhas". Adicionar lógica de salvar campanha |
| `src/pages/cliente/ClienteTrafegoPagoResult.tsx` | Adicionar botão "Criar Campanha" em cada card de plataforma. Adicionar Dialog com tutorial step-by-step por plataforma |
| `src/pages/cliente/ClienteTrafegoPagoConstants.tsx` | Adicionar `PLATFORM_TUTORIALS` com passos detalhados por plataforma (Google, Meta, TikTok, LinkedIn) |
| `src/hooks/useClienteCampaignsDB.ts` | Já existe e será reutilizado para o repositório de campanhas |

### Detalhes técnicos

- **Tutorial Dialog**: Componente com stepper interno (step 1/N), cada step com título + descrição + dica contextual. A dica usa dados da estratégia gerada (público, orçamento, copies)
- **Salvar campanha**: Usa `useCreateClientCampaign` existente com `content = { platform, objective, audience, budget, tutorial_completed: true, strategy_id }`
- **Repositório**: Query `client_campaigns` com filtro `type IN ('Google','Meta','TikTok','LinkedIn')`, agrupados visualmente por plataforma
- Remoção dos componentes `AdConnectionCards`, `AdMetricsDashboard`, `AdAIAnalysis` dos imports (os arquivos ficam para uso futuro se integração for implementada)


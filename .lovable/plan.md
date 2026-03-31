

## Plano — Melhorar diagramação da estratégia de tráfego + redirecionar aprovadas para Campanhas

### Problema

1. A estratégia gerada tem layout denso e pouco visual — cards de plataforma, KPIs e projeções ficam amontoados
2. Ao aprovar uma estratégia, ela continua na aba "Estratégia" em vez de ir para "Campanhas" com as plataformas separadas

### Mudanças

#### 1. Redesign do `ClienteTrafegoPagoResult.tsx` — Layout mais visual

- **Header hero**: Card de destaque com status, diagnóstico e botões de ação (aprovar/regerar) em layout mais limpo
- **Plano de investimento**: Cards com ícones coloridos por plataforma + barra de distribuição visual (progress bar proporcional)
- **Projeções**: Cards com ícones grandes e valores destacados em grid responsivo
- **Cards de plataforma**: Layout com header colorido (faixa de cor da plataforma no topo), seções com separação visual clara (público, orçamento, KPIs em mini-cards com ícones), copies e keywords em collapsible mais organizado
- **KPIs por plataforma**: Mini dashboard com 4 métricas em grid 2x2 com bordas e ícones maiores

#### 2. Fluxo pós-aprovação — Redirecionar para aba Campanhas

No `ClienteTrafegoPago.tsx`, ao aprovar com sucesso:
- Criar automaticamente uma campanha por plataforma na tabela `client_campaigns` (cada plataforma vira uma campanha separada)
- Mudar `activeTab` para `"campanhas"` após aprovação
- Toast informando que as campanhas foram criadas

#### 3. Aba Campanhas — Cards por plataforma

Melhorar os cards de campanha existentes para mostrar mais informações vindas do `content` (objetivo, público, orçamento, KPIs) de forma visual.

### Arquivos a modificar

| Arquivo | Ação |
|---------|------|
| `src/pages/cliente/ClienteTrafegoPagoResult.tsx` | Redesign completo do layout — hero, investimento visual, cards de plataforma melhorados |
| `src/pages/cliente/ClienteTrafegoPago.tsx` | No `handleApprove`, criar campanhas por plataforma e redirecionar para aba Campanhas |

### Detalhes técnicos

**Criação automática de campanhas**: No `onSuccess` do `handleApprove`, iterar sobre `platforms` e chamar `createCampaign.mutateAsync` para cada plataforma, salvando os dados completos da estratégia no campo `content`.

**Layout dos cards de plataforma**: Cada card terá uma faixa colorida no topo (`border-t-4`), seções com `grid` para público/orçamento/criativos, e um mini-dashboard de KPIs com ícones e valores maiores.


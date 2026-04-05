

## Plano — Modo Apresentação (link externo em nova aba)

### Conceito

Adicionar um botão **"Apresentar"** ao lado dos botões PDF e Salvar. Ao clicar, abre uma nova aba do navegador com uma rota dedicada (`/apresentacao/:followupId`) que renderiza os dados do acompanhamento como uma apresentação fullscreen com slides navegáveis — gráficos, métricas, e plano do próximo mês.

### Como funciona

1. **Salvar antes de apresentar** — Ao clicar em "Apresentar", o sistema salva automaticamente o acompanhamento (se ainda não salvo) e abre `window.open("/apresentacao/{id}")` em nova aba.

2. **Rota pública de apresentação** — Uma nova rota `/apresentacao/:id` que carrega o followup do banco e renderiza em modo slideshow. Não usa sidebar nem layout de franqueado — é uma página standalone.

3. **Slides navegáveis** — A apresentação é dividida em slides (teclado ← → ou clique):
   - **Slide 1 — Capa**: Logo No Excuse + nome do cliente + mês
   - **Slide 2 — Análise**: Radar chart geral + métricas por pilar com gráficos de barras
   - **Slide 3 — Análise detalhada**: Pontos positivos/negativos por área, avanços do mês
   - **Slide 4 — Conteúdo**: Pautas orgânicas e pagas com formato, plataforma, datas
   - **Slide 5 — Tráfego Pago**: Campanhas com investimento, metas, gráfico de distribuição
   - **Slide 6 — Web**: Seções/páginas planejadas com status e necessidades
   - **Slide 7 — Vendas/CRM**: Funil, metas, estratégias
   - **Slide 8 — Resumo**: Avanços do mês + pontos a melhorar + próximos passos

4. **Visual**: Fundo escuro (#0f0f0f), cards com bordas sutis, gráficos Recharts animados, tipografia grande para projeção. Escala 16:9 (1920x1080) com `transform: scale()` para caber em qualquer tela.

### Arquivos

| Arquivo | Ação |
|---------|------|
| `src/pages/Apresentacao.tsx` | **Novo** — Página standalone de apresentação fullscreen |
| `src/App.tsx` | Adicionar rota `/apresentacao/:id` (fora dos layouts protegidos) |
| `src/pages/franqueado/FranqueadoAcompanhamento.tsx` | Adicionar botão "Apresentar" no header do editor |

### Detalhes técnicos

- A rota `/apresentacao/:id` faz `supabase.from("client_followups").select("*").eq("id", id).single()` diretamente — sem autenticação obrigatória para permitir projeção em tela de reunião
- Componente `PresentationSlide` renderiza cada slide a 1920x1080 com scale automático
- Navegação: Arrow keys, Space (avançar), Escape (sair), indicador de progresso no rodapé
- Gráficos Recharts reutilizados do editor (Radar, Bar, Pie) com tamanhos maiores para projeção


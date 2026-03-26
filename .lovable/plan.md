

## 4 Mudanças: Site Assertivo + Aprovação Individual + Tutorial de Gravação + Créditos de Roteiro

### 1. Site puxando dados reais (logo, cores, estratégia)

**Problema**: O wizard do site tem auto-fill básico mas não puxa logo, cores da identidade visual, nem dados completos do plano de marketing. O edge function recebe `cores_principais` e `fontes_preferidas` mas o frontend passa strings vazias quando o `visualIdentity` não tem dados completos.

**Solução**:
- **`ClienteSites.tsx`**: No auto-fill (linhas 274-285), puxar dados mais ricos do `useStrategyData` (ICP, proposta de valor, tom, diferencial, segmento, serviços, público-alvo) e do `useVisualIdentity` (logo_url, palette, fonts, style, tone). Pré-preencher campos como `servicos`, `diferenciais`, `publico_chips`, `dores`, `tom`, `estilo`, `cores` automaticamente.
- Adicionar campo `logo_url` ao formulário e passá-lo ao body do `generate-site`. Mostrar badge visual "Logo detectada" quando existir.
- **`generate-site/index.ts`**: Adicionar `logo_url` ao prompt da IA com instrução: "Se houver logo_url, inclua `<img src='{logo_url}'>` no header e footer do site". Reforçar no system prompt: "OBRIGATÓRIO usar as cores exatas fornecidas como CSS variables `:root`. NÃO inventar cores."
- Adicionar dados do `useStrategyData` diretamente no body: `salesPlanProducts`, `salesPlanDiferenciais`, `salesPlanSegmento`, `salesPlanDorPrincipal`.

### 2. Remover ApprovalDashboard global — aprovação individual por ferramenta

**Problema**: `ApprovalDashboard` aparece em Sites, Roteiros e Postagem mostrando estatísticas de TODAS as ferramentas juntas.

**Solução**:
- **Remover** `<ApprovalDashboard />` de `ClienteSites.tsx`, `ClienteConteudos.tsx` e `ClienteRedesSociais.tsx`.
- Cada ferramenta já tem seus próprios indicadores de pendência inline (badges de status, filtros por status). Manter apenas esses.
- Opcionalmente, manter o componente `ApprovalDashboard.tsx` no codebase para uso futuro no Dashboard, mas removê-lo das 3 páginas de ferramentas.

### 3. Roteiros — botão "Gravar" com tutorial dinâmico por formato

**Problema**: Após aprovação do roteiro, não há orientação de como gravar.

**Solução**:
- **`ClienteConteudos.tsx`**: Após um roteiro ser aprovado, mostrar botão "🎬 Gravar" ao lado do card.
- Ao clicar, abrir um **Sheet/Dialog** com tutorial específico baseado no formato escolhido (Reels, Stories, TikTok, YouTube).
- O tutorial será um componente `RecordingTutorial` com:
  - **Dicas de enquadramento** (vertical/horizontal, distância)
  - **Configuração de câmera** (resolução, fps)
  - **Passo a passo da gravação** numerado, com o roteiro do lado para referência
  - **Dicas de edição** (cortes, legendas, música)
  - **Duração recomendada** baseada no formato
- Conteúdo diferenciado:
  - **Stories**: 15s por slide, vertical, câmera frontal, foco em autenticidade
  - **Reels**: 30-90s, vertical, transições dinâmicas, hook nos 3 primeiros segundos
  - **TikTok**: 15-60s, vertical, tendências, cortes rápidos
  - **YouTube**: 3-15min, horizontal, introdução, roteiro completo com timestamps

### 4. Custo de aprovação de roteiro = 20 créditos (remover "approve-content" de 200)

**Solução**:
- **`src/constants/plans.ts`**: Alterar `"approve-content"` de `{ cost: 200, label: "Aprovação de conteúdo" }` para `{ cost: 20, label: "Aprovação de roteiro" }`.
- Verificar que `useClienteContentV2.ts` já consome `CREDIT_COSTS["approve-content"].cost` — a mudança será automática.
- Remover a entrada da calculadora de créditos se havia uma referência separada de "Aprovação de conteúdo" na UI de planos.

### Arquivos afetados

| Arquivo | Mudança |
|---------|---------|
| `src/pages/cliente/ClienteSites.tsx` | Auto-fill com strategy + visual identity, campo logo_url, remover ApprovalDashboard |
| `supabase/functions/generate-site/index.ts` | Logo no prompt, cores obrigatórias, dados de strategy |
| `src/pages/cliente/ClienteConteudos.tsx` | Remover ApprovalDashboard, adicionar botão "Gravar" + tutorial |
| `src/pages/cliente/ClienteRedesSociais.tsx` | Remover ApprovalDashboard |
| `src/constants/plans.ts` | approve-content: 200 → 20 |
| `src/components/cliente/content/RecordingTutorial.tsx` | Novo componente — tutorial de gravação por formato |


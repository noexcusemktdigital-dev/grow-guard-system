

## Plano de Correções — 4 Frentes

### 1. E-mail de confirmação usando domínio da Lovable (não o nosso template)

**Causa raiz:** O `auth-email-hook` está usando Resend diretamente (`sendViaResend`), mas o domínio `notify.sistema.noexcusedigital.com.br` ainda está com DNS pendente. Isso significa que o hook pode estar falhando silenciosamente, e o Supabase cai no e-mail padrão da Lovable.

Além disso, o e-mail de "reenvio" (`supabase.auth.resend({ type: "signup" })`) para contas existentes também usa o fluxo padrão se o hook falhar.

**Ação:**
- Verificar o status do DNS do domínio de e-mail em Cloud → Emails
- Verificar se `RESEND_API_KEY` está configurado como secret nas Edge Functions
- Se o DNS ainda não estiver verificado, informar o usuário que os e-mails customizados só funcionam após a verificação DNS — enquanto isso, os e-mails padrão da Lovable são usados
- Verificar logs da Edge Function `auth-email-hook` para identificar erros

### 2. Onboarding obrigatório antes do dashboard

**Problema:** Após signup, o usuário é levado para `/cliente/inicio`, que faz redirect para `/cliente/onboarding` se `onboarding_completed === false`. Porém, ele vê o dashboard/sidebar brevemente antes do redirect.

**Solução:** Mover a verificação de onboarding para o `ProtectedRoute` ou para o `ClienteLayout`, de forma que antes de renderizar qualquer coisa do layout cliente, verifique `onboarding_completed`. Se `false`, redirecionar imediatamente para `/cliente/onboarding` sem renderizar sidebar/dashboard.

**Arquivos:**
- `src/components/ClienteLayout.tsx` — Adicionar hook `useOrgProfile()`, se `onboarding_completed === false`, retornar `<Navigate to="/cliente/onboarding" />` antes de renderizar o layout
- `src/pages/cliente/ClienteInicio.tsx` — Remover o `useEffect` de redirect duplicado (linhas 103-107)

### 3. Terminologia "a IA" → "a nossa IA"

Trocar todas as ocorrências de "a IA" por "a nossa IA" (e "A IA" por "A nossa IA") nos seguintes arquivos:

| Arquivo | Ocorrências |
|---------|-------------|
| `src/components/cliente/social/ArtWizardSteps.tsx` | ~5 ocorrências |
| `src/pages/cliente/ClientePlanoMarketing.tsx` | 1 ocorrência |
| `src/components/cliente/ScriptGeneratorBriefingStep.tsx` | 2 ocorrências |
| `src/components/cliente/ScriptGeneratorDialog.tsx` | 1 ocorrência |
| `src/components/cliente/content/ContentWizard.tsx` | 2 ocorrências |
| `src/components/cliente/AgentFormSheetPersona.tsx` | 1 ("pela IA" → "pela nossa IA") |

### 4. Tooltips de explicação em cada card/gráfico dos resultados

Adicionar um ícone `HelpCircle` (?) ao lado de cada título de seção/card nos resultados do Plano de Vendas e Marketing, com `Tooltip` explicando o que aquele elemento significa.

**Plano de Vendas (`ClientePlanoVendasDiagnostico.tsx`):**
- "RADAR POR ÁREA — 5 EIXOS" → tooltip: "Mostra sua pontuação em 5 dimensões comerciais. Quanto mais preenchido, mais madura é sua operação naquele eixo."
- "SCORE POR CATEGORIA" → tooltip: "Barra horizontal mostrando o percentual atingido em cada área. Verde (≥70%), Amarelo (≥40%), Vermelho (<40%)."
- "ATUAL vs IDEAL" → tooltip: "Comparação entre seu score atual e o ideal (100%) em cada dimensão."
- "INDICADOR DE MATURIDADE COMERCIAL" → tooltip: "Termômetro geral da saúde comercial do seu negócio, de 0% a 100%."
- KPIs (Receita Projetada, Crescimento, Leads, Fechamentos) → tooltip para cada um
- "PROJEÇÃO DE RECEITA" → tooltip: "Estimativa de receita nos próximos 6 meses com e sem a estratégia proposta."
- "FUNIL DE CONVERSÃO PROJETADO" → tooltip: "Simulação do funil de vendas no mês 6, com base no ticket médio e taxa de conversão."

**Plano de Marketing (`ClientePlanoMarketingStrategy.tsx`):**
- "Radar de Maturidade (6 dimensões)" → tooltip: "Avalia 6 áreas-chave do seu marketing. Nota de 0 a 10 em cada dimensão."
- "Diagnóstico" → tooltip: "Análise qualitativa do estado atual do seu marketing."
- KPIs (CPC, CPL, CAC, ROI, LTV) → tooltip com definição de cada métrica
- "Leads & Clientes" / "Receita vs Investimento" → tooltips explicativos
- "Benchmarks" → tooltip: "Comparação com médias do seu setor de atuação."

Usar o componente `Tooltip` + `TooltipTrigger` + `TooltipContent` já existente no projeto, com ícone `HelpCircle` de 14px.

### Arquivos afetados

| Arquivo | Mudança |
|---------|---------|
| `src/components/ClienteLayout.tsx` | Gate de onboarding antes do layout |
| `src/pages/cliente/ClienteInicio.tsx` | Remover redirect duplicado |
| `src/pages/cliente/ClientePlanoVendasDiagnostico.tsx` | Tooltips explicativos |
| `src/pages/cliente/ClientePlanoMarketingStrategy.tsx` | Tooltips explicativos |
| `src/components/cliente/social/ArtWizardSteps.tsx` | "a IA" → "a nossa IA" |
| `src/pages/cliente/ClientePlanoMarketing.tsx` | "a IA" → "a nossa IA" |
| `src/components/cliente/ScriptGeneratorBriefingStep.tsx` | "a IA" → "a nossa IA" |
| `src/components/cliente/ScriptGeneratorDialog.tsx` | "a IA" → "a nossa IA" |
| `src/components/cliente/content/ContentWizard.tsx` | "a IA" → "a nossa IA" |
| `src/components/cliente/AgentFormSheetPersona.tsx` | "pela IA" → "pela nossa IA" |

### Sobre o e-mail (item 1)

O DNS do domínio `notify.sistema.noexcusedigital.com.br` ainda está pendente. Precisamos verificar se os registros DNS foram configurados corretamente. Enquanto o DNS não for verificado, os e-mails de autenticação serão enviados pelo sistema padrão (sem os templates customizados). Vou verificar os logs e o status, mas a configuração do DNS precisa ser concluída pelo administrador do domínio.


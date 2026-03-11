

## Resposta: Simulação de Créditos por Plano + Correção de Criação de Usuários

---

### 1. Simulação de Créditos por Plano

Aqui está a tabela completa baseada no `CREDIT_COSTS` e `UNIFIED_PLANS`:

```text
┌────────────────────────────────┬───────┬─────────────────────────────────────┐
│ Ação                           │ Custo │ Starter(500) │ Pro(1000) │ Enter(1500)│
├────────────────────────────────┼───────┼──────────────┼───────────┼────────────┤
│ Gerar Site                     │  100  │     5x       │    10x    │    15x     │
│ Estratégia de Marketing        │   50  │    10x       │    20x    │    30x     │
│ Estratégia de Tráfego          │   50  │    10x       │    20x    │    30x     │
│ Plano de Prospecção             │   30  │    16x       │    33x    │    50x     │
│ Gerar Conteúdo                 │   30  │    16x       │    33x    │    50x     │
│ Arte Social (imagem)           │   25  │    20x       │    40x    │    60x     │
│ Conceitos Visuais              │   25  │    20x       │    40x    │    60x     │
│ Vídeo Social                   │   25  │    20x       │    40x    │    60x     │
│ Script de Vendas               │   20  │    25x       │    50x    │    75x     │
│ Config. automática agente      │   10  │    50x       │   100x    │   150x     │
│ Simulação agente IA            │   10  │    50x       │   100x    │   150x     │
│ Checklist diário IA            │    5  │   100x       │   200x    │   300x     │
│ Automação CRM (por execução)   │    5  │   100x       │   200x    │   300x     │
│ Agente IA (por mensagem)       │    2  │   250x       │   500x    │   750x     │ ★ Só Pro+
│ Follow-up automático (por msg) │    2  │   250x       │   500x    │   750x     │ ★ Só Pro+
│ Briefing de arte               │    0  │   ∞          │    ∞      │    ∞       │
│ Briefing de vídeo              │    0  │   ∞          │    ∞      │    ∞       │
├────────────────────────────────┼───────┼──────────────┼───────────┼────────────┤
│ Trial (200 cr / 7 dias)        │       │ ~40% do      │           │            │
│                                │       │ Starter      │           │            │
└────────────────────────────────┴───────┴──────────────┴───────────┴────────────┘

Recursos exclusivos por plano:
- Starter: SEM Agente IA, SEM WhatsApp, SEM Disparos, 3 pipelines, 10 usuários
- Pro: COM Agente IA, WhatsApp, Disparos, 10 pipelines, 20 usuários
- Enterprise: Tudo ilimitado + suporte prioritário

Pacotes de recarga: 200cr/R$49 | 500cr/R$99 | 1000cr/R$179
```

Nota: as quantidades são "se gastasse tudo em uma única ação". Na prática, o cliente distribui entre várias ações.

---

### 2. Erro na Criação de Novos Usuários — Diagnóstico

A Edge Function `invite-user` foi corrigida na mensagem anterior (tabela `subscriptions` + limites corretos). A org NOEXCUSE tem plano `pro` com status `active` e apenas 2 membros — bem abaixo do limite de 20.

**O problema agora é outro:** `inviteUserByEmail` retorna "already been registered" se o email já existe no auth (ex: criado via Google OAuth). A function trata isso como erro 409.

**Solução necessária:** Quando o email já existe, em vez de rejeitar, a function deve:
1. Buscar o user existente pelo email
2. Verificar se já é membro da org (se sim, retornar erro "já é membro")
3. Se não é membro, adicionar membership + role + teams ao user existente

---

### 3. Login Google + Email/Senha com mesmo email

O Supabase Cloud já suporta isso nativamente — quem fez login via Google pode também criar senha. Basta usar `supabase.auth.updateUser({ password })`. Mas o fluxo atual do SaaS não oferece essa opção.

**Solução:** Adicionar na tela de configurações do cliente (`ClienteConfiguracoes.tsx`) uma seção "Definir senha" para quem entrou via Google (detectável via `user.app_metadata.provider === 'google'`). Isso permite que o mesmo email funcione com Google ou email+senha.

---

### Plano de Implementação

**A. Corrigir `invite-user` para aceitar emails já existentes** (Edge Function)
- Se `inviteUserByEmail` retorna "already been registered":
  - Buscar user pelo email via `auth.admin.listUsers` com filtro
  - Verificar se já tem membership na org
  - Se não tem: criar membership, role e teams
  - Retornar sucesso

**B. Adicionar "Definir senha" nas configurações do cliente**
- Em `ClienteConfiguracoes.tsx`, na aba de perfil
- Mostrar apenas quando `user.app_metadata.provider === 'google'` e user não tem senha definida
- Campo de nova senha + confirmação
- Chamar `supabase.auth.updateUser({ password })`

**C. Nenhuma mudança nos planos/créditos** — os valores já estão corretos no código




# Sistema de Acesso SaaS -- Frontend Mock (Organizacao, Assinatura, Wallet, Roles)

## Resumo

Implementar todas as telas e fluxos visuais do sistema de acesso com dados simulados. Isso inclui: pagina publica de planos, fluxo de onboarding pos-pagamento, tela de Plano e Creditos funcional, tela de Configuracoes com gestao de equipe/roles, e feature gating visual. Tudo com mock data, sem backend real, para validar UX antes de conectar Supabase.

---

## Modelo de Acesso: Trial Gratuito (14 dias)

- Cliente cria conta gratuita
- Recebe 14 dias de trial com acesso completo
- Apos trial: precisa escolher plano pago
- Banner de contagem regressiva durante o trial
- Bloqueio de features (nao de login) apos expirar

---

## Arquivos Modificados/Criados

| Arquivo | Acao |
|---------|------|
| `src/data/clienteData.ts` | Adicionar tipos e mocks (Organization, Subscription, Wallet, Roles, Plans) |
| `src/pages/cliente/ClientePlanoCreditos.tsx` | Reescrever com dashboard completo de plano, creditos e historico |
| `src/pages/cliente/ClienteConfiguracoes.tsx` | Reescrever com abas (Perfil, Equipe/Roles, Organizacao, Notificacoes) |
| `src/components/ClienteSidebar.tsx` | Adicionar banner de trial e indicador de plano ativo |

---

## 1. Novos Tipos e Dados Mock (clienteData.ts)

### Organization
```typescript
interface Organization {
  id: string;
  name: string;
  cnpj: string;
  plan: string;
  status: "ativo" | "trial" | "suspenso" | "cancelado";
  createdAt: string;
  maxUsers: number;
}
```

### Subscription
```typescript
interface Subscription {
  id: string;
  organizationId: string;
  planId: string;
  planName: string;
  status: "active" | "trial" | "expired" | "cancelled";
  startDate: string;
  renewalDate: string;
  trialEndsAt: string | null;
  price: number;
  creditsIncluded: number;
}
```

### Wallet e Transacoes
```typescript
interface Wallet {
  organizationId: string;
  currentBalance: number;
  totalIncluded: number;
  renewalDate: string;
}

interface CreditTransaction {
  id: string;
  type: "consumo" | "recarga" | "compra_extra" | "bonus";
  amount: number;
  date: string;
  module: string;
  description: string;
}
```

### Planos
```typescript
interface SaasPlan {
  id: string;
  name: string;
  price: number;
  credits: number;
  maxUsers: number;
  features: string[];
  popular: boolean;
}
```

### Roles e Membros
```typescript
type UserRole = "admin" | "gestor_comercial" | "marketing" | "operador";

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: "ativo" | "convidado" | "inativo";
  lastLogin: string;
}
```

### Dados mock incluidos
- 3 planos (Starter R$197, Pro R$397, Enterprise R$797)
- 1 organizacao mock com status "trial"
- 1 subscription mock com trialEndsAt em 10 dias
- Wallet com 500/2000 creditos
- 8-10 transacoes de credito (consumo IA, geracao de posts, disparos)
- 3 membros de equipe com roles diferentes

---

## 2. Plano e Creditos (ClientePlanoCreditos.tsx) -- Reescrita Completa

### Layout
Pagina dividida em 3 secoes principais:

### Secao 1: Status do Plano
- Card principal com:
  - Nome do plano ativo (badge colorido)
  - Status (Trial / Ativo / Suspenso)
  - Data de renovacao
  - Dias restantes de trial (se aplicavel) com barra de progresso
  - Botao "Upgrade" ou "Gerenciar Plano"

### Secao 2: Wallet de Creditos
- Card com:
  - Saldo atual / Total incluso (ex: 500 / 2.000)
  - Barra de progresso visual
  - Data de renovacao dos creditos
  - Botao "Comprar Creditos Extra"
- Grafico de consumo por modulo (PieChart):
  - IA Comercial, IA Marketing, Disparos, Geracao de Sites, Outros

### Secao 3: Historico de Transacoes
- Tabela com colunas:
  - Data | Tipo (badge) | Descricao | Modulo | Valor (+/-)
- Filtro por tipo (Consumo, Recarga, Compra)
- Ordenado por data decrescente

### Secao 4: Cards de Planos Disponiveis
- 3 cards lado a lado (Starter, Pro, Enterprise)
- Plano atual com badge "Atual"
- Plano popular com badge "Mais Popular"
- Lista de features por plano
- Botao "Escolher" (toast mock)

---

## 3. Configuracoes (ClienteConfiguracoes.tsx) -- Reescrita Completa

### Formato: Tabs horizontais com 4 abas

### Aba 1: Perfil
- Avatar placeholder
- Input: Nome
- Input: Email (readonly)
- Input: Telefone
- Input: Cargo
- Botao "Salvar Alteracoes" (toast mock)

### Aba 2: Organizacao
- Input: Nome da empresa
- Input: CNPJ
- Input: Segmento
- Select: Fuso horario
- Badge: Status da conta (ativo/trial)
- Botao "Salvar"

### Aba 3: Equipe
- Contador: "3 de 5 usuarios" (baseado no plano)
- Botao "Convidar Membro"
- Dialog de convite com:
  - Input: Email
  - Select: Role (Admin, Gestor Comercial, Marketing, Operador)
- Tabela de membros:
  - Nome | Email | Role (badge colorido) | Status | Ultimo acesso | Acoes (editar role, remover)
- Descricao dos roles em collapsible:
  - Admin: Acesso total, gerencia plano, compra creditos
  - Gestor Comercial: CRM, Chat, Scripts, Relatorios
  - Marketing: Conteudos, Sites, Trafego, Campanhas
  - Operador: Apenas CRM e Chat

### Aba 4: Notificacoes
- Lista de toggles (Switch):
  - Novos leads
  - Creditos baixos
  - Renovacao de plano
  - Mensagens WhatsApp
  - Relatorios semanais

---

## 4. Sidebar -- Indicadores de Trial e Plano

### Banner de Trial
Quando status = "trial", adicionar acima do footer de creditos:
- Card compacto amarelo/amber:
  - "Trial: 10 dias restantes"
  - Mini barra de progresso
  - Link "Ver planos"
- Quando restam 3 dias ou menos: cor vermelha

### Indicador de plano
No footer da sidebar (onde ja mostra creditos):
- Adicionar nome do plano abaixo dos creditos
- Badge "Trial" ou "Pro" etc.

---

## Secao Tecnica

### Componentes utilizados
- Tabs (configuracoes)
- Card, Badge, Button, Input, Select
- Switch (notificacoes)
- Dialog (convidar membro)
- Table (historico creditos, membros equipe)
- Progress (trial, creditos)
- PieChart (consumo por modulo)
- Alert (banner trial)

### Estado dos componentes

**PlanoCreditos:**
```
activeTab: string (para tabs de planos se necessario)
filterType: string (filtro historico)
subscription: Subscription (mock)
wallet: Wallet (mock)
transactions: CreditTransaction[] (mock)
plans: SaasPlan[] (mock)
```

**Configuracoes:**
```
activeTab: "perfil" | "organizacao" | "equipe" | "notificacoes"
profile: { name, phone, cargo } (editavel)
organization: Organization (editavel)
members: TeamMember[] (mock com estado)
inviteOpen: boolean
newInvite: { email, role }
notifications: Record<string, boolean>
```

### Ordem de implementacao
1. Adicionar tipos e mocks em `clienteData.ts`
2. Reescrever `ClientePlanoCreditos.tsx`
3. Reescrever `ClienteConfiguracoes.tsx`
4. Atualizar `ClienteSidebar.tsx` com banner trial


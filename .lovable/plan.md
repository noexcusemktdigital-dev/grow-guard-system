
## Plano: Tutorial de Primeiro Acesso, Suporte no Header, Comemoracao de Venda, Notificacoes Funcionais e Efeitos Sonoros

Quatro entregas principais para melhorar a experiencia do usuario na plataforma.

---

### 1. Tutorial de Primeiro Acesso (Onboarding Tour)

Criar um componente `OnboardingTour` que aparece apenas no primeiro acesso do usuario. Usa `localStorage` para persistir se ja foi visualizado.

**Novo arquivo: `src/components/cliente/OnboardingTour.tsx`**
- Componente de tour guiado com steps em modal/dialog
- Steps sequenciais com titulo, descricao e icone explicando as principais areas:
  1. Boas-vindas e visao geral da plataforma
  2. Modulo Comercial (CRM, Agentes IA, Scripts)
  3. Modulo Marketing (Estrategia, Conteudos, Sites, Trafego)
  4. Checklist diario e Gamificacao
  5. Creditos e Plano
- Cada step tem botoes "Anterior", "Proximo" e "Pular tour"
- Ao final, botao "Comecar" que fecha o tour
- Salva `onboarding_tour_done` no `localStorage` para nao exibir novamente
- Tambem salvar no banco (`profiles.onboarding_completed`) para persistir entre dispositivos

**Editar: `src/components/ClienteLayout.tsx`**
- Importar e renderizar `<OnboardingTour />` dentro do layout

---

### 2. Botao de Suporte no Header

**Editar: `src/pages/Index.tsx`**
- Adicionar um botao de suporte (icone `Headphones` ou `LifeBuoy`) ao lado da `NotificationBell`
- Ao clicar, abre um Popover com:
  - Botao "Abrir ticket de suporte" (navega para pagina de suporte ou abre dialog)
  - Link para documentacao/FAQ
  - Email de contato
- Exibir apenas para roles `cliente_admin` e `cliente_user`

---

### 3. Efeito de Comemoracao ao Marcar Venda

**Novo arquivo: `src/components/CelebrationEffect.tsx`**
- Componente que renderiza confetes animados usando CSS/canvas
- Efeito de particulas coloridas caindo por 3 segundos
- Exporta funcao `triggerCelebration()` que pode ser chamada de qualquer lugar
- Usa um portal para renderizar sobre toda a tela

**Editar: `src/components/crm/CrmLeadDetailSheet.tsx` (linha ~230)**
- No onClick do botao "Vendido", apos `markAsWon.mutate()`:
  - Chamar `triggerCelebration()`
  - Chamar `playSound("success")`

**Editar: `src/hooks/useCrmLeads.ts` (markAsWon, linha ~138)**
- No `onSuccess`, alem de invalidar queries, disparar notificacao no banco:
  - Inserir em `client_notifications` com tipo "Metas" e mensagem de venda

---

### 4. Notificacoes Funcionais (Bell real)

**Editar: `src/components/NotificationBell.tsx`**
- Remover dados mockados estaticos
- Importar `useClienteNotifications` e `useClienteContentMutations` de `useClienteContent`
- Buscar notificacoes reais do banco (`client_notifications`)
- Mostrar badge com contagem de nao-lidas
- Ao clicar numa notificacao, marcar como lida
- Botao "Ver todas" navega para `/cliente/notificacoes`
- Adicionar `playSound("notification")` quando ha novas notificacoes (comparar count anterior)
- Para roles nao-cliente (franqueadora/franqueado), manter comportamento simples ou adaptar

**Gerar notificacoes automaticas** - Editar hooks para criar notificacoes em acoes-chave:
- `useCrmLeadMutations` (createLead): notificacao "Novo lead criado: {nome}"
- `useCrmLeadMutations` (markAsWon): notificacao "Venda realizada: {lead.name}"

---

### 5. Efeitos Sonoros em Acoes Importantes

**Editar: `src/lib/sounds.ts`**
- Adicionar novo tipo `"celebration"` com melodia mais elaborada (ascendente triunfante)
- Manter os tipos existentes

**Pontos de integracao de sons (editar cada arquivo)**:

| Acao | Som | Arquivo |
|------|-----|---------|
| Marcar venda no CRM | `celebration` | `src/components/crm/CrmLeadDetailSheet.tsx` |
| Criar novo lead | `success` | `src/hooks/useCrmLeads.ts` (onSuccess do createLead) |
| Completar item do checklist | `success` | `src/hooks/useClienteContent.ts` (toggleChecklistItem onSuccess) |
| Nova notificacao recebida | `notification` | `src/components/NotificationBell.tsx` |
| Gerar conteudo/estrategia com IA | `success` | Nos respectivos hooks de geracao |
| Erro/warning | `warning` | Em toasts de erro relevantes |

---

### Resumo de Arquivos

**Criar:**
| Arquivo | Descricao |
|---------|-----------|
| `src/components/cliente/OnboardingTour.tsx` | Tour guiado de primeiro acesso com steps |
| `src/components/CelebrationEffect.tsx` | Confetes animados para comemoracao de venda |

**Editar:**
| Arquivo | Mudanca |
|---------|---------|
| `src/components/ClienteLayout.tsx` | Adicionar OnboardingTour |
| `src/pages/Index.tsx` | Botao de suporte no header |
| `src/components/NotificationBell.tsx` | Notificacoes reais do banco + som |
| `src/components/crm/CrmLeadDetailSheet.tsx` | Comemoracao + som ao marcar venda |
| `src/hooks/useCrmLeads.ts` | Notificacao automatica ao criar lead e marcar venda |
| `src/hooks/useClienteContent.ts` | Som ao completar checklist |
| `src/lib/sounds.ts` | Novo tipo "celebration" |

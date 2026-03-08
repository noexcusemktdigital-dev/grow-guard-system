

## Plano: Tutorial de Primeiro Acesso + Revisão de Convites + Otimizações

### Diagnóstico

**Tutoriais:**
- O `OnboardingTour` existe apenas no portal **Cliente** (em `ClienteLayout.tsx`), usando `localStorage` para controle de primeiro acesso.
- **Franqueadora** e **Franqueado** NÃO possuem nenhum tutorial de primeiro acesso.

**Convites:**
- O fluxo de convite via `invite-user` Edge Function está funcional. Usa `inviteUserByEmail` que envia e-mail nativo para definição de senha.
- **Matriz** (Franqueadora): convite funcional em `Matriz.tsx`, chamando `invite-user` com role + teams.
- **Unidades** (Franqueado): convite funcional em `UnidadeUsuariosReal.tsx`, chamando `invite-user` com role.
- Ambos os fluxos já estão prontos e funcionais. O e-mail é enviado automaticamente.

**Marketing & Academy (integração Franqueadora ↔ Franqueado):**
- Marketing: Franqueado usa `useContentSourceOrgId()` que resolve para `parent_org_id` — dados da franqueadora são herdados corretamente (read-only).
- Academy: Mesma lógica — módulos/aulas vêm do `sourceOrgId` (parent). Progresso é do usuário individual. Funcional.

### Mudanças

#### 1. Tutorial Franqueadora — Novo componente
**Arquivo**: `src/components/FranqueadoraTour.tsx`

Tour de 5 passos no primeiro acesso (localStorage `franqueadora_tour_done`):
1. Boas-vindas (center)
2. Rede — Gerencie unidades, atendimento e onboarding (target: seção Rede na sidebar)
3. Comercial — CRM, Prospecção, Estratégia, Propostas (target: seção Comercial)
4. Marketing & Academy — Materiais e Treinamentos (target: seção Marketing)
5. Gestão — Matriz, Financeiro, Contratos, Logs (target: seção Gestão)

Adicionar `data-tour` nas seções da `FranqueadoraSidebar.tsx`.
Montar o componente no `FranqueadoraLayout.tsx`.

#### 2. Tutorial Franqueado — Novo componente
**Arquivo**: `src/components/FranqueadoTour.tsx`

Tour de 5 passos (localStorage `franqueado_tour_done`):
1. Boas-vindas (center)
2. Comercial — CRM, Prospecção, Estratégia (target: seção Comercial)
3. Marketing — Materiais e Academy (target: seção Marketing)
4. Gestão — Unidade, Financeiro, Contratos (target: seção Gestão)
5. Suporte & Configurações — no header (target: header-actions)

Adicionar `data-tour` nas seções da `FranqueadoSidebar.tsx`.
Montar o componente no `FranqueadoLayout.tsx`.

#### 3. Otimização — `data-tour` tags nas sidebars
- `FranqueadoraSidebar.tsx`: Envolver seções com `data-tour="rede"`, `data-tour="comercial"`, `data-tour="marketing-academy"`, `data-tour="gestao"`
- `FranqueadoSidebar.tsx`: Envolver seções com `data-tour="comercial"`, `data-tour="marketing"`, `data-tour="gestao"`

#### 4. Otimização de dados — QueryClient staleTime
Atualmente o `QueryClient` usa defaults (0ms staleTime), causando re-fetches desnecessários. Configurar defaults globais:
- `staleTime: 1000 * 60 * 2` (2 min) para reduzir chamadas repetidas
- `gcTime: 1000 * 60 * 10` (10 min) para manter cache

**Arquivo**: `src/App.tsx` — atualizar `new QueryClient()` com `defaultOptions`.

### Arquivos afetados

| Arquivo | Ação |
|---------|------|
| `src/components/FranqueadoraTour.tsx` | Criar — Tutorial primeiro acesso franqueadora |
| `src/components/FranqueadoTour.tsx` | Criar — Tutorial primeiro acesso franqueado |
| `src/components/FranqueadoraSidebar.tsx` | Adicionar data-tour nas seções |
| `src/components/FranqueadoSidebar.tsx` | Adicionar data-tour nas seções |
| `src/components/FranqueadoraLayout.tsx` | Montar FranqueadoraTour |
| `src/components/FranqueadoLayout.tsx` | Montar FranqueadoTour |
| `src/App.tsx` | QueryClient defaults (staleTime/gcTime) |

### Sobre os convites
Os convites **já estão prontos e funcionais** em ambos os portais. A Edge Function `invite-user` usa `inviteUserByEmail` que dispara e-mail automático para o novo usuário definir sua senha. Não é necessária nenhuma alteração.


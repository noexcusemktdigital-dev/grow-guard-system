

# Prioridade 9: Varredura de Polish — Visual, UX e Consistencia

## Achados da Varredura

### 1. Bugs Visuais / Layout

**A. Franqueadora e Franqueado — Layout duplica animacao de entrada**
Os layouts `FranqueadoraLayout.tsx` e `FranqueadoLayout.tsx` usam `animate-slide-up` no wrapper do `<Outlet>`, mas o `ClienteLayout` usa `page-enter` (CSS customizado). O `page-enter` e mais suave (0.4s cubic-bezier). Os dois primeiros portais devem usar `page-enter` para consistencia e para evitar animacao diferente entre portais.

**B. SaaS Dashboard — TabsList com `grid-cols-5` quebra em mobile**
`SaasDashboard.tsx` (linha 372) usa `grid w-full grid-cols-5` sem responsividade. Em telas < 640px, as 5 tabs ficam comprimidas e ilegíveis. O mesmo problema existe em `CrmLeadDetailSheet.tsx` (linha 159). Deve usar `grid-cols-2 sm:grid-cols-5` ou `flex flex-wrap`.

**C. Franqueadora/Franqueado mobile header sobreposicao**
Ambos os layouts usam `fixed top-14` no mobile header, mas o conteudo usa `mt-12` (48px) quando o header e `h-12` (48px) + top-14 (56px). O `mt-12` nao compensa o `fixed top-14 + h-12`, causando conteudo cortado no topo em mobile. O ClienteLayout resolve isso de forma diferente (sem `fixed`, o header flui normalmente). Os outros dois devem seguir o padrao do ClienteLayout.

**D. KpiCard no FranqueadoDashboard — nao mostra trend**
O `FranqueadoDashboard` usa `KpiCard` sem a prop `trend`, entao os KPIs parecem estaticos comparados ao `ClienteInicio` que calcula trends. Oportunidade de adicionar comparacao mes-a-mes.

### 2. Inconsistencias de UX

**E. Franqueadora nao tem pagina de Configuracoes**
Franqueado tem `FranqueadoConfiguracoes`, Cliente tem `ClienteConfiguracoes`, mas Franqueadora so tem `FranqueadoraPerfil`. Falta uma pagina de configuracoes (identidade visual, preferencias de notificacao, etc).

**F. HomeAtalhos nao e contextual para o Cliente**
O componente `HomeAtalhos` so tem arrays para `franqueadora` e `franqueado`, mas nunca e renderizado no portal Cliente (ClienteInicio nao o usa). Contudo, se futuramente for usado, nao tem fallback para `cliente_admin`/`cliente_user`. Nao e um bug ativo, mas e um risco.

**G. NotificacoesPage — click na notificacao nao navega**
Na pagina de notificacoes (`NotificacoesPage.tsx`), clicar em uma notificacao apenas marca como lida mas **nao navega** para a `action_url`. O `NotificationBell` faz isso corretamente, mas a pagina completa nao. O usuario espera ser direcionado ao clicar.

**H. FranqueadoDashboard — secao "Comercial" e muito basica**
A secao comercial no dashboard do franqueado (linha 177-186) mostra apenas "X leads ativos no CRM" sem nenhum dado visual (receita, conversao, pipeline). Comparado ao ClienteInicio com graficos e KPIs avançados, parece incompleto.

### 3. Oportunidades de Polish

**I. Transicao de pagina inconsistente**
- ClienteLayout: usa `page-enter` (CSS)
- FranqueadoraLayout / FranqueadoLayout: usa `animate-slide-up` (Tailwind)
- Unificar para `page-enter` em todos os portais

**J. FranqueadoDashboard sem frase do dia estilizada**
O dashboard do franqueado mostra a frase do dia em italico simples, enquanto o ClienteInicio tem um card hero com gradiente, emoji de saudacao e stats inline. Elevar o visual do franqueado.

**K. Sidebar footer inconsistente**
- Franqueadora: link direto para perfil
- Franqueado: popover com opcoes (perfil + configuracoes)
- Cliente: mostra creditos
Franqueadora deveria ter pelo menos o popover do franqueado (perfil + link para futura pagina de config).

---

## Plano de Execucao (ordenado por impacto)

### Bloco 1 — Bugs de Layout (correcoes rapidas)

| Arquivo | Acao |
|---------|------|
| `FranqueadoraLayout.tsx` | Trocar `animate-slide-up` por `page-enter`; corrigir mobile header (remover `fixed`, usar modelo do ClienteLayout) |
| `FranqueadoLayout.tsx` | Mesmo tratamento |
| `SaasDashboard.tsx` | TabsList: `grid-cols-2 sm:grid-cols-3 md:grid-cols-5` |
| `CrmLeadDetailSheet.tsx` | TabsList: `grid-cols-3 sm:grid-cols-5` |

### Bloco 2 — UX: Navegacao nas notificacoes

| Arquivo | Acao |
|---------|------|
| `NotificacoesPage.tsx` | Ao clicar na notificacao, alem de marcar como lida, navegar para `action_url` usando `getPortalPrefix` (mesmo padrao do `NotificationBell`) |

### Bloco 3 — Polish: Dashboard do Franqueado

| Arquivo | Acao |
|---------|------|
| `FranqueadoDashboard.tsx` | Adicionar hero card com saudacao estilizada (similar ao ClienteInicio); enriquecer secao comercial com receita do mes e pipeline summary |

### Bloco 4 — Sidebar Franqueadora: footer com popover

| Arquivo | Acao |
|---------|------|
| `FranqueadoraSidebar.tsx` | Trocar link direto por Popover com opcoes "Meu Perfil" (mantido) |

### Bloco 5 — Plan update

| Arquivo | Acao |
|---------|------|
| `.lovable/plan.md` | Registrar P9 |

---

## Ordem de Execucao

1. Bloco 1 (bugs de layout — impacto visual imediato)
2. Bloco 2 (navegacao notificacoes)
3. Bloco 3 (polish dashboard franqueado)
4. Bloco 4 (sidebar footer)
5. Bloco 5 (plan.md)


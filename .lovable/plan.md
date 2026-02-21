

# Design System Global -- Dark Premium + Animacoes Inteligentes

## Resumo

Padronizar o design de todo o sistema seguindo a referencia visual dos anexos: dark premium com accent vermelho, sidebar com secoes categoricas e item ativo em "pill" com barra vermelha, cards com fundo translucido, tipografia com hierarquia forte, espacamento generoso. Adicionar animacoes e transicoes inteligentes em todo o sistema (navegacao, hover, carregamento, graficos).

---

## Escopo de Mudancas

Este e um refactor visual global. Nenhuma funcionalidade muda -- apenas aparencia, consistencia e microinteracoes.

---

## Fase 1 -- Tokens e Fundacao CSS

### Arquivo: `src/index.css`

Ajustar os tokens dark para ficarem mais "premium" (mais escuros, melhor contraste):

- `--background`: de `0 0% 4%` para `220 15% 4%` (leve tom azulado no preto, como o anexo)
- `--card`: de `0 0% 7%` para `220 10% 6%` (cards mais escuros e translucidos)
- `--popover`: `220 10% 7%`
- `--border`: de `0 0% 16%` para `0 0% 12%` (bordas mais sutis)
- `--muted`: de `0 0% 14%` para `220 8% 12%`
- `--sidebar-background`: de `0 0% 5%` para `220 15% 5%`
- `--radius`: de `0.75rem` para `1rem` (radius maior = mais pills/arredondado)

Adicionar novas utility classes:

```text
.glass-card (dark) -- melhorar para:
  background: rgba(255,255,255,0.04)
  border: 1px solid rgba(255,255,255,0.08)
  border-radius: 1rem (20px)
  backdrop-filter: blur(8px)

.hover-lift -- transicao hover com elevacao:
  transition: transform 200ms, box-shadow 200ms
  hover: translateY(-2px) + shadow sutil

.animate-slide-up -- entrada de conteudo
.animate-scale-in -- entrada de modais
.animate-bar-grow -- para graficos

.sidebar-item-active -- reformular:
  background: primary/12
  border-left: 3px solid primary
  border-radius: 0 12px 12px 0 (pill shape)
  color: foreground (nao primary-foreground)
  icone: text-primary
```

### Arquivo: `tailwind.config.ts`

Adicionar keyframes e animations novos:

```text
keyframes:
  slide-up: translateY(12px) opacity 0 -> translateY(0) opacity 1
  slide-down: inverso
  scale-in: scale(0.96) opacity 0 -> scale(1) opacity 1
  bar-grow: scaleY(0) -> scaleY(1) (origin bottom)
  line-draw: strokeDashoffset 100% -> 0
  pulse-dot: scale 1 -> 1.15 -> 1

animation:
  slide-up: slide-up 0.3s ease-out
  scale-in: scale-in 0.2s ease-out
  bar-grow: bar-grow 0.6s ease-out
  pulse-dot: pulse-dot 2s infinite
```

---

## Fase 2 -- Sidebar Redesign

### Arquivo: `src/components/FranqueadoraSidebar.tsx`

Redesign para ficar como nos anexos:

- Icones: `text-primary/70` no estado normal (vermelho sutil), `text-primary` no ativo
- Item ativo: pill arredondada (rounded-xl) + barra vermelha esquerda 3px + fundo primary/10 + texto foreground
- Hover: fundo sutil + icone brilha levemente (transition opacity/color 150ms)
- Secoes: labels uppercase tracking-wider (ja existe section-label, manter)
- Separador visual entre secoes (nao borda grossa, apenas spacing)
- Bottom: area de usuario com avatar, nome e unidade (como no anexo "SOCIO NO EXCUSE / UNIDADE CURITIBA")
- Collapse: transicao suave 300ms (ja existe, manter)

### Arquivo: `src/components/FranqueadoraLayout.tsx`

Adicionar transicao de conteudo:

- Wrapper do `<Outlet />` com classe `animate-fade-in` ou `animate-slide-up`
- Key baseada em `location.pathname` para re-trigger da animacao ao mudar de pagina

---

## Fase 3 -- Componentes Padrao Reutilizaveis

### CRIAR: `src/components/PageHeader.tsx`

Componente padrao para header de todas as paginas:
- Titulo (h1, bold, uppercase tracking-wide -- como "GESTAO FINANCEIRA", "UNIDADES DA REDE" nos anexos)
- Subtitulo (descricao em muted-foreground)
- Breadcrumbs (opcional)
- Area de acoes (slot para botoes no canto direito)
- Badge de contexto (ex: "Franqueadora")

### CRIAR: `src/components/SectionHeader.tsx`

- Titulo menor (h2/h3, bold, uppercase tracking)
- Descricao curta
- Acoes opcionais (toggle view, filtros)

### Atualizar: `src/components/KpiCard.tsx`

- Redesign para match do anexo:
  - Card com fundo translucido (glass-card)
  - Label em uppercase tracking-wider (ja tem)
  - Valor grande e bold
  - Trend icon + sublabel
  - Variante "accent" com fundo gradiente vermelho (como "SALDO CONSOLIDADO" e "POS-TREINAMENTO" nos anexos)
  - Hover: hover-lift
  - Animacao: animate-fade-in com delay escalonado (staggered)

### Atualizar: `src/components/AlertCard.tsx`

- Manter estrutura
- Adicionar hover-lift
- Melhorar border-radius para rounded-xl

### Atualizar: `src/components/TopSwitch.tsx`

- Radius maior (rounded-full ja tem)
- Transicao mais suave no toggle (200ms)
- Fundo do ativo: foreground com sombra

---

## Fase 4 -- Paginas (aplicar design)

### Todas as paginas precisam de:

1. Trocar header manual por `<PageHeader>` padrao
2. Trocar h2/h3 de secoes por `<SectionHeader>`
3. Cards: classe `glass-card hover-lift`
4. Tabelas: hover na linha com `hover:bg-muted/30 transition-colors`
5. Badges: manter consistencia de cores por status
6. Animacao de entrada: container com `animate-fade-in` ou staggered delays

### Paginas a atualizar (todas):

- `Home.tsx` -- header com PageHeader, cards com hover-lift
- `FinanceiroDashboard.tsx` -- PageHeader uppercase "GESTAO FINANCEIRA", KpiCards accent, graficos com animacao de entrada
- `FinanceiroDespesas.tsx` -- PageHeader, tabela com hover
- `FinanceiroReceitas.tsx` -- idem
- `FinanceiroRepasse.tsx` -- idem
- `FinanceiroFechamentos.tsx` -- idem
- `FinanceiroConfiguracoes.tsx` -- idem
- `ContratosGerenciamento.tsx` -- PageHeader, tabela
- `ContratosGerador.tsx` -- PageHeader
- `ContratosTemplates.tsx` -- PageHeader
- `ContratosConfiguracoes.tsx` -- PageHeader
- `Marketing.tsx` -- PageHeader
- `Academy.tsx` -- PageHeader "TREINAMENTOS e ACADEMY", KpiCards
- `MetasRanking.tsx` -- PageHeader, ranking com hover
- `Unidades.tsx` -- PageHeader "UNIDADES DA REDE", tabela
- `CrmExpansao.tsx` -- PageHeader, kanban
- `Onboarding.tsx` -- PageHeader
- `Atendimento.tsx` -- PageHeader "CENTRAL DE ATENDIMENTO", chat com animacoes
- `Comunicados.tsx` -- PageHeader
- `Agenda.tsx` -- PageHeader
- `Matriz.tsx` -- PageHeader

---

## Fase 5 -- Microinteracoes e Animacoes

### Sidebar

- Hover item: `transition-all duration-150` (ja tem) + icone muda opacity
- Item ativo: pill com barra vermelha (transition background/border 150ms)

### Cards e Listas

- Cards: `hover-lift` (translateY(-2px) + shadow)
- Tabelas: `hover:bg-muted/30` na linha
- Chips/filtros: toggle com `transition-colors duration-200`

### Navegacao entre paginas

- `FranqueadoraLayout.tsx`: wrapper com key={pathname} + animate-slide-up
- Fade de 200-300ms, sem exagero

### Graficos (recharts)

- Propriedade `isAnimationActive={true}` nos componentes recharts
- `animationBegin={0}` `animationDuration={800}` `animationEasing="ease-out"`
- Apenas na primeira renderizacao

### Skeleton loaders

- Ja existe `src/components/ui/skeleton.tsx`
- Usar em paginas que carregam dados (placeholder: simular delay 0ms, skeleton visual pronto)

### Toasts

- Ja existem, manter consistencia (sonner)

---

## Fase 6 -- Bottom Sidebar (usuario)

### Arquivo: `src/components/FranqueadoraSidebar.tsx`

Adicionar secao no fundo (antes do botao collapse):

```text
+---------------------------+
| [Avatar] SOCIO NO EXCUSE  |
|          Unidade Curitiba  |
+---------------------------+
| [<>] Collapse             |
+---------------------------+
```

- Avatar circular (placeholder com iniciais)
- Nome em bold, unidade em muted
- So aparece quando sidebar expandida

---

## Ordem de Implementacao

1. `src/index.css` -- tokens dark premium, utility classes (glass-card, hover-lift, animacoes)
2. `tailwind.config.ts` -- novos keyframes e animations
3. `src/components/PageHeader.tsx` -- componente padrao (CRIAR)
4. `src/components/SectionHeader.tsx` -- componente padrao (CRIAR)
5. `src/components/KpiCard.tsx` -- redesign com accent variant e hover
6. `src/components/AlertCard.tsx` -- hover-lift e radius
7. `src/components/TopSwitch.tsx` -- polish visual
8. `src/components/FranqueadoraSidebar.tsx` -- redesign: icones vermelhos, pill ativo, area usuario, hover premium
9. `src/components/FranqueadoraLayout.tsx` -- transicao de pagina com animate
10. Todas as 20 paginas -- trocar headers por PageHeader, aplicar glass-card, hover-lift, tabela hover, staggered animations

---

## Nao muda

- Funcionalidade / logica / dados
- Estrutura de rotas
- Modo claro (mantido, mas tokens light tambem serao levemente ajustados para consistencia)


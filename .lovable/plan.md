

# Redesign Visual Completo - Estilo Premium Impactante

## Objetivo
Aplicar o estilo visual da plataforma de referencia em todas as 3 visoes (Franqueadora, Franqueado, Cliente Final), removendo todos os emojis restantes e modernizando tipografia, shapes e animacoes.

---

## 1. Sistema Tipografico e CSS Global

**Arquivo: `src/index.css`**
- Importar a fonte **Inter** com variacao completa (300-900) - ja em uso, mas ajustar os pesos
- Titulos principais: `font-black uppercase italic tracking-tighter` (estilo do design de referencia)
- Labels de KPI: `text-[10px] font-black uppercase tracking-[0.2em]` com cor `text-gray-400`
- Valores grandes: `text-3xl font-black tracking-tighter`

**Arquivo: `tailwind.config.ts`**
- Ajustar font-family para priorizar Inter em ambas sans e display
- Atualizar border-radius padrao para valores mais arredondados

**Novas classes utilitarias no CSS:**
- `.page-title` - Titulos bold, italic, uppercase, tracking-tighter (estilo dashboard de referencia)
- `.kpi-label` - Labels de metricas em 10px uppercase tracking-widest
- `.card-premium` - Cards com `rounded-[32px]` ou `rounded-[40px]`, padding generoso, hover com shadow-xl e translate-y
- `.card-dark` - Card escuro estilo agenda (bg-gray-800, texto branco, shapes decorativos)

---

## 2. Remocao Total de Emojis (17 arquivos)

Substituir todos os emojis restantes por icones Lucide ou texto limpo:

| Arquivo | Emojis | Substituicao |
|---------|--------|-------------|
| `ClienteGamificacao.tsx` | Medalhas com emoji | Icones Lucide (Target, Coins, Timer, Smartphone, BarChart3, Trophy) |
| `ClienteAgentesIA.tsx` | Tipos de agente com emoji | Icones Lucide (Target, DollarSign, Wrench, RefreshCw) |
| `ClientePlanoVendas.tsx` | Sim/Nao com emoji | Texto limpo "Sim" / "Nao" com estilo de badge |
| `ClienteConteudos.tsx` | Rocket em copy mock | Texto limpo |
| `AcademyQuiz.tsx` | Party emoji em toast | Texto "Aprovado!" limpo |
| `AcademyLesson.tsx` | Check emoji em toast | Texto limpo |
| `AcademyModuleDetail.tsx` | Party emoji | Texto limpo |
| `CrmExpansao.tsx` | Emojis em toasts | Texto limpo |
| `FranqueadoContratos.tsx` | Doc/check/link emojis | Icones Lucide (FileText, CheckCircle, Link) |
| `clienteData.ts` | Medalhas com emoji | Campo `icon` com nome de icone Lucide |
| `clienteData.ts` | Timeline e conteudos | Texto limpo |

---

## 3. Redesign dos Componentes Core

### PageHeader (`src/components/PageHeader.tsx`)
- Titulo: `text-4xl font-black text-black tracking-tighter uppercase italic`
- Subtitulo: `text-gray-400 font-medium`
- Seguindo exatamente o estilo "DASHBOARD" da referencia

### KpiCard (`src/components/KpiCard.tsx`)
- Cards com `rounded-[40px]` e padding `p-8`
- Shape decorativo no canto superior direito (circulo bg-gray-50)
- Icone em container `p-4 bg-gray-50 rounded-2xl` com hover scale
- Badge de trend em pill `bg-green-50 text-green-600 rounded-full`
- Valor com hover que muda para cor primary (`group-hover:text-primary`)

### Cards gerais (glass-card utility)
- Atualizar para `rounded-[32px]` com border sutil
- Hover: `shadow-xl` + `translate-y-[-2px]`
- Gradiente top-line no hover (`h-1 bg-gradient-to-r from-primary to-black`)

---

## 4. Componentes Especificos

### Sidebar (todas as visoes)
- Manter sidebar escura
- Section labels: `text-[10px] font-black uppercase tracking-[0.2em]` com cor muted
- Label "FRANCHISE SYSTEM" como subtitulo decorativo

### Home/Dashboard
- Aplicar grid de KPI cards com o novo estilo premium
- Card de agenda com fundo escuro `bg-gray-800 rounded-[48px]`
- Botoes com `rounded-2xl text-xs font-black uppercase tracking-widest`

### CRM, Chat e demais modulos
- Aplicar o novo border-radius e spacing
- Substituir qualquer emoji remanescente

---

## 5. Dark Mode

- Manter as variaveis CSS do dark mode existentes
- Cards premium: no dark mode usar `bg-card` com border sutil `border-white/5`
- Garantir que o hover com primary funcione em ambos os temas

---

## Detalhes Tecnicos

### Arquivos que serao modificados:
1. `src/index.css` - Novas classes utilitarias, ajuste tipografico
2. `tailwind.config.ts` - Border-radius, font weights
3. `src/components/PageHeader.tsx` - Estilo titulo impactante
4. `src/components/KpiCard.tsx` - Redesign completo do card
5. `src/pages/cliente/ClienteGamificacao.tsx` - Remover emojis
6. `src/pages/cliente/ClienteAgentesIA.tsx` - Remover emojis
7. `src/pages/cliente/ClientePlanoVendas.tsx` - Remover emojis
8. `src/pages/cliente/ClienteConteudos.tsx` - Remover emojis
9. `src/components/academy/AcademyQuiz.tsx` - Remover emojis
10. `src/components/academy/AcademyLesson.tsx` - Remover emojis
11. `src/components/academy/AcademyModuleDetail.tsx` - Remover emojis
12. `src/pages/CrmExpansao.tsx` - Remover emojis
13. `src/pages/franqueado/FranqueadoContratos.tsx` - Remover emojis
14. `src/data/clienteData.ts` - Remover emojis dos dados mock
15. `src/components/home/HomeAtalhos.tsx` - Aplicar novo estilo de cards

### Principio de design:
- Tipografia bold/italic/uppercase para titulos = impacto visual
- Rounded extremo (32-48px) nos cards = modernidade
- Shapes decorativos sutis = sofisticacao
- Tracking widest em labels = identidade premium
- Hover com scale e color transition = interatividade refinada


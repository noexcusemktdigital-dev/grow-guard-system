

## Melhorias visuais na Sidebar

### O que muda

| Melhoria | Descrição |
|----------|-----------|
| **Fundo com gradiente sutil** | Substituir cor sólida por gradiente vertical escuro (topo mais claro → base mais escura), dando profundidade sem peso |
| **Largura expandida** | De 240px para 256px — mais respiro nos textos e ícones |
| **Active state premium** | Item ativo ganha um fundo com gradiente sutil da cor primary + borda lateral com glow suave (box-shadow), substituindo a barra sólida atual |
| **Hover com micro-interação** | Ícones fazem um translateX(2px) sutil no hover, dando sensação de responsividade |
| **GPS do Negócio como card** | Ao invés de um item de menu comum, o GPS ganha um mini-card com borda gradiente amber, padding maior e ícone com pulse sutil quando incompleto |
| **Section headers com ícone decorativo** | Labels de seção ("Vendas", "Marketing", "Sistema") ganham um dot colorido antes do texto (vermelho para vendas, roxo para marketing, cinza para sistema) |
| **Borda direita com gradiente** | Substituir borda sólida por gradiente vertical transparente→primary→transparente, criando uma linha de luz sutil |
| **Logo area refinada** | Mais espaçamento vertical (h-16), logo ligeiramente maior |
| **Footer de créditos** | Barra de progresso mais espessa (h-1.5) com gradiente animado quando < 25% |
| **Botão de colapso** | Ícone com rotação suave (180deg) e hover com background circular |

### Detalhes técnicos

**Arquivo único**: `src/components/ClienteSidebar.tsx`

Mudanças CSS-only e de classes Tailwind — sem novas dependências, sem framer-motion, sem impacto em performance:

1. **`<aside>`**: `bg-sidebar` → `bg-gradient-to-b from-[hsl(225,20%,9%)] to-[hsl(225,20%,5%)]`, largura `w-[256px]`, borda direita com `border-r border-white/[0.04]`
2. **NavItem active**: adicionar `shadow-[inset_0_0_12px_rgba(var(--sidebar-primary-raw),0.08)]` e gradiente no bg
3. **NavItem hover**: `group-hover:translate-x-0.5` no ícone com `transition-transform`
4. **GPS card**: wrapper com `mx-2.5 p-2.5 rounded-xl border border-amber-500/20 bg-amber-500/[0.04]` e ícone com `animate-pulse` quando incompleto
5. **Section dots**: span com `w-1.5 h-1.5 rounded-full bg-red-400` antes do título
6. **Logo**: `h-16` no container, `h-9` na imagem
7. **Collapse button**: `rounded-full w-7 h-7` com hover `bg-white/[0.06]`

### Resultado

Sidebar com mais personalidade e profundidade visual, mantendo a performance (zero backdrop-blur, zero JS adicional, apenas classes Tailwind). O visual fica mais "app premium" sem parecer pesado.


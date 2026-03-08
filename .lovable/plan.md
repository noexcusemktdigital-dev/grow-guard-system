

## Plano: Reorganizar Contratos como 2ª ferramenta do módulo Gestão (Franqueadora + Franqueado)

### Estado Atual

- **Franqueadora**: Sidebar "Gestão" tem Contratos como submenu com 3 links (Templates, Criar, Gestão) apontando para 3 páginas separadas (`ContratosGerador`, `ContratosGerenciamento`, `ContratosTemplates`)
- **Franqueado**: Sidebar "Gestão" tem "Meus Contratos" apontando para `FranqueadoContratos` — página com 2 abas (Lista + Novo Contrato), gera apenas contratos de assessoria
- Ambos já funcionam, mas precisam de ajuste na organização

### Mudanças

#### 1. Sidebar Franqueadora — Simplificar Contratos

**Arquivo**: `src/components/FranqueadoraSidebar.tsx`

Remover os subitens (Templates, Criar, Gestão) de Contratos. Deixar como link único: `{ label: "Contratos", icon: FileText, path: "/franqueadora/contratos" }`. A página de Contratos terá 2 abas internas.

#### 2. Página Contratos Franqueadora — Unificar em 2 abas

**Arquivo**: `src/pages/ContratosGerador.tsx` → Refatorar para ser a página principal de Contratos

- **Aba "Gerar Contrato"**: Já existe com seleção de tipo (Assessoria / Franquia) + formulário + preview PDF. Manter como está.
- **Aba "Gestão"**: Trazer o conteúdo de `ContratosGerenciamento.tsx` para dentro — lista com filtros, KPIs, edição, exclusão, alertas de vencimento.

Remover a rota separada `/contratos/templates` (funcionalidade de templates já está embutida nos formulários via `contractTemplates.ts`).

#### 3. Rotas — Limpar

**Arquivo**: `src/App.tsx`

- Manter `/franqueadora/contratos` → Nova página unificada
- Remover `/franqueadora/contratos/criar` e `/franqueadora/contratos/templates`

#### 4. Franqueado — Ajuste menor

**Arquivo**: `src/pages/franqueado/FranqueadoContratos.tsx`

- Renomear abas de "Contratos" / "Novo Contrato" para **"Gerar Contrato"** / **"Gestão de Contratos"** para manter consistência
- Franqueado só gera contratos de assessoria (cliente), sem opção de franquia — já está correto

#### 5. Sidebar Franqueado — Reordenar

**Arquivo**: `src/components/FranqueadoSidebar.tsx`

Mover "Meus Contratos" para logo depois de "Minha Unidade" (já está nessa ordem, confirmar apenas).

### Arquivos afetados

| Arquivo | Ação |
|---------|------|
| `src/components/FranqueadoraSidebar.tsx` | Remover subitens de Contratos |
| `src/pages/ContratosGerador.tsx` | Unificar: 2 abas (Gerar + Gestão) |
| `src/pages/ContratosGerenciamento.tsx` | Código absorvido no Gerador, pode ser removido |
| `src/App.tsx` | Remover rotas `/contratos/criar` e `/contratos/templates` |
| `src/pages/franqueado/FranqueadoContratos.tsx` | Renomear abas para consistência |


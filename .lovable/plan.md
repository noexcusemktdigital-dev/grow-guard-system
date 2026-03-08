

## Plano: Correções e Otimizações — Franqueadora & Franqueado

### Problemas encontrados

1. **Console Error: Select ref warning** — Na `AtividadeTab` (SaasDashboard.tsx, linha 304), o `Select` recebe um ref internamente que causa warning. O fix é envolver o `SelectTrigger` corretamente (já está, mas o componente pai pode estar passando ref). Na verdade o warning é benigno do Radix, mas podemos silenciá-lo garantindo que não há ref passado.

2. **Table Fragment sem key** — No `ErrosTab` (linha 193-251), cada iteração do `errors.map` usa `<>...</>` (Fragment) sem key. O `key` está no `TableRow` filho, mas o Fragment wrapper precisa do key. Isso causa warning de React e pode causar bugs de reconciliação.

3. **FranqueadoSidebar sem botão "Sair"** — O sidebar do Franqueado tem "Meu Perfil" e "Configurações" no popover do footer, mas **não tem botão de Sair/Logout**. O FranqueadoraSidebar tem. Isso força o franqueado a não ter como deslogar.

4. **FranqueadoraSidebar sem botão "Configurações"** — Ao contrário do FranqueadoSidebar que tem "Configurações", o sidebar da Franqueadora não oferece essa opção no popover do footer.

### Mudanças

#### 1. Fix Fragment keys — `SaasDashboard.tsx`
- Linha 194: Trocar `<>` por `<Fragment key={err.id}>` e mover o `key` do `TableRow` para o Fragment.

#### 2. Fix FranqueadoSidebar — Adicionar botão Sair
- Importar `LogOut` de lucide-react e `useAuth` 
- No popover do footer (após "Configurações"), adicionar botão "Sair" chamando `signOut()`

#### 3. Fix FranqueadoraSidebar — Adicionar botão Configurações
- No popover do footer (antes de "Sair"), adicionar botão "Configurações" apontando para `/franqueadora/configuracoes` (se existir) ou `/franqueadora/matriz`

### Arquivos afetados

| Arquivo | Ação |
|---------|------|
| `src/pages/franqueadora/SaasDashboard.tsx` | Fix Fragment keys no map da ErrosTab |
| `src/components/FranqueadoSidebar.tsx` | Adicionar botão "Sair" no popover footer |
| `src/components/FranqueadoraSidebar.tsx` | Adicionar botão "Configurações" no popover footer |




# Tema Claro como Padrao + Header Completo (Notificacoes, Busca Global, Usuario)

## Resumo

Tres mudancas principais:
1. **Tema claro como padrao** em vez do dark (remover forcamento de dark mode)
2. **Header enriquecido** com icone de notificacoes, busca global e area de usuario/login
3. Aplicavel tanto na area da Franqueadora quanto do Franqueado

---

## Mudancas

### Arquivo 1: `src/pages/Index.tsx`

- Remover o `useEffect` que forca `document.documentElement.classList.add("dark")` na linha 11-13
- Reestruturar o header para incluir 3 novas areas alem do TopSwitch:
  - **Lado esquerdo**: Busca global (icone Search + input com Command+K hint)
  - **Centro**: TopSwitch (permanece)
  - **Lado direito**: Icone de Notificacoes (sino com badge de contagem) + Avatar do usuario com dropdown (nome, email, perfil, sair) + ThemeToggle

Layout do header:

```
[Search icon + input]     [FRANQUEADORA | FRANQUEADO | CLIENTE FINAL]     [Bell] [Avatar+Nome] [Sun/Moon]
```

### Arquivo 2: `src/components/ThemeToggle.tsx`

- Alterar o estado inicial padrao de `true` (dark) para `false` (light)
- Manter toda a logica de toggle funcional

### Arquivo 3: `src/components/GlobalSearch.tsx` (novo)

- Input estilizado com icone Search e placeholder "Buscar no sistema..."
- Hint visual "Ctrl+K" no canto do input
- Ao digitar, abre um dropdown (CommandDialog do cmdk) com resultados agrupados por categoria:
  - Paginas (Dashboard, CRM, Financeiro, etc.)
  - Acoes rapidas (Gerar Proposta, Novo Lead, etc.)
- Usa os dados de navegacao existentes nas sidebars para popular os resultados
- Ao selecionar, navega para a rota correspondente

### Arquivo 4: `src/components/NotificationBell.tsx` (novo)

- Icone Bell (lucide-react) com badge numerico vermelho (ex: "3")
- Ao clicar, abre Popover com lista de notificacoes recentes (mock):
  - "Novo fechamento disponivel - Fev 2026"
  - "Contrato CT-001 vencendo em 15 dias"
  - "Nova aula disponivel: Modulo Comercial"
- Cada item com icone, texto, timestamp relativo
- Link "Ver todas" no rodape

### Arquivo 5: `src/components/UserMenu.tsx` (novo)

- Avatar pequeno (iniciais "JD") + nome "Joao Demo" + seta dropdown
- Ao clicar, abre DropdownMenu com:
  - Header: nome + email (joao@unidade.com)
  - Itens: Meu Perfil, Configuracoes, Sair
  - Acoes mock (toast ao clicar)
- Exibe role dinamicamente: "Franqueadora" ou "Franqueado" conforme o nivel ativo

---

## Secao Tecnica

### Componentes UI reutilizados
- `Popover` (notificacoes)
- `DropdownMenu` (menu do usuario)
- `CommandDialog` (busca global -- ja existe em `src/components/ui/command.tsx`)
- `Avatar` (foto/iniciais do usuario)
- `Badge` (contagem de notificacoes)

### Arquivos modificados
```
src/pages/Index.tsx                    -- remover dark mode forcado, reestruturar header
src/components/ThemeToggle.tsx         -- default light
src/components/GlobalSearch.tsx        -- novo: busca global com CommandDialog
src/components/NotificationBell.tsx    -- novo: sino com popover de notificacoes
src/components/UserMenu.tsx            -- novo: avatar + dropdown de usuario
```

### Ordem de implementacao
1. `ThemeToggle.tsx` -- mudar default para light
2. `GlobalSearch.tsx` -- criar componente de busca
3. `NotificationBell.tsx` -- criar componente de notificacoes
4. `UserMenu.tsx` -- criar componente de usuario
5. `Index.tsx` -- remover dark forcado, montar header completo com os 3 novos componentes


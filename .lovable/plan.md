

# Corrigir navegação "Configurações" no portal do Cliente

## Problema

No `UserMenu`, tanto "Meu Perfil" quanto "Configurações" redirecionam para `/cliente/configuracoes`, que abre sempre na aba "Perfil". O usuário espera que "Configurações" abra na aba de organização/sistema.

## Causa raiz

- `UserMenu.tsx` linha 65: "Meu Perfil" → `/cliente/configuracoes` (correto, abre no perfil)
- `UserMenu.tsx` linha 73: "Configurações" → `/cliente/configuracoes` (deveria abrir em outra aba)
- `ClienteSidebar.tsx`: item "Configurações" → `/cliente/configuracoes` (mesmo problema)
- `ClienteConfiguracoes.tsx` linha 444: `defaultValue="perfil"` — sempre abre na aba perfil

## Correção

### 1. `ClienteConfiguracoes.tsx` — Ler tab da URL

Usar `useSearchParams` para ler um parâmetro `?tab=` e definir a aba ativa. Se `?tab=organizacao`, abrir na aba de organização. Caso contrário, manter "perfil" como padrão.

### 2. `UserMenu.tsx` — Diferenciar as rotas

- "Meu Perfil" → `/cliente/configuracoes?tab=perfil`
- "Configurações" → `/cliente/configuracoes?tab=organizacao`

### 3. `ClienteSidebar.tsx` — Atualizar path

Alterar o item "Configurações" de `/cliente/configuracoes` para `/cliente/configuracoes?tab=organizacao`.

## Arquivos afetados

| Arquivo | Ação |
|---|---|
| `src/pages/cliente/ClienteConfiguracoes.tsx` | Ler `?tab=` da URL para definir aba ativa |
| `src/components/UserMenu.tsx` | Diferenciar navegação Perfil vs Configurações |
| `src/components/ClienteSidebar.tsx` | Atualizar path do item Configurações |


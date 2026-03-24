

# Correção do Fluxo de Convite de Usuários — Franqueadora, Franquia e Cliente

## Problemas Identificados

1. **Erro "Informe o e-mail" falso**: Em `Matriz.tsx` (linha 71), a validação `if (!inviteEmail.trim() || !orgId)` mostra "Informe o e-mail" mesmo quando o problema real é `orgId` undefined. Mensagem de erro enganosa.

2. **Seletor de Times ausente**: Apenas `Matriz.tsx` tem `TeamSelector`. Os diálogos de convite em `FranqueadoConfiguracoes.tsx` e `ClienteConfiguracoes.tsx` não permitem selecionar times/funções, apesar de o hook `useOrgTeams` estar disponível.

3. **`team_ids` não enviado em vários portais**: Franqueado e Cliente não enviam `team_ids` no body da Edge Function `invite-user`, mesmo que a função suporte.

4. **URL de redirecionamento desatualizada**: A Edge Function `invite-user` usa `SITE_URL` com fallback para `grow-guard-system.lovable.app` — deveria ser o domínio correto.

5. **`UnidadeUsuariosReal.tsx` sem seletor de times**: O convite de membros de unidades também não tem seletor de times.

---

## Plano de Correção

### 1. Criar componente reutilizável `TeamSelector`

Extrair o `TeamSelector` de `Matriz.tsx` para `src/components/TeamSelector.tsx` — recebe `selectedIds`, `onToggle`, e busca teams via `useOrgTeams`. Reutilizável em todos os portais.

### 2. Corrigir validação em `Matriz.tsx`

Separar as validações:
- Se `!inviteEmail.trim()` → "Informe o e-mail"
- Se `!orgId` → "Erro: organização não encontrada. Recarregue a página."

### 3. Adicionar TeamSelector ao Franqueado (`FranqueadoConfiguracoes.tsx`)

- Importar `TeamSelector` e `useOrgTeams`
- Adicionar estado `inviteTeamIds`
- Incluir `TeamSelector` no diálogo de convite
- Enviar `team_ids` no body da chamada `invite-user`

### 4. Adicionar TeamSelector ao Cliente (`ClienteConfiguracoes.tsx`)

- Mesmo padrão: importar, adicionar estado, incluir no diálogo, enviar `team_ids`

### 5. Adicionar TeamSelector à Unidades (`UnidadeUsuariosReal.tsx`)

- Mesmo padrão para convites de membros de unidades

### 6. Atualizar URL de redirecionamento na Edge Function

- Alterar fallback `SITE_URL` de `grow-guard-system.lovable.app` para `sistema.noexcusedigital.com.br`

---

## Arquivos Afetados

| Arquivo | Ação |
|---|---|
| `src/components/TeamSelector.tsx` | **Novo** — Componente reutilizável |
| `src/pages/Matriz.tsx` | Editar — Usar componente extraído + corrigir validação |
| `src/pages/franqueado/FranqueadoConfiguracoes.tsx` | Editar — Adicionar TeamSelector + team_ids |
| `src/pages/cliente/ClienteConfiguracoes.tsx` | Editar — Adicionar TeamSelector + team_ids |
| `src/components/unidades/UnidadeUsuariosReal.tsx` | Editar — Adicionar TeamSelector + team_ids |
| `supabase/functions/invite-user/index.ts` | Editar — Atualizar SITE_URL fallback |


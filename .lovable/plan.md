
# Sincronizar Foto de Perfil em Todos os Componentes

## Problema
Quando o usuario troca a foto no perfil, ela nao aparece na sidebar nem no menu do header porque:
1. O `AuthContext` busca o perfil uma unica vez no login e nunca atualiza
2. O `UserMenu` (header) so mostra iniciais, nunca usa `avatar_url`
3. O footer da `FranqueadoraSidebar` mostra um icone generico, nunca usa `avatar_url`

## Solucao

### 1. Adicionar `refreshProfile` ao AuthContext (`src/contexts/AuthContext.tsx`)
- Expor uma funcao `refreshProfile()` no contexto que re-busca os dados do perfil no banco
- Componentes que atualizam o perfil podem chamar essa funcao para forcar a atualizacao global

### 2. Chamar `refreshProfile` apos upload de avatar (`src/hooks/useUserProfile.ts`)
- No `onSuccess` da mutation de update, alem de invalidar o query cache, chamar `refreshProfile()` do AuthContext
- Isso garante que sidebar e header recebam o novo `avatar_url` imediatamente

### 3. Mostrar avatar no UserMenu (`src/components/UserMenu.tsx`)
- Importar `AvatarImage` alem de `AvatarFallback`
- Quando `profile?.avatar_url` existir, renderizar `<AvatarImage>` com a foto
- Manter fallback com iniciais quando nao houver foto

### 4. Mostrar avatar no footer da FranqueadoraSidebar (`src/components/FranqueadoraSidebar.tsx`)
- No `SidebarFooter`, usar `profile?.avatar_url` para exibir a foto (mesmo padrao ja usado no FranqueadoSidebar)
- Quando houver foto: `<img src={profile.avatar_url}>` dentro do circulo
- Quando nao houver: manter iniciais ou icone atual

### 5. Garantir consistencia no FranqueadoSidebar (ja OK)
- O FranqueadoSidebar ja usa `profile?.avatar_url` no footer -- nenhuma alteracao necessaria
- Apenas precisa chamar `refreshProfile` para atualizar em tempo real

## Arquivos Alterados

| Arquivo | Acao |
|---------|------|
| `src/contexts/AuthContext.tsx` | Adicionar funcao `refreshProfile` ao contexto |
| `src/hooks/useUserProfile.ts` | Chamar `refreshProfile` no `onSuccess` da mutation |
| `src/components/UserMenu.tsx` | Exibir `AvatarImage` com `avatar_url` |
| `src/components/FranqueadoraSidebar.tsx` | Exibir foto no footer usando `avatar_url` |

## Resultado
Ao trocar a foto no perfil, ela aparecera instantaneamente em:
- Header (menu do usuario ao lado das notificacoes)
- Footer da sidebar (todas as plataformas)
- Pagina de perfil (ja funciona)

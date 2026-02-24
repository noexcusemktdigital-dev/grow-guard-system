
# Substituir footer do Sidebar por menu de usuario clicavel

## O que muda

Remover o link "Configuracoes" fixo e a area estatica "Davi Socio" do rodape da sidebar. No lugar, colocar uma unica area clicavel do usuario que, ao clicar, abre um popover/dropdown com duas opcoes:

- **Meu Perfil** - navega para `/franqueado/perfil`
- **Configuracoes** - navega para `/franqueado/configuracoes`

## Layout

```text
Antes:
+---------------------------+
| [Configuracoes link]      |  <- remover
+---------------------------+
| [Avatar] Davi Socio       |  <- remover (estatico)
|          Unidade Curitiba  |
+---------------------------+
| [<] Collapse              |
+---------------------------+

Depois:
+---------------------------+
| [Avatar] Davi Socio   [^] |  <- clicavel, abre popover
|          Unidade Curitiba  |
+---------------------------+
| [<] Collapse              |
+---------------------------+

Popover:
+---------------------------+
|  Meu Perfil               |
|  Configuracoes            |
+---------------------------+
```

Quando collapsed, mostra apenas o avatar clicavel com o mesmo popover.

## Detalhes tecnicos

### Arquivo: `src/components/FranqueadoSidebar.tsx`

1. Adicionar imports: `Popover`, `PopoverContent`, `PopoverTrigger` do radix, `useNavigate` do react-router-dom
2. Remover o bloco "Configuracoes link" (linhas 166-172)
3. Substituir o bloco "Footer - User" (linhas 174-186) por um componente clicavel com Popover contendo dois botoes de navegacao:
   - Icone User + "Meu Perfil" navega para `/franqueado/perfil`
   - Icone Settings + "Configuracoes" navega para `/franqueado/configuracoes`
4. Quando sidebar estiver collapsed, mostrar apenas o avatar com o mesmo popover (side="right")
5. Usar dados dinamicos do `useAuth()` para nome e unidade (em vez de "Davi Socio" hardcoded)

Apenas 1 arquivo editado.

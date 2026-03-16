

## Plano: Gerenciar e Apagar Artes no Redes Sociais

### Problema
A listagem de postagens (artes e vídeos) no SaaS não oferece opção de apagar ou gerenciar os itens. O usuário fica com postagens acumuladas sem poder removê-las.

### Solução

**1. Hook de delete (`useClientePosts.ts`)**
- Adicionar mutation `useDeletePost` que deleta o registro da tabela `client_posts` pelo ID
- Invalidar query `client-posts` após sucesso

**2. UI de gerenciamento (`ClienteRedesSociais.tsx`)**
- Adicionar botão de **modo seleção** (checkbox) no header da listagem, ao lado de "Nova Postagem"
- Em modo seleção: cada card ganha um checkbox; aparece barra de ações com "Apagar selecionados"
- Fora do modo seleção: adicionar botão de lixeira no hover de cada card (canto superior esquerdo) com confirmação via AlertDialog
- Na tela de resultado (ao clicar em um post existente): adicionar botão "Apagar" ao lado dos botões existentes (Aprovar, Download, etc.)

### Mudanças por arquivo

| Arquivo | Mudança |
|---------|---------|
| `src/hooks/useClientePosts.ts` | Novo hook `useDeletePost` — delete da tabela `client_posts` + opcional delete do arquivo no storage |
| `src/pages/cliente/ClienteRedesSociais.tsx` | Botão delete individual no hover do card + botão delete na tela de resultado + seleção em massa com barra de ações |

### Fluxo

```text
Listagem de postagens:
  - Hover no card → ícone de lixeira (canto)
  - Clique → AlertDialog "Deseja apagar esta postagem?"
  - Confirmar → deletePost.mutate(id) → remove do DB

  - Botão "Selecionar" no header → modo seleção
  - Checkboxes nos cards → selecionar múltiplos
  - Barra inferior: "X selecionados" + "Apagar selecionados"
  - Confirmar → deleta todos em sequência

Tela de resultado (post existente):
  - Botão "Apagar" com ícone Trash
  - Confirmar → deleta + volta pra listagem
```




## Problema

A classe CSS `sidebar-item-active` e usada nas sidebars do Franqueado e da Franqueadora para destacar a aba selecionada, mas **essa classe nunca foi definida em nenhum arquivo CSS**. Isso faz com que o item ativo nao tenha estilo visual adequado, ficando ilegivel contra o fundo escuro da sidebar.

## Solucao

Adicionar a definicao da classe `.sidebar-item-active` no arquivo `src/index.css`, dentro da camada `@layer utilities`, com cores que garantam contraste no fundo escuro da sidebar.

## Detalhes Tecnicos

**Arquivo:** `src/index.css`

Adicionar na secao `@layer utilities`:

```css
.sidebar-item-active {
  background: hsl(var(--sidebar-accent) / 0.12);
  color: hsl(var(--sidebar-primary));
}
```

Isso aplica:
- Fundo sutil com a cor primaria (vermelho) em baixa opacidade
- Texto na cor primaria da sidebar (vermelho), legivel contra o fundo escuro

Nenhum outro arquivo precisa ser alterado — as sidebars ja aplicam a classe corretamente.


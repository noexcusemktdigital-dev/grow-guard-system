

## Plano: Organizar entregas e limpar artes na ferramenta Redes Sociais

### Problemas identificados

1. **Cards não clicáveis**: Na view de histórico (linhas 522-548), os cards de postagens não possuem `onClick` — o usuário não consegue clicar para ver detalhes ou aprovar.
2. **Dados existentes**: Há 1 postagem na tabela `client_posts` (org NOEXCUSE). Será deletada via SQL.

### Ações

**1. Apagar todas as postagens existentes**
- DELETE de todos os registros da tabela `client_posts` para a org `adb09618-e9f3-4dbd-a89c-29e3eb1bec9f`.

**2. Tornar os cards clicáveis no histórico**
- Adicionar `onClick` nos cards da lista de postagens para abrir um estado de detalhe (reutilizar a view de resultado já existente com `setGeneratedResult`).
- Ao clicar, popular `generatedResult` com os dados do post clicado e exibir a tela de resultado (que já tem preview, botão de aprovar, download etc).

**3. Melhorar organização visual das entregas**
- Agrupar postagens por status: "Pendentes" e "Aprovadas" em seções separadas.
- Adicionar indicador visual de clicável (cursor-pointer + hover effect já existe, mas adicionar um overlay com ícone de Eye no hover).

### Arquivos a editar
- `src/pages/cliente/ClienteRedesSociais.tsx` — adicionar onClick nos cards + agrupamento por status
- SQL DELETE via insert tool para limpar os dados


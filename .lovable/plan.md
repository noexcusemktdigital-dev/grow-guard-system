

# Correcoes: Avaliacao da Equipe + Scroll do Chat

## 1. Avaliacao da Equipe na Gamificacao

Atualmente a pagina de Gamificacao (`ClienteGamificacao.tsx`) mostra apenas as estatisticas individuais do usuario logado. Nao existe uma secao de "Avaliacao da Equipe" que compare membros da organizacao.

### Correcao
Adicionar uma nova secao **"Ranking da Equipe"** abaixo das medalhas que:
- Busca todos os membros da organizacao via tabela `organization_members` + `profiles`
- Para cada membro, calcula pontos baseados nos leads do CRM (`assigned_to`)
- Exibe um ranking ordenado por pontos com avatar, nome, leads criados, leads ganhos e pontuacao total
- Destaca o usuario atual na lista
- Se a organizacao tem apenas 1 membro, mostra uma mensagem amigavel

### Dados necessarios
- Query a `organization_members` para listar membros da org
- Query a `profiles` para nomes/avatares
- Usar os `leads` ja carregados, agrupando por `assigned_to`
- Nao precisa de nova tabela/migracao -- tudo ja existe

---

## 2. Bug do Scroll nas Conversas

O problema e classico de flexbox: o `ScrollArea` com `className="flex-1"` esta dentro de um `<div className="flex flex-col h-full">`, mas sem `min-h-0` no flex child. Em CSS flexbox, um filho com `flex: 1` pode estourar o container pai se nao tiver `min-height: 0` explicito, porque o tamanho minimo padrao e `auto` (o conteudo inteiro).

Resultado: as mensagens expandem o container ao inves de ficarem dentro dele com scroll.

### Correcao
- Adicionar `min-h-0` ao `ScrollArea` na linha 389: `className="flex-1 min-h-0 whatsapp-bg"`
- Isso garante que o ScrollArea respeite o espaco disponivel e ative o scroll interno para o conteudo excedente

---

## Detalhes Tecnicos

| Arquivo | Acao |
|---------|------|
| `src/pages/cliente/ClienteGamificacao.tsx` | Adicionar secao "Ranking da Equipe" com dados reais dos membros |
| `src/components/cliente/ChatConversation.tsx` | Adicionar `min-h-0` ao ScrollArea (linha 389) |

### Sem migracoes SQL necessarias
Todos os dados ja existem nas tabelas `organization_members`, `profiles` e `crm_leads`.


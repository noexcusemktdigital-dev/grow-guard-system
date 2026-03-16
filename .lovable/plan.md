

## Playbooks & Scripts — Banco de Conhecimento da Matriz

### O que será construído

Uma nova página `/franqueadora/playbooks` acessível por todos os usuários da Matriz, funcionando como um banco de pesquisa completo com os playbooks operacionais e manuais de comunicação das funções **Performance** e **Criação**.

### Estrutura da página

```text
┌─────────────────────────────────────────────┐
│  Playbooks & Scripts                        │
│  ┌──────────────────────────────────────┐   │
│  │ 🔍 Pesquisar scripts, ações...       │   │
│  └──────────────────────────────────────┘   │
│  ┌────────────┬─────────────┐               │
│  │ Performance│   Criação   │  ← tabs       │
│  ├────────────┴─────────────┤               │
│  │ ┌─ Playbook Operacional ─────────┐  │   │
│  │ │ Accordion por seção            │  │   │
│  │ │  > Objetivo da função          │  │   │
│  │ │  > O que entrega               │  │   │
│  │ │  > Ferramentas                 │  │   │
│  │ │  > ...                         │  │   │
│  │ └───────────────────────────────┘  │   │
│  │ ┌─ Manual de Comunicação ────────┐  │   │
│  │ │  > Bloco 1 — Início            │  │   │
│  │ │    • Script 1 (expand)         │  │   │
│  │ │    • Script 2 (expand)         │  │   │
│  │ │  > Bloco 2 — Cobrança          │  │   │
│  │ │    • Script 6                  │  │   │
│  │ └───────────────────────────────┘  │   │
│  └──────────────────────────────────────┘   │
└─────────────────────────────────────────────┘
```

### Dados

O conteúdo dos 4 PDFs será hardcoded em um arquivo de constantes (`src/constants/playbooks.ts`), estruturado como arrays de seções com título, subtítulo e cards de scripts. Cada script card contém: situação, objetivo, script curto, script completo, tom ideal, erro a evitar.

Não usaremos banco de dados — é conteúdo estático da operação.

### Pesquisa

Um campo de busca no topo filtra em tempo real todos os cards visíveis (título, situação, scripts) dentro da aba ativa. Resultado vazio mostra mensagem "Nenhum script encontrado".

### Mudanças

| Arquivo | O que |
|---------|-------|
| `src/constants/playbooks.ts` | Dados estruturados dos 4 PDFs (Performance + Criação) |
| `src/pages/franqueadora/Playbooks.tsx` | Página com tabs, pesquisa e accordions |
| `src/components/FranqueadoraSidebar.tsx` | Novo item "Playbooks" na seção Marketing & Academy |
| `src/App.tsx` | Nova rota `/franqueadora/playbooks` |




## Plano: Reverter perguntas que nao fazem sentido como fechadas

### Problema

Algumas perguntas foram convertidas para fechado mas sao contextuais, unicas por negocio ou dependem de respostas anteriores, tornando opcoes fixas limitantes ou sem sentido.

---

### Mudancas em `src/components/cliente/briefingAgents.ts`

#### LUNA (Conteudos)

| Campo | Atual | Problema | Correcao |
|---|---|---|---|
| `datas` | multi-select fixo (Carnaval, Natal, etc.) | Se o usuario ja selecionou o mes (ex: Marco), mostrar "Natal" ou "Dia dos Pais" nao faz sentido | Converter para `textarea` com placeholder dinamico: "Ex: Dia da Mulher, aniversario da empresa..." |
| `destaques` | multi-select (Novo produto, Case...) | Destaques sao unicos de cada negocio a cada mes — categorias genericas limitam | Converter para `textarea` com placeholder: "Ex: Inauguracao da nova sede, lancamento do app..." |

#### THEO (Artes)

| Campo | Atual | Problema | Correcao |
|---|---|---|---|
| `promocoes` | Ja e textarea condicional | OK | Sem mudanca |
| `obs_custom` | Ja e textarea condicional | OK | Sem mudanca |

#### ALEX (Sites)

| Campo | Atual | Problema | Correcao |
|---|---|---|---|
| `diferencial` | text | Ja esta correto como texto livre (diferencial e unico) | Sem mudanca |
| `servicos` | textarea | Ja esta correto | Sem mudanca |
| `numerosImpacto` | text (condicional) | Ja esta correto — dados unicos | Sem mudanca |

#### SOFIA (Marketing)

| Campo | Atual | Problema | Correcao |
|---|---|---|---|
| `cliente_ideal` | multi-select com "Personalizar" | As opcoes genericas cobrem bem os perfis comuns, personalizar abre textarea | Sem mudanca |
| `diferencial` | multi-select | Diferenciais sao muito variados por negocio, categorias limitam a resposta real | Converter para `textarea` com placeholder: "Ex: Atendimento 24h, entrega em 2h, garantia vitalicia..." |
| `tentativas` | multi-select | As categorias (agencia, sozinho, ads) cobrem bem os cenarios comuns | Sem mudanca |

#### RAFAEL (Vendas) — Sem mudancas (ja 100% adequado)

---

### Resumo das mudancas

Apenas 3 campos precisam voltar para aberto:

1. **LUNA `datas`**: multi-select -> textarea (opcional), placeholder contextual
2. **LUNA `destaques`**: multi-select -> textarea (opcional), placeholder contextual
3. **SOFIA `diferencial`**: multi-select -> textarea, placeholder com exemplos

### Arquivo afetado

| Arquivo | Acao |
|---|---|
| `src/components/cliente/briefingAgents.ts` | Editar — converter 3 campos de select para textarea |

### O que NAO muda

- Nenhum outro arquivo alterado
- Chaves dos answers permanecem identicas (`datas`, `destaques`, `diferencial`)
- Logica de scoring, payloads e persistencia intactos
- Todas as outras perguntas fechadas continuam fechadas (estao adequadas)

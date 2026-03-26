

## Diagnóstico

O arquivo CSV modelo usa **vírgula** como separador (linha 10: `"nome,email,telefone,..."`). No Windows com locale pt-BR, o Excel espera **ponto-e-vírgula** como separador CSV, pois a vírgula é usada como separador decimal. Resultado: todos os campos aparecem concatenados numa única coluna.

## Solução

Alterar o template CSV para usar **ponto-e-vírgula** como delimitador e adicionar **BOM UTF-8** (`\uFEFF`) para garantir que acentos funcionem corretamente no Excel Windows.

### Mudanças em `src/components/crm/CrmCsvImportDialog.tsx`

1. **Template com ponto-e-vírgula** — Trocar as constantes `CSV_TEMPLATE_HEADERS` e `CSV_TEMPLATE_EXAMPLE` para usar `;` como separador
2. **BOM UTF-8** — Prefixar o conteúdo do blob com `\uFEFF` no `downloadTemplate()` para que o Excel reconheça a codificação corretamente

O parser de importação (`parseCsvText`) já faz auto-detect de delimitador (linha 52), então continua funcionando tanto para CSV com vírgula quanto com ponto-e-vírgula.

### Detalhes técnicos

```
// Antes
const CSV_TEMPLATE_HEADERS = "nome,email,telefone,empresa,cargo,origem,tags,notas";

// Depois
const CSV_TEMPLATE_HEADERS = "nome;email;telefone;empresa;cargo;origem;tags;notas";
```

```
// downloadTemplate — adicionar BOM
const content = `\uFEFF${CSV_TEMPLATE_HEADERS}\n${CSV_TEMPLATE_EXAMPLE}`;
```

Escopo mínimo: 2 constantes + 1 linha no `downloadTemplate`. Nenhum outro arquivo afetado.


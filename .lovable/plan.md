

## Plano: Corrigir importação CSV — Suporte a delimitador ponto-e-vírgula

### Causa raiz

O arquivo CSV usa **ponto-e-vírgula (`;`)** como separador de colunas (padrão brasileiro do Excel), mas o parser em `CrmCsvImportDialog.tsx` só reconhece **vírgula (`,`)**. Resultado: a linha inteira vira uma única coluna, o campo `name` fica vazio após o mapeamento, e o parser descarta todas as linhas → "Nenhum contato encontrado".

### Solução

Detectar automaticamente o delimitador na primeira linha (header). Se o header contiver mais `;` que `,`, usar `;` como separador. Isso resolve tanto CSVs brasileiros (`;`) quanto o formato internacional (`,`).

### Mudança

| Arquivo | Mudança |
|---------|---------|
| `src/components/crm/CrmCsvImportDialog.tsx` | Detectar delimitador (`;` ou `,`) e usá-lo no parse de headers e linhas |

### Código

Na função `parseCsvText`, antes de fazer o split dos headers:

```typescript
function parseCsvText(text: string): { headers: string[]; rows: ParsedRow[] } {
  const lines = text.split("\n").filter(l => l.trim());
  if (lines.length < 2) return { headers: [], rows: [] };

  // Auto-detect delimiter: semicolon (BR Excel) vs comma
  const firstLine = lines[0];
  const delimiter = (firstLine.split(";").length > firstLine.split(",").length) ? ";" : ",";

  const rawHeaders = firstLine.split(delimiter).map(h => h.trim().toLowerCase().replace(/['"]/g, ""));
  const mappedHeaders = rawHeaders.map(h => COLUMN_MAP[h] || h);

  const rows: ParsedRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const values: string[] = [];
    let current = "";
    let inQuotes = false;
    for (const char of lines[i]) {
      if (char === '"') { inQuotes = !inQuotes; continue; }
      if (char === delimiter && !inQuotes) { values.push(current.trim()); current = ""; continue; }
      current += char;
    }
    values.push(current.trim());

    const row: any = { name: "", email: "", phone: "", company: "", position: "", source: "", tags: "", notes: "" };
    mappedHeaders.forEach((h, idx) => {
      if (row.hasOwnProperty(h)) row[h] = values[idx] || "";
    });
    if (row.name) rows.push(row);
  }
  return { headers: mappedHeaders, rows };
}
```

Mudança cirúrgica: apenas detectar o delimitador e usá-lo nos dois splits (header + valores).


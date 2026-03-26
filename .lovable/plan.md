

## Corrigir CSV + Adicionar Exportação PDF nos Relatórios

### Problema
1. O CSV usa vírgula como separador e não tem BOM UTF-8 — no Windows/Excel pt-BR, tudo aparece numa linha só
2. Não existe opção de exportar em PDF com os gráficos visuais

### Solução

**1. Corrigir `downloadCsv`** (linha 28-34)
- Trocar separador de `,` para `;`
- Adicionar BOM UTF-8 (`\uFEFF`) no início do arquivo
- Mesma correção já aplicada no template de importação CSV

**2. Adicionar exportação PDF com html2pdf.js**
- Criar função `downloadReportPdf(tabName)` que captura o conteúdo visual da aba ativa (KPIs + gráficos) e gera um PDF completo
- Usar `html2pdf.js` (já instalado no projeto, usado em contratos)
- O PDF incluirá: cabeçalho com título/período, todos os KPIs e gráficos renderizados

**3. Substituir botão único por dropdown com 2 opções**
- Em cada aba (CRM, Chat, Agentes IA), trocar o botão "Exportar" por um `DropdownMenu` com:
  - "Exportar CSV" — dados tabulares
  - "Exportar PDF" — relatório visual completo com gráficos

### Detalhes técnicos

**CSV fix:**
```typescript
function downloadCsv(filename: string, headers: string[], rows: string[][]) {
  const csv = [headers.join(";"), ...rows.map(r => r.map(c => `"${(c ?? "").replace(/"/g, '""')}"`).join(";"))].join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  // ...
}
```

**PDF export:**
```typescript
async function downloadReportPdf(containerId: string, title: string) {
  const { default: html2pdf } = await import("html2pdf.js");
  const element = document.getElementById(containerId);
  // Capture full tab content as PDF with A4 format
}
```

**UI — DropdownMenu em cada aba:**
```tsx
<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button variant="outline" size="sm"><Download /> Exportar</Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent>
    <DropdownMenuItem onClick={exportCsv}>CSV (planilha)</DropdownMenuItem>
    <DropdownMenuItem onClick={exportPdf}>PDF (relatório visual)</DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```

### Arquivo afetado
- `src/pages/cliente/ClienteDashboard.tsx` — corrigir `downloadCsv`, adicionar `downloadReportPdf`, substituir botões de export por dropdown nas 3 abas


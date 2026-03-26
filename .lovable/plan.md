

## Corrigir PDF em Branco no Dashboard

### Problema
O `html2canvas` não consegue renderizar o conteúdo porque:
1. O wrapper é posicionado em `left:-9999px` (off-screen) — `html2canvas` não renderiza elementos fora da tela corretamente
2. O app usa dark mode — o clone herda cores claras/transparentes que ficam invisíveis no fundo branco
3. Os gráficos Recharts (SVG) não clonam bem como HTML estático

### Solução

Reescrever `downloadReportPdf` usando abordagem de captura direta com `html2canvas` + `jsPDF`:

1. Capturar o elemento **visível na tela** com `html2canvas` diretamente (sem clonar nem mover off-screen)
2. Configurar `html2canvas` com `backgroundColor: "#ffffff"` para forçar fundo branco
3. Usar `jsPDF` para montar o PDF com:
   - Header com nome da organização, título do relatório e data
   - A imagem capturada do conteúdo, com paginação automática se ultrapassar uma página A4
4. Esconder temporariamente os botões de export (via CSS class) antes da captura e restaurar depois

**Fluxo:**
```text
1. Adicionar classe CSS "pdf-exporting" ao container
   → CSS hide botões [data-pdf-hide], dropdwon triggers
2. html2canvas captura o elemento VISÍVEL
3. Remover classe "pdf-exporting"
4. Montar PDF com jsPDF: header + imagem paginada
5. Salvar
```

**Mudanças concretas em `ClienteDashboard.tsx`:**
- Substituir `html2pdf.js` por `html2canvas` + `jsPDF` importados separadamente
- Adicionar `data-pdf-hide` nos botões de export (já parcialmente existe)
- Adicionar CSS temporário via classe no container para esconder botões durante captura
- Calcular paginação: `imgHeight > pageHeight` → `addPage()` + continuar desenhando

### Arquivo afetado
- `src/pages/cliente/ClienteDashboard.tsx` — reescrever função `downloadReportPdf`
- `src/index.css` — adicionar regra `.pdf-exporting [data-pdf-hide] { display: none !important; }`


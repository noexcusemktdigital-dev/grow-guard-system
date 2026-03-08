

## Plano: Edição pós-diagnóstico, Exportação PDF e Upload de Briefing

### 3 Funcionalidades

**1. Editar respostas e regenerar — já existe parcialmente**
O botão "Editar e Regenerar" já está na sheet de detalhes (`MeusDiagnosticosTab`, linha 937). O fluxo abre o `DiagnosticForm` com `initialAnswers` e chama `useRegenerateStrategy`. Vou garantir que esse botão esteja mais visível e funcione corretamente no fluxo completo.

**2. Exportar PDF**
Adicionar botão "Exportar PDF" na view de resultado (tanto na sheet de detalhes quanto após gerar um novo). Usar `html2pdf.js` (já instalado no projeto) para capturar o conteúdo do `StrategyResultView` e gerar PDF com título e data.

**3. Dois modos de criação: Manual vs Upload de Briefing**
Na tab "Novo Diagnóstico", antes de iniciar, exibir uma tela de escolha:
- **Preenchimento Manual** → fluxo atual com 8 blocos step-by-step
- **Upload de Briefing** → upload de arquivo `.txt`, `.pdf` ou `.docx` + campo de título → envia o texto para uma nova edge function `extract-strategy-answers` que usa IA para mapear o conteúdo às perguntas do diagnóstico → retorna as respostas preenchidas → abre o formulário já preenchido para revisão → usuário confirma e gera

### Mudanças por arquivo

| Arquivo | Ação |
|---|---|
| `src/pages/franqueado/FranqueadoEstrategia.tsx` | Tela de escolha Manual/Upload, botão PDF, melhorar botão Editar |
| `supabase/functions/extract-strategy-answers/index.ts` | Nova edge function: recebe texto bruto, retorna objeto de respostas mapeado aos 8 blocos |
| `supabase/config.toml` | Adicionar `[functions.extract-strategy-answers]` com `verify_jwt = false` |

### Detalhes técnicos

**Edge function `extract-strategy-answers`**:
- Recebe `{ text: string }` (conteúdo do arquivo)
- Usa Lovable AI (gemini-3-flash-preview) com tool calling
- O tool schema espelha as keys do formulário (produto_servico, ticket_medio, etc.)
- Retorna `{ answers: Record<string, any> }` já no formato que o `DiagnosticForm` aceita
- Instrui a IA a extrair e mapear, usando "N/A" para campos não encontrados

**Upload de arquivo no frontend**:
- Input `type="file"` aceita `.txt,.pdf,.docx`
- Para `.txt`: lê com `FileReader.readAsText()`
- Para `.pdf`: usa `html2pdf.js` (ou simplesmente lê como texto — limitação)
- Melhor abordagem: enviar o arquivo como base64 na request e deixar a IA processar o texto

**Exportação PDF**:
- Wrapper div com `ref` no `StrategyResultView`
- `html2pdf().from(element).set({ margin: 10, filename, ... }).save()`


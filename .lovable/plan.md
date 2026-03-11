

## Análise: Contratos — Status Atual e Melhorias Necessárias

### O que já funciona
- **PDF em A4**: Sim, ambos os arquivos (`ContratosGerador.tsx` e `FranqueadoContratos.tsx`) já geram PDF em formato A4 via `jsPDF: { unit: "mm", format: "a4", orientation: "portrait" }`.
- **Logo no PDF**: A logo NoExcuse já é embutida via Base64 no cabeçalho do HTML antes da conversão para PDF.
- **Salvar no sistema**: Contratos são salvos no banco (tabela `contracts`) com status "draft" ou "active".
- **Download**: Botão de download PDF disponível na tabela de gestão.

### O que precisa melhorar
O design atual do PDF é **muito simples** — apenas logo pequena, título e texto corrido com fonte serifada. Falta um **timbrado profissional** com identidade visual marcante.

### Plano de Melhoria Visual do PDF

Criar um timbrado profissional compartilhado entre Franqueadora e Franqueado, refatorando a função `formatContractHtml` em um utilitário único:

**Novo design do timbrado:**
- **Header**: Faixa escura (#111) com logo NoExcuse à esquerda e dados da empresa à direita (CNPJ, endereço, contato)
- **Linha decorativa**: Gradiente laranja/dourado abaixo do header (cor da marca)
- **Título do contrato**: Centralizado com badge de tipo (Franquia/Assessoria)
- **Corpo**: Mantém tipografia serifada, texto justificado, cláusulas com destaque
- **Footer**: Linha separadora + "NOEXCUSE Marketing Digital" + data de geração + numeração de página
- **Bordas laterais sutis**: Linha fina cinza nas laterais para enquadramento

**Arquivos a editar:**
1. **Criar** `src/lib/contractPdfTemplate.ts` — função `formatContractHtml` e `downloadContractPdf` reutilizáveis
2. **Editar** `src/pages/ContratosGerador.tsx` — importar do utilitário, remover funções duplicadas
3. **Editar** `src/pages/franqueado/FranqueadoContratos.tsx` — importar do utilitário, remover funções duplicadas

**Preview in-app**: Atualizar o preview do contrato (atualmente `<pre>` com texto puro) para renderizar o HTML formatado usando `dangerouslySetInnerHTML`, mostrando exatamente como ficará o PDF.


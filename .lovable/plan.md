

## Plano: Padronizar Contrato do Franqueado com Template Fixo e Diagramacao Profissional

### Objetivo

Toda criacao de contrato pelo franqueado segue obrigatoriamente o modelo "Contrato de Prestacao de Servico" enviado. O formulario exibe apenas os campos editaveis (dados do contratante, servicos, valores, datas). O PDF gerado tem diagramacao profissional com logo NoExcuse.

---

### Mudanca 1: Reescrever o formulario de criacao (ContractForm)

**Arquivo**: `src/pages/franqueado/FranqueadoContratos.tsx`

Substituir o formulario atual por um formulario baseado nos placeholders do template de servico:

**Campos editaveis (agrupados em cards)**:
- **Dados do Contratante**: Razao Social, CNPJ, Endereco, Bairro, CEP, Cidade, Estado
- **Servicos e Prazo**: Descricao dos servicos (textarea), Prazo em meses
- **Valores**: Valor Setup, Setup por extenso, Valor Mensal, Mensal por extenso, Dia de vencimento
- **Data**: Data da assinatura

Remover: selecao de lead obrigatorio, selecao de proposta obrigatoria (simplificar — o franqueado preenche direto os dados do cliente).

**Preview em tempo real**: Abaixo do formulario, mostrar uma aba "Visualizar Contrato" que renderiza o template com os dados preenchidos (usando `renderPreview` adaptado).

Ao salvar, o campo `content` do contrato armazena o texto completo com os placeholders substituidos pelos valores reais.

---

### Mudanca 2: Reescrever a geracao de PDF com diagramacao profissional

**Arquivo**: `src/pages/franqueado/FranqueadoContratos.tsx` (funcao `downloadContractPdf`)

Substituir o HTML inline generico por um layout profissional:

- **Cabecalho**: Logo NoExcuse (importar `logo-noexcuse.png` como base64 inline no HTML) + titulo "CONTRATO DE PRESTACAO DE SERVICO" centralizado
- **Corpo**: Texto completo do contrato salvo no campo `content`, formatado com paragrafos, clausulas numeradas, margens adequadas
- **Tipografia**: Font-family serif (Georgia/Times), tamanho 12px corpo, 14px titulos de clausulas
- **Rodape**: Area de assinaturas com linhas, nomes das partes e testemunhas
- **Marca d'agua sutil**: "NOEXCUSE" em cinza claro no fundo (opcional)

Usar `html2pdf.js` com configuracao A4, margens de 20mm.

---

### Mudanca 3: Converter logo para uso inline no PDF

Como `html2pdf.js` precisa de imagens inline (base64) para funcionar no PDF, criar uma funcao utilitaria que converte o logo para base64 via canvas, ou embutir a logo diretamente como constante base64 no arquivo.

**Abordagem**: Importar `logo-noexcuse.png` e usar `fetch` + `FileReader` para converter em runtime antes de gerar o PDF.

---

### Resumo de Arquivos

| Arquivo | Acao |
|---|---|
| `src/pages/franqueado/FranqueadoContratos.tsx` | Reescrever: formulario com campos fixos do template de servico, preview em tempo real, PDF com diagramacao profissional e logo |

### Detalhes Tecnicos

- Importar `SERVICE_PLACEHOLDERS` e `SERVICE_CONTENT` de `contractTemplates.ts`
- O formulario mapeia cada placeholder para um input editavel
- Ao salvar, substituir todos os `{{placeholder}}` pelos valores do formulario e gravar no campo `content`
- O PDF usa o `content` salvo (texto final) com formatacao HTML profissional
- Campos como `monthly_value`, `duration_months`, `payment_day` continuam sendo gravados nas colunas dedicadas para KPIs
- Remover dependencia de `useCrmLeads` e `useCrmProposals` do formulario (simplificar)


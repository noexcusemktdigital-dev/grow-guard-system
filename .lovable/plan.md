

# Atualizar Calculadora NOE com Valores Exatos e Proposta PDF

## Resumo

Duas grandes mudancas:
1. Substituir todos os valores, nomes, descricoes e tipos de quantidade dos servicos na calculadora para ficarem identicos ao projeto "calculadora NOE" de referencia
2. Adicionar geracao de proposta em PDF no formato identico ao anexo (com logo NOEXCUSE, tabela Servico/Tipo/Qtd/Valor, Resumo Financeiro, forma de pagamento, duracao do projeto)

## O que muda

### 1. Dados dos servicos (valores, tipos de quantidade, pacotes)

O modelo atual usa tipo simples (unitario/mensal com quantidade generica). O projeto de referencia usa tipos mais ricos:

- `single` -- sem quantidade (ex: Logo + Manual = R$ 2.500)
- `quantity` -- quantidade livre com min/max (ex: Material de Marca = R$ 200/peca)
- `package` -- pacotes fixos como 2, 4, 6, 8, 10, 12 (ex: Artes = R$ 85/arte)
- `youtube_time` -- tempo em minutos com preco calculado (ex: Edicao YouTube = R$ 250 por 2 min)
- `toggle` -- liga/desliga simples

**Exemplos de correcoes de preco:**
- Artes (Criativos Organicos): R$ 1.500 atualmente, correto = R$ 85/arte (pacote 2-12)
- Videos (Reels): R$ 2.000 atualmente, correto = R$ 150/video (pacote 2-12)
- Gestao de Trafego Meta: R$ 2.000 atualmente, correto = R$ 900/conta
- Logo + Manual de Marca: R$ 3.500 atualmente, correto = R$ 2.500
- E todos os demais servicos ajustados conforme dados da calculadora

### 2. Proposta PDF

No Step 3 (Resumo), ao clicar "Gerar Proposta", alem de salvar na lista, gera um preview da proposta no estilo do PDF anexado, com botao "Baixar PDF" usando `html2pdf.js`:

- Cabecalho: logo NOEXCUSE + "Proposta Comercial" + data
- "Preparado para:" + nome do cliente
- "Duracao do Projeto" (6 ou 12 meses)
- Servicos agrupados por modulo com tabela: Servico | Tipo | Qtd | Valor
- Resumo Financeiro: Total Unitario + Total Mensal
- Investimento: forma de pagamento (A Vista, 3x, 6x) com simulacao de parcelas
- Rodape: "Proposta gerada automaticamente pela Calculadora NOEXCUSE / Valida por 30 dias"

### 3. Wizard atualizado

- **Step 1**: Selecao de servicos com suporte a pacotes (2,4,6,8,10,12), quantidade com min/max, e YouTube time
- **Step 2**: Duracao do projeto (6 ou 12 meses) + forma de pagamento (A Vista, 3x, 6x) -- substitui os campos de excedente/emissor/recorrencia que sao internos da franquia
- **Step 3**: Resumo + preview da proposta + nome do cliente + Baixar PDF

---

## Secao Tecnica

### Arquivos modificados

```
src/pages/franqueado/FranqueadoPropostas.tsx  -- reescrever modulosNOE, tipos, wizard steps, adicionar geracao PDF
```

### Estrutura de dados atualizada

```text
ServicoNOE {
  id, nome, descricao, preco: number,
  tipo: 'unitario' | 'mensal',
  tipoQuantidade: 'single' | 'quantity' | 'package' | 'youtube_time',
  pacotes?: number[],        // ex: [2,4,6,8,10,12]
  minQuantidade?: number,
  maxQuantidade?: number,
  unidade?: string,           // ex: 'arte', 'conta', 'pagina'
}
```

### Todos os servicos com valores corretos (copiados da referencia)

**Branding:**
- Logo + Manual de Marca: R$ 2.500 (single, unitario)
- Material de Marca: R$ 200/peca (quantity 1-50, unitario)
- Midia Off: R$ 200/peca (quantity 1-50, unitario)
- Naming: R$ 1.500 (single, unitario)
- Registro INPI: R$ 3.500 (single, unitario)
- Ebook: R$ 0 (single, unitario)
- Apresentacao Comercial: R$ 0 (single, unitario)

**Social Media:**
- Artes (Criativos Organicos): R$ 85/arte (package [2,4,6,8,10,12], mensal)
- Videos (Reels): R$ 150/video (package [2,4,6,8,10,12], mensal)
- Programacao Meta: R$ 100/conta (quantity 1-10, mensal)
- Programacao LinkedIn: R$ 100/conta (quantity 1-10, mensal)
- Programacao TikTok: R$ 100/conta (quantity 1-10, mensal)
- Programacao YouTube: R$ 100/conta (quantity 1-10, mensal)
- Capa de Destaques: R$ 100 (single, unitario)
- Criacao de Avatar: R$ 20 (single, unitario)
- Template Canva: R$ 100 (single, unitario)
- Edicao de Video YouTube: preco calculado por tempo (youtube_time, unitario)

**Performance:**
- Gestao de Trafego Meta: R$ 900/conta (quantity 1-10, mensal)
- Gestao de Trafego Google (inclui YouTube): R$ 900/conta (quantity 1-10, mensal)
- Gestao de Trafego LinkedIn: R$ 900/conta (quantity 1-10, mensal)
- Gestao de Trafego TikTok: R$ 900/conta (quantity 1-10, mensal)
- Configuracao Google Meu Negocio: R$ 450 (single, unitario)
- Artes de Campanha: R$ 85/arte (package [2,4,6,8,10,12], mensal)
- Videos de Campanha: R$ 150/video (package [2,4,6,8,10,12], mensal)

**Web:**
- Pagina de Site + SEO: R$ 850/pagina (quantity 3-20, unitario)
- Landing Page Link na Bio: R$ 800 (single, unitario)
- Landing Page VSL: R$ 1.800 (single, unitario)
- Landing Page Vendas: R$ 1.600 (single, unitario)
- Landing Page Captura: R$ 1.600/LP (quantity 1-10, unitario)
- Landing Page Ebook: R$ 1.600 (single, unitario)
- Alterar Contato: R$ 50/alteracao (quantity 1-20, unitario)
- Alterar Secao: R$ 120/alteracao (quantity 1-20, unitario)
- E-commerce WooCommerce: R$ 4.500 (single, unitario)

**Dados / CRM:**
- Configuracao CRM + Acompanhamento (RD Station): R$ 1.000 (single, unitario)
- Fluxo/Funil (Etapas de venda + roteiro comercial): R$ 600 (single, unitario)

### Wizard redesenhado

**Step 1 - Servicos**: Igual ao atual, mas com suporte a pacotes (Select com opcoes 2/4/6/8/10/12), quantidade com min/max, e YouTube time selector

**Step 2 - Investimento**: 
- Duracao: 6 ou 12 meses (botoes)
- Forma de pagamento: A Vista / 3x / 6x (cards visuais)
- Preview: simulacao de valores por mes

**Step 3 - Proposta**:
- Input nome do cliente
- Preview visual da proposta (estilo PDF)
- Botao "Baixar PDF" (usando html2pdf.js)
- Botao "Salvar Proposta" (adiciona na lista)

### Dependencia

Instalar `html2pdf.js` para geracao de PDF no navegador.

### Ordem de implementacao

1. Atualizar tipos e dados dos servicos com valores exatos
2. Atualizar componente ServicoItem para suportar pacotes/quantity/youtube_time
3. Redesenhar Step 2 (duracao + pagamento)
4. Criar Step 3 com preview de proposta e geracao PDF
5. Testar fluxo completo


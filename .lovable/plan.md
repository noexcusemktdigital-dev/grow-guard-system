

# Rewrite Calculadora e Proposta -- Estilo Calculadora NOE

## Objetivo

Reescrever a aba "Calculadora" do Gerador de Proposta para seguir exatamente o layout e estrutura de servicos do site de referencia (calcculadoranoe.lovable.app), mantendo a parte de excedente que ja existe no sistema atual.

---

## O que muda

### Layout da Calculadora (aba "Calculadora")

**ANTES**: Grid simples com 7 checkboxes genericos (Marketing Digital, SEO, Trafego, etc.) e valor fixo por item.

**DEPOIS**: Servicos organizados por modulos em **Accordion** (colapsaveis), cada modulo com header colorido (vermelho), icone e descricao. Dentro de cada modulo, cada servico tem:
- Nome do servico
- Badge "Unitario" ou "Mensal"
- Descricao detalhada (texto truncado com expand)
- Switch (toggle) para ativar/desativar

### Modulos e Servicos (conforme referencia)

**Branding** (Identidade visual e materiais de marca)
- Logo + Manual de Marca (Unitario)
- Material de Marca (Unitario)
- Midia Off (Unitario)
- Naming (Unitario)
- Registro INPI (Unitario)
- Ebook (Unitario)
- Apresentacao Comercial (Unitario)

**Social Media** (Conteudo organico e gestao de redes sociais)
- Artes / Criativos Organicos (Mensal)
- Videos / Reels (Mensal)
- Programacao Meta (Mensal)
- Programacao LinkedIn (Mensal)
- Programacao TikTok (Mensal)
- Programacao YouTube (Mensal)
- Capa de Destaques (Unitario)
- Criacao de Avatar (Unitario)
- Template Canva (Unitario)
- Edicao de Video YouTube (Unitario)

**Performance** (Gestao de trafego pago e campanhas)
- Gestao de Trafego Meta (Mensal)
- Gestao de Trafego Google (Mensal)
- Gestao de Trafego LinkedIn (Mensal)
- Gestao de Trafego TikTok (Mensal)
- Configuracao Google Meu Negocio (Unitario)
- Artes de Campanha (Mensal)
- Videos de Campanha (Mensal)

**Web** (Sites, landing pages e e-commerce)
- Pagina de Site + SEO (Unitario)
- Landing Page Link na Bio (Unitario)
- Landing Page VSL (Unitario)
- Landing Page Vendas (Unitario)
- Landing Page Captura (Unitario)
- Landing Page Ebook (Unitario)
- Alterar Contato (Unitario)
- Alterar Secao (Unitario)
- E-commerce WooCommerce (Unitario)

**Dados / CRM** (Configuracao de CRM e automacoes)
- Configuracao CRM + Acompanhamento RD Station (Unitario)
- Fluxo/Funil - Etapas de venda + roteiro comercial (Unitario)

Cada servico tera um valor pre-definido (mock) que sera somado ao valor base quando selecionado.

### Secao de Valores (mantida + melhorada)

Abaixo dos modulos accordion, a secao "Valores" permanece com:
- Toggle "Valor base manual" (se nao, calcula pela soma dos servicos selecionados)
- Valor Base (R$)
- **Excedente (R$)** -- campo que NAO existe na referencia, mas deve continuar aqui
- Recorrencia (mensal/trimestral/semestral/anual)
- Prazo (6/12/18/24 meses)
- Emissor da cobranca (Franqueado / Matriz)

### Resumo Financeiro (mantido)

Card de resumo com:
- Valor Total
- Repasse 20%
- Projecao Unidade
- Impacto 12 meses

### Resumo de Servicos Selecionados

Antes do botao "Gerar Proposta", exibir lista dos servicos selecionados com seus valores, similar ao rodape da referencia ("Nenhum servico selecionado" quando vazio).

### Aba Estrategia e Lista de Propostas

Permanecem inalteradas.

---

## Secao Tecnica

### Componentes utilizados
- `Accordion` (radix) para os modulos colapsaveis
- `Switch` (radix) para toggle de cada servico em vez de Checkbox
- `Badge` para "Unitario" / "Mensal"
- Os demais componentes (Card, Input, Select, etc.) permanecem

### Dados dos servicos

Criar um array `servicosNOE` diretamente no arquivo `FranqueadoPropostas.tsx` com a estrutura:

```ts
type ServicoNOE = {
  id: string;
  nome: string;
  tipo: "unitario" | "mensal";
  descricao: string;
  valor: number;
};

type ModuloNOE = {
  id: string;
  nome: string;
  descricao: string;
  icone: string; // lucide icon name
  servicos: ServicoNOE[];
};
```

### Arquivo modificado

```
src/pages/franqueado/FranqueadoPropostas.tsx    -- rewrite da aba Calculadora
```

Nenhum outro arquivo e alterado.

### Logica de calculo

- `valorCalculado` = soma dos valores dos servicos selecionados (servicos mensais somam direto, unitarios somam direto tambem)
- `valorFinal` = valorBaseManual ? valorBase : valorCalculado (igual ao atual)
- `excedente`, `repasse20`, `projecaoUnidade`, `impacto12` = logica atual mantida integralmente

### Ordem de implementacao

1. Substituir o array `entregasDisponiveis` pelo novo `modulosNOE` com todos os servicos detalhados
2. Reescrever a secao de entregas na aba Calculadora usando Accordion + Switch
3. Adicionar secao "Servicos Selecionados" (resumo) antes do botao Gerar Proposta
4. Manter inalterados: aba Estrategia, detalhe da proposta, lista de propostas, dialogs


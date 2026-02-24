

# Playbooks Comerciais + Calculadora NOE Original

Duas mudancas combinadas: (1) adicionar aba "Playbooks" na Prospeccao IA com conteudo estatico, e (2) substituir a calculadora atual de Propostas pela calculadora original do projeto [Remix of Strategic Proposal Builder](/projects/87db4516-48da-46f8-be29-a49dd25e2551).

---

## 1. Substituir a Calculadora de Propostas

A calculadora atual em `FranqueadoPropostas.tsx` e simplificada e nao suporta os tipos de quantidade corretos (package, youtube_time, toggle, quantity). Sera substituida pela calculadora original que tem:

- **Catalogo completo** com ~35 servicos reais NOEXCUSE (Branding, Social Media, Performance, Web, Dados/CRM)
- **Tipos de precificacao variados**: single (preco fixo), quantity (preco x quantidade), package (pacotes de 2-12 unidades), youtube_time (tabela por minuto)
- **Selecao por Switch** com cards detalhados mostrando descricao do servico
- **Modulos em Accordion** (expansiveis/retraiveis)
- **Duracao do projeto**: 1 mes (entrega unica), 6 meses, 12 meses
- **Simulacao de pagamento**: A vista, 3x ou 6x -- com diluicao do unitario no mensal
- **Resumo visual** com totais unitario vs mensal
- **Gerador de PDF** com identidade NOEXCUSE (logo, tabelas, fluxo de pagamento)
- **Drawer de detalhe** para revisar selecao lateral

### Arquivos envolvidos

| Arquivo | Acao |
|---------|------|
| `src/data/services.ts` | **Novo** -- catalogo completo de servicos (copiado do projeto original) |
| `src/hooks/useCalculator.ts` | **Novo** -- hook com logica de selecao, totais, schedule e localStorage |
| `src/components/calculator/ServiceCard.tsx` | **Novo** -- card de servico com switch e controles de quantidade/pacote/youtube |
| `src/components/calculator/ModuleAccordion.tsx` | **Novo** -- accordion de modulos |
| `src/components/calculator/PaymentSimulation.tsx` | **Novo** -- selecao de forma de pagamento (a vista, 3x, 6x) |
| `src/components/calculator/DurationSelector.tsx` | **Novo** -- selecao de duracao (1, 6, 12 meses) |
| `src/components/calculator/ProposalSummary.tsx` | **Novo** -- resumo com servicos agrupados e totais |
| `src/components/calculator/ProposalGenerator.tsx` | **Novo** -- preview da proposta + gerador de PDF |
| `src/components/calculator/SummaryDrawer.tsx` | **Novo** -- drawer lateral com resumo |
| `src/constants/noeServices.ts` | **Remover** -- substituido por `src/data/services.ts` |
| `src/pages/franqueado/FranqueadoPropostas.tsx` | **Reescrita** -- integrar a calculadora original na aba "Calculadora" mantendo a aba "Propostas" |

A adaptacao principal sera:
- Remover estilos `noexcuse-*` (cores do projeto original) e usar o tema atual do sistema (classes CSS do Tailwind/shadcn)
- Integrar com `useCrmProposals` para salvar propostas no banco
- Manter vinculo com lead_id do CRM
- Copiar o logo `logo-noexcuse.png` para o projeto para uso no PDF

---

## 2. Adicionar Aba "Playbooks" na Prospeccao IA

### Tabs atualizadas
```
Nova Prospeccao | Playbooks | Historico | Scripts
```

### Conteudo: 8 Playbooks estaticos

| Playbook | Categoria | Conteudo principal |
|----------|-----------|-------------------|
| Primeiro Contato | Abordagem | Checklist pre-contato, scripts telefone + WhatsApp, erros comuns |
| Follow-up Estrategico | Abordagem | Cadencia dia 1/3/7/14, templates por canal, quando parar |
| Qualificacao de Lead | Analise | BANT adaptado, sinais de compra, perguntas-chave |
| Quebra de Objecoes | Objecoes | 15+ objecoes com respostas, tecnicas (feel-felt-found, reversa) |
| Agendamento de Reuniao | Abordagem | Frases de fechamento, contorno de "me manda por email" |
| Diagnostico Comercial | Analise | Roteiro de reuniao, perguntas-chave, como apresentar valor |
| Negociacao e Fechamento | Fechamento | Ancoragem, urgencia, lidar com "ta caro", tecnicas de fechamento |
| Reativacao de Contatos | Abordagem | Scripts para leads frios, abordagem por tempo sem contato |

### Arquivos envolvidos

| Arquivo | Acao |
|---------|------|
| `src/constants/prospectionPlaybooks.ts` | **Novo** -- dados estaticos dos 8 playbooks |
| `src/pages/franqueado/FranqueadoProspeccaoIA.tsx` | **Editar** -- adicionar aba "Playbooks" com listagem + Sheet de detalhe |

### Funcionalidades da aba
- Cards com icone, titulo, categoria e descricao
- Filtro por categoria (Abordagem, Analise, Objecoes, Fechamento)
- Clicar abre Sheet lateral com conteudo completo
- Scripts com botao "Copiar"
- Checklists e dicas em destaque
- 100% estatico, sem banco de dados, sem IA

---

## Ordem de implementacao

1. Copiar asset `logo-noexcuse.png` do projeto original
2. Criar `src/data/services.ts` (catalogo de servicos completo)
3. Criar `src/hooks/useCalculator.ts` (hook de logica)
4. Criar todos os componentes em `src/components/calculator/`
5. Reescrever `FranqueadoPropostas.tsx` com a calculadora real
6. Criar `src/constants/prospectionPlaybooks.ts`
7. Editar `FranqueadoProspeccaoIA.tsx` para incluir aba Playbooks


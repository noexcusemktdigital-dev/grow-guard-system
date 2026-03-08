

## Plano: Refazer Ferramenta Financeiro Completa (Matriz + Franqueado)

### Estado Atual

**Franqueadora** — 4 sub-rotas separadas + sidebar com submenu:
- `/financeiro` → Dashboard (KPIs + gráfico básico)
- `/financeiro/controle` → Entradas/Saídas/Contratos (649 linhas, já integra Asaas)
- `/financeiro/repasse` → Cobranças de royalties para franqueados
- `/financeiro/fechamentos` → Consolidação mensal + upload DRE

**Franqueado** — 1 página com 6 abas (Visão Geral, Pagamentos, Clientes SaaS, Comissões, Fechamentos, Sistema)

### Problemas
1. Franqueadora: Financeiro fragmentado em 4 páginas separadas — dificulta usabilidade
2. Não há vínculo explícito de todos os tipos de cliente (SaaS, internos, franquias) num só lugar
3. Receitas manuais e Asaas estão misturadas sem categorização clara
4. Falta DRE automático (hoje é upload manual)
5. Configurações financeiras existem mas são básicas

### Solução: Página única com abas completas

#### Franqueadora — `/franqueadora/financeiro` (Página única, 7 abas)

1. **Dashboard** — KPIs principais (MRR total rede + matriz, Receitas, Despesas, Resultado, Inadimplência), gráfico receita vs despesa 6 meses, gráfico de composição de receita (pizza: Assessoria/SaaS/Franquia/Outros)

2. **Receitas** — Lista unificada (manual + Asaas), filtros por mês/categoria/status/origem, CRUD manual, botão emitir cobrança Asaas vinculada a contrato, categorias: Assessoria, SaaS, Franquia, Royalties, Sistema, Outros

3. **Despesas** — CRUD completo com categorias (Pessoas, Plataformas, Estrutura, Impostos, etc.), tipo fixo/variável, status pago/pendente, filtros

4. **Repasse** — Geração de cobranças automáticas para franqueados (royalties + sistema), visualização PIX QR, status de pagamento (já existe, absorver `FinanceiroRepasse.tsx`)

5. **Fechamentos** — Consolidação mensal por unidade, upload DRE, lista de fechamentos publicados (absorver `FinanceiroFechamentos.tsx`)

6. **Clientes** — Visão de todos os clientes vinculados (internos, SaaS, franquias), status de pagamento, inadimplência, links de fatura

7. **Configurações** — Regras de imposto, repasse, capacidade, margens (absorver `FinanceiroConfiguracoes.tsx`)

#### Franqueado — `/franqueado/financeiro` (manter 6 abas, otimizar)

A página já está bem estruturada. Ajustes:
- Verificar que formatação BRL está consistente
- Manter abas: Visão Geral, Pagamentos, Clientes SaaS, Comissões, Fechamentos, Sistema

### Mudanças Técnicas

| Arquivo | Ação |
|---------|------|
| `src/components/FranqueadoraSidebar.tsx` | Remover subitens do Financeiro, link único |
| `src/pages/FinanceiroDashboard.tsx` | Refazer como hub com 7 abas internas |
| `src/pages/FinanceiroControle.tsx` | Absorvido no hub (remover rota) |
| `src/pages/FinanceiroRepasse.tsx` | Absorvido no hub (remover rota) |
| `src/pages/FinanceiroFechamentos.tsx` | Absorvido no hub (remover rota) |
| `src/pages/FinanceiroConfiguracoes.tsx` | Absorvido no hub (remover rota) |
| `src/App.tsx` | Remover sub-rotas `/financeiro/controle`, `/repasse`, `/fechamentos` |
| `src/pages/franqueado/FranqueadoFinanceiro.tsx` | Ajustes menores de formatação |

### Detalhes da Nova Página Unificada

A página `FinanceiroDashboard.tsx` será completamente reescrita para conter:

- **Header**: Título "Gestão Financeira" + seletor de mês global
- **7 abas**: Dashboard | Receitas | Despesas | Repasse | Fechamentos | Clientes | Configurações
- Toda lógica dos 4 arquivos atuais será consolidada
- Hooks existentes (`useFinance`, `useClientPayments`, `useContracts`, `useUnits`) serão reutilizados
- Integração Asaas mantida (cobranças, PIX, webhooks)

A página será grande (~1200 linhas), mas organizada com componentes internos por aba para manter legibilidade.


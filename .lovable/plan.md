

## Roadmap: Desenvolvimento dos Modulos da Franqueadora

### Estado Atual de Cada Modulo

| # | Modulo | Estado | O que falta |
|---|--------|--------|-------------|
| 1 | **Dashboard** | Funcional | KPIs reais, "Hoje eu preciso" inteligente |
| 2 | **Agenda** | Funcional | OK (Google Calendar integrado) |
| 3 | **Comunicados** | Funcional | OK (CRUD + segmentacao) |
| 4 | **Unidades** | Basico | Abas de detalhe (usuarios, docs, financeiro) sao placeholders |
| 5 | **CRM Expansao** | Basico | Sem detail sheet, sem drag-drop, sem filtros avancados, sem atividades |
| 6 | **Onboarding** | Basico | Sem CRUD para criar implantacoes, sem toggle de checklist, sem atas |
| 7 | **Atendimento** | Basico | Detail minimo, sem timeline de respostas, sem atribuicao |
| 8 | **Matriz** | Placeholder | Apenas lista perfis, sem gestao de permissoes reais |
| 9 | **Marketing** | Placeholder | Upload nao funciona, sem pastas, sem download |
| 10 | **Treinamentos** | Funcional | OK (Academy com gestao + player) |
| 11 | **Metas e Ranking** | Placeholder | Todas as abas mostram empty state |
| 12 | **Contratos** | Basico | CRUD funciona, falta preview/editor de template |
| 13 | **Financeiro** | Basico | CRUD funciona, falta graficos e DRE real |
| 14 | **SaaS** | Funcional | OK (5 abas operacionais) |
| 15 | **Drive** | Desativado | Nao implementado |

### Ordem Proposta (por dependencia e impacto)

**Fase 1 — Rede (core da operacao)**
1. **Unidades** — base para tudo (vincular usuarios, docs, financeiro por unidade)
2. **CRM Expansao** — motor comercial da franqueadora
3. **Onboarding** — depende de Unidades (nova unidade -> onboarding)
4. **Atendimento** — suporte da rede
5. **Matriz** — permissoes e usuarios

**Fase 2 — Comercial**
6. **Metas e Ranking** — CRUD de metas, dashboard, ranking gamificado
7. **Marketing** — upload real, pastas, distribuicao para rede

**Fase 3 — Administrativo**
8. **Financeiro** — graficos, DRE automatico, projecoes
9. **Contratos** — editor de template, variaveis dinamicas
10. **Dashboard** — consolidar KPIs de todos os modulos

---

### Modulo 1: Unidades (Detalhamento Completo)

Hoje as abas de detalhe da unidade (Usuarios, Documentos, Financeiro) sao placeholders. Vamos implementar cada uma.

#### 1.1 Aba "Dados" — Editar Unidade
- Formulario editavel (inline ou Dialog) com todos os campos: nome, cidade, estado, telefone, email, responsavel, status, observacoes
- Botao "Salvar Alteracoes" que chama `updateUnit`
- Select de status: Ativa, Suspensa, Encerrada

#### 1.2 Aba "Usuarios" — Membros da Unidade
- Listar membros da organizacao (`organization_memberships` + `profiles`) filtrados pelo `unit_id`
- Colunas: Nome, Email, Funcao, Permissao, Status
- Botao "Convidar Usuario" abrindo Dialog com: nome, email, funcao (Select: Franqueado, Comercial, Atendimento, Performance, Criativo, Financeiro), permissao (Admin da Unidade, Operador, Somente leitura)
- Acoes por usuario: Editar funcao, Ativar/Desativar
- Como a tabela `units` ja existe e tem `organization_id`, os membros sao filtrados por org

#### 1.3 Aba "Documentos" — Repositorio por Unidade
- Listar documentos vinculados a unidade (nova tabela `unit_documents`)
- Upload de arquivo (storage bucket `unit-documents`)
- Campos: Tipo (Contrato de franquia, Docs administrativos, Arquivos internos, Outros), Nome, Visibilidade (Somente Franqueadora / Ambos), Observacao
- Acoes: Download, Excluir
- Badge de visibilidade na listagem

#### 1.4 Aba "Financeiro" — Config por Unidade
- Formulario editavel com campos financeiros da unidade: % repasse, % royalties, mensalidade sistema (R$), sistema ativo (toggle)
- Historico de cobranças geradas para esta unidade (query em `franchisee_charges` filtrado por `franchisee_org_id`)
- Status de pagamento do sistema (query em `franchisee_system_payments`)

#### Mudancas no Banco de Dados

**Nova tabela: `unit_documents`**
```text
unit_documents
  id              uuid PK
  unit_id         uuid FK -> units
  organization_id uuid FK -> organizations
  name            text NOT NULL
  type            text (Contrato de franquia | Docs administrativos | Arquivos internos | Outros)
  file_url        text
  visibility      text default 'both' (franqueadora_only | both)
  notes           text
  uploaded_by     uuid FK -> auth.users
  created_at      timestamptz
```

**Alterar tabela `units`**: Adicionar colunas se nao existirem:
- `royalty_percent` numeric default 1
- `system_fee` numeric default 250
- `transfer_percent` numeric default 20
- `system_active` boolean default true
- `financial_notes` text

**Novo storage bucket**: `unit-documents` (public)

**RLS**: `unit_documents` — SELECT/INSERT/DELETE para membros da org (`is_member_of_org`)

#### Arquivos a Criar/Editar

| Arquivo | Acao |
|---|---|
| Migration SQL | Criar tabela `unit_documents`, adicionar colunas em `units`, criar bucket |
| `src/hooks/useUnitDocuments.ts` | Criar — hook para CRUD de documentos de unidade |
| `src/hooks/useUnitMembers.ts` | Criar — hook para listar/gerenciar membros de uma unidade |
| `src/components/unidades/UnidadeDadosEdit.tsx` | Criar — formulario editavel de dados da unidade |
| `src/components/unidades/UnidadeUsuariosReal.tsx` | Criar — listagem real de membros + convidar |
| `src/components/unidades/UnidadeDocumentosReal.tsx` | Criar — upload + listagem de documentos |
| `src/components/unidades/UnidadeFinanceiroReal.tsx` | Criar — config financeira + historico de cobrancas |
| `src/pages/Unidades.tsx` | Editar — substituir placeholders pelos componentes reais |

### Proximos Passos

Apos a aprovacao, implemento o Modulo 1 (Unidades) completo. Depois seguimos para o CRM Expansao, Onboarding, e assim por diante na ordem proposta.



# Correções: Scripts, Pipeline e Edição de Estratégia/Proposta

## 1. Remover aba Scripts da Prospecção

Remover a aba "Scripts" e o componente `ScriptsTab` da pagina `FranqueadoProspeccaoIA.tsx`. O grid de tabs passa de 4 colunas para 3.

### Arquivo editado
- `src/pages/franqueado/FranqueadoProspeccaoIA.tsx`
  - Remover linhas do TabsTrigger "scripts" e TabsContent "scripts"
  - Remover o componente `ScriptsTab` inteiro (linhas 476-552)
  - Mudar `grid-cols-4` para `grid-cols-3`

---

## 2. Lead sumindo da pipeline (stage incorreto)

O problema esta no hook `useCrmLeads.ts`:
- `markAsWon` define `stage: "fechado"` mas o Kanban espera `"Venda"`
- `markAsLost` define `stage: "perdido"` mas o Kanban espera `"Oportunidade Perdida"`

Como as stages do Kanban sao: `"Novo Lead", "Primeiro Contato", "Follow-up", "Diagnóstico", "Apresentação de Estratégia", "Proposta", "Venda", "Oportunidade Perdida"`, os leads com stages `"fechado"` ou `"perdido"` nao aparecem em nenhuma coluna.

### Correcao
- `markAsWon`: mudar `stage: "fechado"` para `stage: "Venda"`
- `markAsLost`: mudar `stage: "perdido"` para `stage: "Oportunidade Perdida"`

### Arquivo editado
- `src/hooks/useCrmLeads.ts` (2 linhas)

---

## 3. Editar Estratégia após finalizada

Ao visualizar uma estrategia concluida no historico, adicionar um botao "Editar e Regenerar" que:
1. Abre o formulario de diagnostico preenchido com as respostas salvas (`diagnostic_answers`)
2. Permite alterar qualquer campo
3. Ao submeter, chama a IA novamente e atualiza o registro existente (em vez de criar um novo)

### Implementacao
- Adicionar estado `editingStrategy` na `HistoricoTab`
- Quando clicado "Editar", renderizar o `DiagnosticForm` com valores pre-preenchidos
- Criar uma mutation `useRegenerateStrategy` no hook que faz update no registro existente ao inves de insert

### Arquivos editados
- `src/hooks/useFranqueadoStrategies.ts` - adicionar mutation `useRegenerateStrategy`
- `src/pages/franqueado/FranqueadoEstrategia.tsx` - botao "Editar" no Sheet do historico + form pre-preenchido

---

## 4. Editar Proposta

Na lista de propostas em `FranqueadoPropostas.tsx`, adicionar funcionalidade de edicao:
- Botao "Editar" na tabela de propostas (ao lado de duplicar/enviar/excluir)
- Ao clicar, abre a aba Calculadora carregando os dados salvos da proposta (services, duration, client_name, lead_id, payment_terms)
- O botao "Salvar" atualiza a proposta existente em vez de criar uma nova

### Implementacao
- Adicionar estado `editingProposal` na pagina
- Quando ativo, a aba Calculadora recebe a proposta como prop e carrega os dados
- O `handleSave` usa `updateProposal` ao inves de `createProposal`

### Arquivos editados
- `src/pages/franqueado/FranqueadoPropostas.tsx` - botao editar na lista + logica de edicao na calculadora

---

## Resumo de arquivos

| Arquivo | Mudanca |
|---------|---------|
| `src/pages/franqueado/FranqueadoProspeccaoIA.tsx` | Remover aba Scripts, ajustar grid |
| `src/hooks/useCrmLeads.ts` | Corrigir stages de won/lost |
| `src/hooks/useFranqueadoStrategies.ts` | Adicionar `useRegenerateStrategy` |
| `src/pages/franqueado/FranqueadoEstrategia.tsx` | Botao editar + form pre-preenchido no historico |
| `src/pages/franqueado/FranqueadoPropostas.tsx` | Botao editar proposta + logica de edicao |


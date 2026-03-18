

# Bloco 3: Testes Reais — Contatos do CRM

Com base no progresso:
- **Bloco 1** ✅ Configurações CRM (funis, equipe, produtos, parceiros, SLA, integrações, automações)
- **Bloco 2** ✅ Pipeline Kanban (criar lead, drag-drop, editar, marcar ganho/perdido)
- **Bloco 3** → **Contatos** (próximo)

## Testes planejados

| # | Ação | Detalhe |
|---|------|---------|
| 1 | Criar contato | Preencher nome, email, telefone, empresa, tags |
| 2 | Editar contato | Alterar campos e salvar |
| 3 | Converter em lead | Usar ação de conversão contato → lead |
| 4 | Deletar contato | Excluir e confirmar |
| 5 | Busca | Pesquisar por nome/email |
| 6 | Seleção em massa | Selecionar múltiplos e deletar em lote |

## Execução
Login com `cliente.teste@noexcuse.com` / `19961996` → CRM → aba Contatos → executar cada ação com screenshots de evidência.

## Arquivos relevantes (sem alteração)
- `src/components/crm/CrmContactsView.tsx` — UI de contatos
- `src/hooks/useCrmContacts.ts` — CRUD e bulk operations


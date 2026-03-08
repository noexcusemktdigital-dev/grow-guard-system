

## Plano: Correção Completa do Módulo de Comunicados

### Problemas identificados

1. **`show_popup`, `show_dashboard`, `require_confirmation` NÃO existem no banco** — O formulário coleta esses campos mas eles nunca são salvos. Em `Comunicados.tsx`, os valores são hardcoded: `mostrarDashboard: true, mostrarPopup: false, exigirConfirmacao: false`.

2. **Popup inexistente** — Não existe nenhum componente que exiba comunicados como popup ao login. O campo é coletado no form mas nunca implementado.

3. **Anexo não aparece na visualização do cliente/franqueado** — `ClienteComunicados.tsx` (e o equivalente franqueado) não renderiza `attachment_url` no detalhe do comunicado.

4. **Confirmação de leitura vinculada apenas a prioridade "Crítica"** — No `ClienteComunicados.tsx`, a confirmação só aparece se `priority === "Crítica"`, ignorando o campo `require_confirmation` do formulário.

5. **Console warning** — `ComunicadoForm` passa ref para `Select` (Radix), gerando warning.

### Mudanças

#### 1. Migração DB — Adicionar 3 colunas na tabela `announcements`
```sql
ALTER TABLE announcements ADD COLUMN show_dashboard boolean NOT NULL DEFAULT true;
ALTER TABLE announcements ADD COLUMN show_popup boolean NOT NULL DEFAULT false;
ALTER TABLE announcements ADD COLUMN require_confirmation boolean NOT NULL DEFAULT false;
```

#### 2. `src/pages/Comunicados.tsx` — Salvar e ler os novos campos
- **handlePublish/handleSaveDraft**: Incluir `show_dashboard`, `show_popup`, `require_confirmation` no payload
- **Mapping de DB → Comunicado**: Ler `a.show_dashboard`, `a.show_popup`, `a.require_confirmation` em vez de hardcodar

#### 3. `src/components/comunicados/ComunicadoForm.tsx` — Fix ref warning
- O warning vem do Radix Select recebendo ref. Não há mudança funcional necessária, mas caso persista, isolar via wrapper.

#### 4. Criar `src/components/AnnouncementPopupDialog.tsx` — Popup ao login
Componente montado nos 3 layouts (Franqueadora, Franqueado, Cliente) que:
- Consulta comunicados com `show_popup = true` e `published_at IS NOT NULL`
- Filtra os que o usuário ainda não visualizou (via `useAnnouncementViews`)
- Exibe um Dialog modal com título, conteúdo, anexo e botão "Li e entendi"
- Ao fechar, marca como visualizado via `markViewed`
- Se `require_confirmation = true`, exige o botão "Li e concordo" antes de fechar

#### 5. `src/pages/cliente/ClienteComunicados.tsx` — Mostrar anexo + usar require_confirmation
- No detalhe (Sheet), renderizar link de download se `attachment_url` existir
- Trocar a lógica de confirmação de `priority === "Crítica"` para usar o campo `require_confirmation` do DB (ou manter ambos como fallback)

#### 6. Montar popup nos layouts
- `FranqueadoraLayout.tsx`: Importar e montar `<AnnouncementPopupDialog />`
- `FranqueadoLayout.tsx`: Idem
- `ClienteLayout.tsx`: Idem

### Arquivos afetados

| Arquivo | Ação |
|---------|------|
| **Migração SQL** | Adicionar `show_dashboard`, `show_popup`, `require_confirmation` |
| `src/pages/Comunicados.tsx` | Salvar/ler novos campos do DB |
| `src/components/AnnouncementPopupDialog.tsx` | Criar — popup modal ao login |
| `src/pages/cliente/ClienteComunicados.tsx` | Exibir anexo + lógica require_confirmation |
| `src/components/FranqueadoraLayout.tsx` | Montar popup |
| `src/components/FranqueadoLayout.tsx` | Montar popup |
| `src/components/ClienteLayout.tsx` | Montar popup |


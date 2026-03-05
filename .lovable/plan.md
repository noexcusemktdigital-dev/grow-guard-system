

# Limpeza dos Filtros da Lista de Conversas

## Diagnóstico

Os filtros atuais têm vários problemas que geram confusão:

1. **Filtro "Grupos"** — inútil porque o hook `useWhatsAppContacts` já filtra e **remove** todos os contatos de grupo (`@g.us`, `-group`) antes de retornar os dados. O botão nunca vai mostrar resultados.

2. **Filtro "Site"** — nunca funciona porque `contact_type` só é definido como `"individual"`, `"group"` ou `"lid"` no hook. Nenhum contato recebe `"website"`.

3. **Filtro "Etapa" (CRM stage)** — só aparece se o contato tiver `crm_lead_id` vinculado a um lead existente. A maioria dos contatos WhatsApp não tem, então o filtro fica vazio.

4. **Filtro "Agente"** — depende de `agent_id` no contato, que pode não estar preenchido.

## Mudanças

### `src/components/cliente/ChatContactList.tsx`
- Remover os botões de filtro **"Grupos"** e **"Site"** (dados nunca existem)
- Manter apenas: **Todos**, **IA**, **Humano**, **Espera** (esses funcionam com dados reais)
- Remover o filtro dropdown de **"Etapa"** (não há vínculo CRM consistente nos contatos WhatsApp)
- Manter o filtro de **"Agente"** apenas se houver agentes ativos (já funciona assim)

### `src/pages/cliente/ClienteChat.tsx`
- Remover o cálculo de `leadStages` (useMemo que cruza contatos com leads do CRM) — não é mais necessário
- Remover a prop `leadStages` passada ao `ChatContactList`

| Arquivo | Mudança |
|---------|---------|
| `src/components/cliente/ChatContactList.tsx` | Remover filtros Grupos, Site, Etapa |
| `src/pages/cliente/ClienteChat.tsx` | Remover cálculo de leadStages |


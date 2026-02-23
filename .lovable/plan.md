

# Correções: WhatsApp numero real + Criacao sequencial do agente

## Problema 1: Numero do WhatsApp ainda mostra instancia

O banco confirma: a instancia `3EF255AF...` esta com `status: connected` mas `phone_number: NULL`.

A edge function ja tem o codigo para chamar `/device`, mas o numero nunca foi preenchido. Isso indica que o `check-status` nao foi chamado desde o ultimo deploy, ou que o deploy nao aconteceu.

**Solucao em 2 partes:**

### a) Re-deploy + log na edge function
- Garantir que a edge function `whatsapp-setup` esta deployada com a logica do `/device`
- Adicionar `console.log` no retorno do `/device` para diagnostico

### b) Auto-sync no frontend
- Quando o `AgentFormSheet` abrir e detectar `whatsappInstance` com `status === "connected"` mas `phone_number === null`, disparar automaticamente o `check-status` via edge function
- Apos o retorno, invalidar a query `whatsapp-instance` para atualizar a tela
- Remover o `window.location.reload()` e usar `queryClient.invalidateQueries`

Assim, o usuario nunca mais vera "Instancia XXX..." — o numero sera buscado automaticamente.

---

## Problema 2: Objetivos ja sao determinados pela funcao

Os objetivos **ja estao vinculados a funcao (role)** no codigo atual:
- SDR: Qualificar lead, Coletar informacoes, Agendar reuniao, Identificar decisor
- Closer: Apresentar proposta, Negociar, Fechar venda, Superar objecoes
- Pos-venda: Verificar satisfacao, Coletar feedback, Oferecer upsell, Resolver duvidas
- Suporte: Resolver problema, Escalar ticket, Coletar informacoes do erro, Encaminhar para setor

Quando o usuario troca a funcao, os objetivos mudam automaticamente. **Nao precisa de alteracao** nesse ponto.

---

## Problema 3: Criacao sequencial (passo a passo)

Atualmente todas as 5 abas ficam desbloqueadas ao mesmo tempo. O usuario quer um fluxo guiado onde cada etapa so desbloqueia apos a anterior ser preenchida.

**Regras de desbloqueio:**

1. **Identidade** — sempre disponivel (primeira etapa)
2. **Persona** — desbloqueia quando Identidade tiver: `name` preenchido + `role` selecionado + `gender` selecionado
3. **Base de Conhecimento** — desbloqueia quando Persona tiver pelo menos: `greeting` selecionado + 1 `trait` selecionada
4. **Prompt e Objetivos** — desbloqueia quando Base de Conhecimento tiver pelo menos 1 item adicionado
5. **Simulador** — desbloqueia quando Prompt tiver `system_prompt` preenchido

**Implementacao:**
- Calcular `completedSteps` baseado no estado do formulario
- Tabs desabilitadas recebem `disabled` e estilo visual de "cadeado"
- Ao completar uma etapa, avancar automaticamente para a proxima
- Botao "Proximo" no final de cada aba para facilitar a navegacao
- Ao editar um agente existente, todas as abas ficam desbloqueadas (o agente ja foi criado)

---

## Arquivos a editar

| Arquivo | Mudanca |
|---------|---------|
| `src/components/cliente/AgentFormSheet.tsx` | Auto-sync do phone_number, criacao sequencial com tabs bloqueadas, botoes "Proximo", invalidateQueries |
| `supabase/functions/whatsapp-setup/index.ts` | Adicionar logs de diagnostico no retorno do `/device` |

## Detalhes Tecnicos

- A funcao `whatsapp-setup` sera re-deployada para garantir que o codigo do `/device` esta ativo
- No `AgentFormSheet`, um `useEffect` detecta `whatsappInstance?.status === "connected" && !whatsappInstance.phone_number` e chama `check-status` automaticamente
- As tabs usam uma variavel de estado `activeTab` controlada pelo componente, com `pointer-events-none opacity-50` nas tabs bloqueadas
- Para agentes existentes (`isEditing === true`), todas as tabs ficam desbloqueadas
- O `useQueryClient` sera importado para fazer `invalidateQueries` no lugar de `window.location.reload()`

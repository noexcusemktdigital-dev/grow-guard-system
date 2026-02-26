

## Agentes de IA com Consciencia de Agenda e Direcionamento de Equipe

### Problema
Os agentes de IA marcam reunioes sem consultar a agenda dos vendedores e nao sabem para quem direcionar o lead. Isso causa conflitos de horario e falta de contexto sobre a equipe disponivel.

### Solucao

**Arquivo**: `supabase/functions/ai-agent-reply/index.ts`

Adicionar dois blocos de contexto ao system prompt do agente:

---

### 1. Contexto da equipe disponivel

Buscar os membros da organizacao com seus perfis para que o agente saiba quem sao os vendedores/closers disponiveis:

```typescript
const { data: teamMembers } = await adminClient
  .from("organization_memberships")
  .select("user_id, profiles(full_name)")
  .eq("organization_id", organization_id);
```

Se o lead tiver `assigned_to`, informar ao agente quem e o responsavel pelo lead. Se nao tiver, listar os membros disponiveis para o agente sugerir direcionamento.

---

### 2. Contexto da agenda (proximas 48h)

Buscar os eventos do calendario da organizacao nas proximas 48 horas para que o agente saiba os horarios ocupados:

```typescript
const now = new Date();
const in48h = new Date(now.getTime() + 48 * 60 * 60 * 1000);

const { data: upcomingEvents } = await adminClient
  .from("calendar_events")
  .select("title, start_at, end_at, created_by")
  .eq("organization_id", organization_id)
  .gte("start_at", now.toISOString())
  .lte("start_at", in48h.toISOString())
  .order("start_at", { ascending: true })
  .limit(20);
```

---

### 3. Instrucoes no system prompt

Adicionar ao prompt (apos o bloco de `leadContext`):

```
Informacoes da equipe:
- Responsavel pelo lead: [nome] (ou "Nenhum atribuido")
- Membros da equipe: [lista]

Agenda das proximas 48h (horarios ja ocupados):
- [data/hora] - [titulo] (responsavel: [nome])
- ...

REGRAS PARA AGENDAMENTO:
1. Nunca marque reuniao em horario que ja esteja ocupado na agenda acima
2. Sugira horarios livres dentro do horario comercial (seg-sex, 9h-18h)
3. Sempre confirme o horario com o lead antes de agendar
4. Direcione a reuniao para o responsavel do lead. Se nao houver, sugira um membro da equipe
5. Ao confirmar uma reuniao, use a acao [AI_ACTION:SCHEDULE_MEETING:titulo|data_hora_inicio|data_hora_fim|responsavel_nome]
```

---

### 4. Nova acao: SCHEDULE_MEETING

Adicionar ao bloco de parse de acoes (linhas 431-474) o tratamento da nova acao que cria um evento no calendario automaticamente:

```typescript
if (action.type === "SCHEDULE_MEETING") {
  const [title, startAt, endAt, assigneeName] = action.value.split("|");
  await adminClient.from("calendar_events").insert({
    organization_id,
    title: title || "Reuniao com lead",
    start_at: startAt,
    end_at: endAt || new Date(new Date(startAt).getTime() + 60*60*1000).toISOString(),
    description: `Reuniao agendada pela IA (${agent.name}) com ${contact.name || contact.phone}`,
    visibility: "private",
  });
}
```

---

### Resumo das alteracoes

- **1 arquivo alterado**: `supabase/functions/ai-agent-reply/index.ts`
- **2 queries adicionais**: membros da equipe + eventos das proximas 48h
- **1 nova acao de IA**: `SCHEDULE_MEETING` para criar eventos automaticamente
- **Instrucoes de prompt**: regras claras de agendamento e direcionamento

### Impacto
- Agentes nunca mais marcam reuniao em horario ocupado
- Agentes sabem quem e o responsavel e para quem direcionar
- Reunioes agendadas aparecem automaticamente no calendario da plataforma
- Deploy automatico


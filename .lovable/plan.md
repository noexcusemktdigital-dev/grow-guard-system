

## Plano — Restaurar preview

### Diagnóstico

Não há erros de runtime, console logs ou session replay disponíveis. O código frontend está sintaticamente correto — todas as importações existem e os arquivos estão presentes. Isso indica um problema transitório do dev-server (Vite), não um bug de código.

### Ação

1. **Forçar rebuild do dev-server** — vou fazer uma edição mínima (adicionar um comentário inofensivo) em `src/App.tsx` para forçar o Vite a reiniciar o hot-reload e recompilar o projeto.

2. **Se persistir**, verificar o log do dev-server (`/tmp/dev-server-logs/dev-server.log`) para identificar a causa real do travamento.

### Arquivos a modificar

| Arquivo | Ação |
|---------|------|
| `src/App.tsx` | Adicionar comentário para forçar rebuild |

### Nota sobre Edge Functions

Os erros de TypeScript em `ads-analyze`, `ads-disconnect`, `ads-sync-metrics` e `agent-followup-cron` (uso de `err.message` em `unknown`) afetam apenas o deploy das edge functions, não o preview do frontend. Esses podem ser corrigidos em um próximo passo separado.


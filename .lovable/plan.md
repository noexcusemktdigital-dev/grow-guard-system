

# Bloco: Testes Reais — Agentes de IA (Ações Reais via Browser)

Sim, vou executar **todas as ações reais** via browser, como um usuário real faria — clicando, preenchendo, salvando, simulando conversas, etc.

## Execução Sequencial com Browser

Login: `cliente.teste@noexcuse.com` / `19961996` → Menu lateral → **Agentes de IA**

| # | Ação Real | O que vou fazer no browser |
|---|-----------|---------------------------|
| 1 | **Criar agente completo** | Clicar "Novo Agente" → preencher wizard completo (nome, função SDR, sexo, persona, saudação, base de conhecimento com texto, objetivos, regras) → Salvar |
| 2 | **Testar simulador** | Abrir agente criado → aba Simulador → enviar mensagens reais e verificar respostas da IA |
| 3 | **Gerar com IA** | Clicar nos botões "Gerar persona com IA", "Gerar saudação", "Gerar prompt" → verificar resultados |
| 4 | **Editar agente** | Reabrir agente → alterar nome e campos → Salvar → verificar persistência |
| 5 | **Toggle status** | Clicar Pausar/Ativar no card → verificar badge e toast |
| 6 | **Duplicar agente** | Clicar duplicar → verificar cópia na lista |
| 7 | **Excluir agentes** | Excluir cópia e original → confirmar empty state |
| 8 | **Validações** | Tentar avançar wizard sem campos obrigatórios → verificar bloqueio |
| 9 | **Upload avatar** | Fazer upload de imagem no campo de avatar |
| 10 | **Bugs e melhorias** | Documentar qualquer erro ou UX gap encontrado durante os testes |

Cada ação terá screenshot de evidência. Vou reportar bugs encontrados e sugerir melhorias concretas ao final.

## Arquivos relevantes (sem alteração nesta fase)
- `src/pages/cliente/ClienteAgentesIA.tsx`
- `src/components/cliente/AgentFormSheet.tsx`
- `src/components/cliente/AgentCard.tsx`
- `src/hooks/useClienteAgents.ts`
- `supabase/functions/ai-agent-simulate/index.ts`


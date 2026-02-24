

# Etapa 3 -- Prospeccao IA (com IA real e persistencia)

Reescrita completa da pagina de Prospeccao IA com edge function real, persistencia no banco e historico.

---

## O que sera feito

### 1. Nova Edge Function: `generate-prospection`

Arquivo: `supabase/functions/generate-prospection/index.ts`

- Recebe inputs do formulario (regiao, nicho, porte, desafio, objetivo da abordagem)
- Usa Lovable AI (Gemini 3 Flash) com tool calling para retornar JSON estruturado com 5 secoes:
  - **estrategia_abordagem**: como abordar o prospect nesse nicho/regiao
  - **avaliacao_inicial**: perguntas de qualificacao rapida
  - **roteiro_contato**: script do primeiro contato (telefone/WhatsApp)
  - **quebra_objecoes**: 5 objecoes comuns + respostas
  - **passo_a_passo_reuniao**: checklist para agendar a reuniao de diagnostico
- Valida autenticacao, registra uso de tokens em `ai_conversation_logs`
- Trata erros 429/402 e repassa ao client

### 2. Hook: `useFranqueadoProspections`

Arquivo: `src/hooks/useFranqueadoProspections.ts`

- `useProspections()` -- lista prospeccoes da org, ordenadas por data
- `useCreateProspection()` -- insere registro com status 'draft', depois chama a edge function, atualiza com resultado e status 'completed'
- `useUpdateProspection()` -- editar titulo, vincular lead
- `useDeleteProspection()` -- excluir
- Usa `useUserOrgId` para multi-tenancy

### 3. Reescrita da pagina `FranqueadoProspeccaoIA.tsx`

3 abas:

**Aba "Nova Prospeccao"**
- Formulario com 5 campos: Regiao, Nicho/Segmento, Porte do Prospect (select: MEI/ME/EPP/Medio/Grande), Desafio Principal (textarea), Objetivo da Abordagem (select: Agendar Reuniao/Apresentar Servico/Reativar Contato)
- Botao "Gerar Plano com IA" (com loading spinner)
- Resultado renderizado em cards por secao (com icones por tipo)
- Botoes pos-geracao: "Salvar", "Vincular ao Lead" (select de leads do CRM), "Gerar Novo"

**Aba "Historico"**
- Lista de prospeccoes salvas com titulo, data, status, lead vinculado
- Busca por texto
- Clicar abre o resultado completo em Sheet lateral
- Botoes: editar titulo, vincular/desvincular lead, excluir

**Aba "Scripts Comerciais"**
- Reutiliza a logica existente do `generate-script` (ja funciona)
- Selecao de etapa do funil (Prospeccao, Diagnostico, Negociacao, Fechamento, Objecoes)
- Campos de briefing contextuais
- Resultado renderizado em card com botao copiar

---

## Detalhes Tecnicos

### Edge Function -- generate-prospection

Segue o mesmo padrao do `generate-script` existente:
- CORS headers padrao
- Autenticacao via Bearer token + getClaims
- Usa tool calling para forcar resposta em JSON estruturado com as 5 secoes
- Modelo: `google/gemini-3-flash-preview`
- Prompt de sistema: consultor de vendas B2B brasileiro especialista em franquias
- Log de tokens em `ai_conversation_logs`

### Config TOML

Adicionar entrada para a nova function (ja existe padrao no projeto):
```toml
[functions.generate-prospection]
verify_jwt = false
```

### Arquivos criados/modificados

| Arquivo | Acao |
|---------|------|
| `supabase/functions/generate-prospection/index.ts` | Novo |
| `src/hooks/useFranqueadoProspections.ts` | Novo |
| `src/pages/franqueado/FranqueadoProspeccaoIA.tsx` | Reescrita completa |
| `supabase/config.toml` | Adicionar entry |

Nenhuma migracao SQL necessaria -- a tabela `franqueado_prospections` ja foi criada na Etapa 1.




# Cadastro Completo + Onboarding do Plano de Vendas

## Escopo

Dois blocos interligados: (A) coletar dados da empresa no signup e (B) transformar o Plano de Vendas (Rafael) num onboarding mais completo e contextualizado por segmento, que alimenta toda a plataforma.

---

## A. Dados da Empresa no Cadastro

### Situacao Atual
O signup (`SaasAuth.tsx`) coleta apenas: nome completo, nome da empresa, email, senha. O `signup-saas` cria org com `name` generico. Nao pede CNPJ, segmento, telefone, cidade, etc.

### Alteracoes

**1. Formulario de signup em 2 passos**
- Passo 1 (atual): Nome, Email, Senha, Google OAuth
- Passo 2 (novo, apos verificacao de email e primeiro login): Formulario de dados da empresa que aparece antes de redirecionar para o dashboard
  - Nome da empresa, CNPJ (opcional), Telefone, Cidade/UF, Segmento (select), Tipo de produto/servico (texto livre), Quantidade de funcionarios, Site (opcional)

**2. Pagina `ClienteOnboardingCompany.tsx`**
- Nova pagina que intercepta o primeiro acesso (antes de ir para `/cliente/inicio`)
- Formulario multi-step bonito com progresso visual
- Salva dados na tabela `organizations` (campos existentes: name, phone, document, address, city, state) + novos campos via migracao

**3. Migracao DB**
- Adicionar a `organizations`: `segment TEXT`, `product_types TEXT[]`, `employee_count TEXT`, `website TEXT`
- Adicionar flag `onboarding_completed BOOLEAN DEFAULT false`

**4. Logica de gating**
- No `ClienteInicio`, verificar se `onboarding_completed = false` e redirecionar para a pagina de onboarding da empresa
- Apos preencher, marca `onboarding_completed = true` e redireciona para o Plano de Vendas (Rafael)

### Arquivos

| Arquivo | Acao |
|---------|------|
| `src/pages/cliente/ClienteOnboardingCompany.tsx` | Nova pagina de dados da empresa |
| `src/pages/SaasAuth.tsx` | Remover campo company_name do signup (movido para onboarding) |
| `src/App.tsx` | Nova rota `/cliente/onboarding` |
| `src/pages/cliente/ClienteInicio.tsx` | Redirect se onboarding incompleto |
| `src/hooks/useOrgProfile.ts` | Adicionar campos novos ao tipo + query |
| Migracao SQL | Novos campos na tabela organizations |

---

## B. Plano de Vendas (Rafael) - Onboarding Mais Completo

### Situacao Atual
O Rafael tem ~25 perguntas em 8 secoes. A intro e uma frase generica de 1 linha. As perguntas sao todas fechadas (select/multi-select). Nao pede tipos de produto abertos nem perguntas segmento-especificas.

### Alteracoes

**1. Onboarding conversacional do Rafael**
- Expandir a intro (`_intro_rafael`) para 3-4 mensagens sequenciais de apresentacao:
  - Se apresenta como consultor
  - Explica o que vao construir juntos (plano comercial personalizado)
  - Alinha expectativas: "em poucos minutos voce vai ter um diagnostico completo"
  - Transicao natural para a primeira pergunta
- Usar `inputType: "info"` para cada mensagem de apresentacao (usuario so clica "Continuar")

**2. Perguntas segmento-especificas**
- Adicionar pergunta `produtos_servicos` com `inputType: "textarea"` apos segmento:
  - "Me conta quais sao seus principais produtos ou servicos? Pode listar!"
  - Placeholder contextual baseado no segmento (via `skipIf` ou condicional)
- Adicionar `diferenciais` com textarea: "O que te diferencia da concorrencia?"
- Adicionar `dor_principal` com textarea: "Qual a maior dor do seu cliente ideal?"

**3. Perguntas abertas estrategicas (sem aumentar volume)**
- Substituir 2-3 perguntas fechadas menos uteis por perguntas abertas mais ricas
- Manter o total em ~25 perguntas (nao aumentar)
- Adicionar campos condicionais por segmento (ex: para "saude" perguntar sobre convenios)

**4. Dados alimentam toda plataforma**
- As respostas do Rafael (`sales_plans.answers`) ja sao acessiveis globalmente
- Garantir que os novos campos (produtos, diferenciais, dor) sao consumidos por:
  - Scripts (`generate-script`): adicionar contexto de produtos e diferenciais
  - Marketing (`generate-strategy`, `generate-content`): adicionar segmento e produtos
  - CRM: usar segmento para sugestoes de funil
- Isso sera feito nos proximos blocos, mas a estrutura de dados fica pronta agora

### Arquivos

| Arquivo | Acao |
|---------|------|
| `src/components/cliente/briefingAgents.ts` | Expandir RAFAEL_STEPS com intro longa + perguntas abertas + condicionais |
| `src/pages/cliente/ClientePlanoVendas.tsx` | Ajustar para exibir novos campos no resultado |

---

## Fluxo Completo do Novo Usuario

```text
Signup (email/Google)
  -> Verificacao de email
  -> Primeiro login
  -> /cliente/onboarding (dados da empresa)
  -> /cliente/plano-vendas (Rafael faz onboarding conversacional)
  -> /cliente/inicio (dashboard liberado)
```

---

## Resumo de Arquivos

| Arquivo | Acao |
|---------|------|
| Migracao SQL | Adicionar segment, product_types, employee_count, website, onboarding_completed |
| `src/pages/cliente/ClienteOnboardingCompany.tsx` | CRIAR - formulario de dados da empresa |
| `src/pages/SaasAuth.tsx` | Simplificar signup |
| `src/App.tsx` | Nova rota |
| `src/pages/cliente/ClienteInicio.tsx` | Redirect para onboarding |
| `src/hooks/useOrgProfile.ts` | Atualizar tipo e query |
| `src/components/cliente/briefingAgents.ts` | Expandir Rafael com intro + perguntas abertas |
| `src/pages/cliente/ClientePlanoVendas.tsx` | Exibir novos campos |


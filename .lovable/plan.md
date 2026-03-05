

# Melhorias na Ferramenta de Estratégia de Marketing

## Problemas Identificados

1. **Concorrentes**: O briefing pede apenas nome/descrição textual dos concorrentes (campo `concorrentes` textarea). A IA não tem dados reais para analisar — precisa de URLs (site/Instagram) para poder extrair informações concretas.

2. **Poucas opções no briefing**: Alguns campos limitam a personalização — faltam opções em público, tom, objetivos, e campos adicionais para aprofundar o contexto.

3. **Estratégia não fica aberta por padrão**: Após geração, deveria mostrar o dashboard direto (sem precisar de ação adicional).

4. **"Próximos Passos" mostra meses**: Deveria mostrar ações diretas linkadas às ferramentas de marketing (não comercial).

5. **Nova estratégia deve enviar a atual pro histórico**: Já funciona parcialmente (desativa a anterior), mas precisa de confirmação clara ao usuário.

## Plano de Implementação

### 1. Melhorar coleta de concorrentes (`briefingAgents.ts`)

Substituir o campo textarea de concorrentes por um fluxo que pede **URLs dos concorrentes** (site ou Instagram) para que a IA possa analisar dados reais:

- Campo `concorrentes_urls`: textarea pedindo "Cole os links (site ou Instagram) dos seus 2-3 principais concorrentes"
- Manter o campo `concorrente_faz_melhor` como está

### 2. Expandir opções do briefing (`briefingAgents.ts`)

- **Público** (`publico`): Adicionar mais perfis (mães, jovens, investidores, atletas, etc.)
- **Tom de comunicação** (`tom_comunicacao`): Adicionar opções (técnico/especialista, premium/sofisticado, urgente/escassez, empático/acolhedor)
- **Objetivo** (`objetivo`): Adicionar (fidelizar clientes, expandir território, aumentar ticket médio, entrar em novo mercado)
- **Diferencial** (`diferencial`): Adicionar (equipe qualificada, resultados comprovados, marca reconhecida)
- **Novo campo**: "Quais resultados seus clientes geralmente alcançam?" (prova social real)
- **Novo campo**: "O que você NÃO quer na sua comunicação?" (ajuda a definir limites)

### 3. Prompt de estratégia — análise de concorrência real (`generate-strategy/index.ts`)

Atualizar o system prompt para instruir a IA a:
- Usar as URLs fornecidas como base para inferir posicionamento, conteúdo e estratégia dos concorrentes
- Gerar análise mais detalhada com "presença digital estimada" por concorrente

### 4. Próximos Passos: linkar só ferramentas de marketing (`ClientePlanoMarketing.tsx`)

- Alterar o card "Próximos Passos" para NÃO mostrar "Mês 1" como título
- Mostrar uma lista de ações com links diretos para as ferramentas de marketing: Conteúdos, Postagens, Sites, Tráfego, Scripts
- Remover referências ao CRM/comercial nesse card (focar em marketing)

### 5. Estratégia sempre aberta (`ClientePlanoMarketing.tsx`)

- Quando `hasResult === true`, o dashboard já abre direto (já funciona assim)
- Garantir que após geração o `showChat` volta a `false` e `isGenerating` volta a `false` (já faz isso)
- O comportamento já está correto — a estratégia fica visível sempre que existe

### 6. Confirmação ao regenerar (`ClientePlanoMarketing.tsx`)

- Ao clicar "Nova Estratégia", mostrar um dialog de confirmação: "Sua estratégia atual será movida para o histórico. Deseja continuar?"
- Usar `AlertDialog` já disponível no projeto

## Arquivos Modificados

| Arquivo | Mudança |
|---|---|
| `src/components/cliente/briefingAgents.ts` | Expandir opções, trocar campo concorrentes por URLs, adicionar campos de prova social e limites |
| `supabase/functions/generate-strategy/index.ts` | Atualizar prompt para usar URLs de concorrentes |
| `src/pages/cliente/ClientePlanoMarketing.tsx` | Próximos Passos sem mês, AlertDialog na regeneração, focar em ferramentas de marketing |


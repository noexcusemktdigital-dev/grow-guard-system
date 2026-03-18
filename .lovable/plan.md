

# Reestruturação: Recompensas por Conta (Org) + Remover Descontos

## Resumo da mudança
- Recompensas passam a ser desbloqueadas pelo **nível da conta (organização)**, calculado a partir da **soma do XP de todos os usuários** da org
- Remover os descontos de 5% e 10% — apenas **créditos bônus** como recompensa
- Claims de recompensas ficam vinculados ao `organization_id` (não mais ao `user_id`)
- Os usuários continuam subindo de nível individualmente (XP pessoal), mas as recompensas são da conta

## O que muda

### 1. Novo cálculo de nível da organização
Soma o XP de todos os membros via `teamGamification` (query já existente) para determinar o "Nível da Conta". Novos thresholds maiores para a org:
- Novato: 0-999
- Aprendiz: 1.000-2.999
- Profissional: 3.000-6.999
- Especialista: 7.000-13.999
- Mestre: 14.000-23.999
- Lenda: 24.000+

### 2. Recompensas somente créditos bônus
| Nível Org | Recompensa |
|---|---|
| Aprendiz (2) | +100 Créditos Bônus |
| Profissional (3) | +300 Créditos Bônus |
| Especialista (4) | +500 Créditos Bônus |
| Mestre (5) | +800 Créditos Bônus |
| Lenda (6) | +1.500 Créditos Bônus |

### 3. Claims vinculados à org
- A query de claims muda de `user_id` para `organization_id`
- O resgate continua creditando na `credit_wallets` da org (já funciona assim)
- Qualquer admin da org pode resgatar, mas só uma vez por nível

### 4. UI: Card de "Nível da Conta"
- Novo card mostrando o nível agregado da organização com barra de progresso
- Seção de recompensas usa esse nível para habilitar/desabilitar

## Arquivos a alterar
- `src/pages/cliente/ClienteGamificacao.tsx` — constantes ORG_LEVELS, rewardTiers sem descontos, lógica de org level, claims por org, novo card de nível da conta


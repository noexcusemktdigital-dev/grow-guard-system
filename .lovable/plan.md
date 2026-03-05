

# Plano: Reestruturar Início, Checklist e Gamificação

## Escopo

Reestruturar 3 páginas com visual mais dinâmico, integrar gamificação com resultados reais do CRM e ferramentas, e criar sistema de recompensas que gera benefícios concretos (bônus de entregas, descontos).

---

## Fase 1 — Dashboard Início (visual dinâmico + interativo)

**Arquivo: `src/pages/cliente/ClienteInicio.tsx`**

Reestruturar layout com animações framer-motion e interatividade:

1. **Hero animado**: Adicionar animações de entrada (fade-in/slide-up) com framer-motion nos elementos do hero. Incluir um mini-resumo de gamificação inline (nível atual, XP, streak) com link para a página de gamificação.

2. **KPIs interativos**: Cada card de KPI ganha animação de contagem (count-up) no valor e micro-interação hover (scale + glow). Clicáveis — navegam para a página relevante.

3. **Checklist inline interativo**: O widget de tarefas do dia (coluna direita) passa a permitir toggle direto — ao clicar no círculo, marca como concluído, dispara confetti via `CelebrationEffect` quando completar 100%, e atualiza XP em tempo real.

4. **Barra de progresso gamificada**: Abaixo dos KPIs, adicionar uma barra horizontal de "progresso do dia" que combina checklist + metas + atividade CRM numa pontuação diária visual (0-100), com animação de preenchimento.

5. **Card de Nível/Streak**: Na coluna direita, abaixo das metas, mostrar card compacto com nível atual, barra de XP, e streak em chamas (🔥) com animação pulse quando streak > 7.

**Componentes novos:**
- Nenhum arquivo novo — tudo inline no `ClienteInicio.tsx` usando framer-motion

---

## Fase 2 — Checklist Inteligente

**Arquivo: `src/pages/cliente/ClienteChecklist.tsx`**

1. **Visual upgrade**: Cards de tarefas com animações de entrada staggered (framer-motion). Checkbox com animação de "check" satisfatória (scale bounce). Tarefas concluídas deslizam para seção "Concluídas" com transição AnimatePresence.

2. **Contexto das tarefas**: Cada tarefa gerada pelo sistema ganha um badge explicativo (ex: "3 leads parados", "2 tarefas vencidas"). Mostrar ícone por categoria com cores distintas.

3. **Progresso circular animado**: O ring de progresso atual ganha animação suave + mudança de cor (vermelho < 30%, amarelo 30-70%, verde > 70%). Ao atingir 100%, dispara celebração.

4. **Streak visual**: Exibir dias de streak com ícone de fogo animado (pulse) + mensagem motivacional contextual.

5. **XP feedback inline**: Ao completar tarefa, mostrar toast "+10 XP" animado subindo. Ao completar todas, mostrar "+50 XP BÔNUS!" com confetti.

**Arquivo: `src/hooks/useClienteContent.ts`**
- Ajustar `toggleChecklistItem` para dar +10 XP por tarefa individual (não só bônus de 100%)

---

## Fase 3 — Gamificação com Recompensas Reais

### 3A — Nova tabela de recompensas

**Migration:**
```sql
CREATE TABLE public.gamification_rewards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text,
  type text NOT NULL DEFAULT 'bonus_credits',
  value jsonb DEFAULT '{}',
  required_level int DEFAULT 1,
  required_badges text[] DEFAULT '{}',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.gamification_rewards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view rewards"
  ON public.gamification_rewards FOR SELECT TO authenticated
  USING (public.is_member_of_org(auth.uid(), organization_id));

CREATE POLICY "Admins can manage rewards"
  ON public.gamification_rewards FOR ALL TO authenticated
  USING (public.is_member_of_org(auth.uid(), organization_id));

-- Track claimed rewards
CREATE TABLE public.gamification_claims (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  reward_id uuid REFERENCES gamification_rewards(id) ON DELETE CASCADE NOT NULL,
  claimed_at timestamptz DEFAULT now(),
  status text DEFAULT 'claimed'
);

ALTER TABLE public.gamification_claims ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own claims"
  ON public.gamification_claims FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can claim rewards"
  ON public.gamification_claims FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
```

### 3B — Página de Gamificação reestruturada

**Arquivo: `src/pages/cliente/ClienteGamificacao.tsx`**

1. **Evolution Card animado**: Barra de XP com animação de preenchimento + partículas. Avatar do nível com ícone temático que muda por nível (escudo, espada, coroa, etc.). Pulse effect no streak.

2. **Medalhas dinâmicas**: Auto-unlock baseado em dados reais do CRM:
   - "Primeiro Lead" → 1+ lead criado
   - "Vendedor Nato" → 10+ vendas fechadas
   - "Maratonista" → 30 dias de streak
   - "Mestre do CRM" → 100+ leads gerenciados
   - "Top Closer" → R$100k em vendas
   - **NOVAS medalhas baseadas em uso de ferramentas:**
     - "Estrategista Digital" → 5+ conteúdos gerados
     - "Atirador de Elite" → 10+ disparos enviados
     - "Construtor" → 1+ site gerado
     - "Automatizador" → 1+ agente IA ativo

3. **Seção de Recompensas**: Novo card "Recompensas Disponíveis" mostrando benefícios desbloqueáveis por nível:
   - Nível 2 (Aprendiz): +50 créditos bônus
   - Nível 3 (Profissional): +200 créditos bônus
   - Nível 4 (Especialista): 5% desconto no plano
   - Nível 5 (Mestre): +500 créditos + 1 geração extra
   - Nível 6 (Lenda): 10% desconto + 1000 créditos
   Cards com estado locked/unlocked/claimed. Botão "Resgatar" que credita no wallet.

4. **Ranking da equipe**: Manter ranking atual, mas com animações de entrada e badges visuais (🥇🥈🥉).

### 3C — Integrar XP com ações reais

**Arquivo: `src/hooks/useClienteContent.ts`**
- `toggleChecklistItem`: +10 XP por tarefa, +50 XP bônus ao completar todas

**Novos triggers de XP** (via funções no DB ou hooks):
- Lead criado no CRM: +10 XP
- Lead ganho: +50 XP
- Conteúdo gerado: +20 XP
- Script gerado: +15 XP
- Site gerado: +30 XP

**Migration para trigger de XP no CRM:**
```sql
CREATE OR REPLACE FUNCTION public.award_xp_on_lead_won()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF NEW.won_at IS NOT NULL AND OLD.won_at IS NULL THEN
    UPDATE client_gamification
    SET xp = COALESCE(xp, 0) + 50,
        points = COALESCE(points, 0) + 50,
        last_activity_at = now()
    WHERE user_id = NEW.assigned_to
      AND organization_id = NEW.organization_id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_award_xp_lead_won
  AFTER UPDATE ON crm_leads
  FOR EACH ROW EXECUTE FUNCTION award_xp_on_lead_won();

CREATE OR REPLACE FUNCTION public.award_xp_on_lead_created()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  UPDATE client_gamification
  SET xp = COALESCE(xp, 0) + 10,
      points = COALESCE(points, 0) + 10,
      last_activity_at = now()
  WHERE user_id = NEW.assigned_to
    AND organization_id = NEW.organization_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_award_xp_lead_created
  AFTER INSERT ON crm_leads
  FOR EACH ROW EXECUTE FUNCTION award_xp_on_lead_created();
```

---

## Arquivos a Modificar/Criar

| Arquivo | Ação |
|---|---|
| `src/pages/cliente/ClienteInicio.tsx` | Redesign com animações, checklist interativo, card gamificação |
| `src/pages/cliente/ClienteChecklist.tsx` | Animações, XP inline, celebração |
| `src/pages/cliente/ClienteGamificacao.tsx` | Medalhas dinâmicas, recompensas, visual animado |
| `src/hooks/useClienteContent.ts` | XP por tarefa individual (+10) |
| Migration | Tabelas `gamification_rewards` + `gamification_claims` + triggers XP |

## Migrations Necessárias
- Tabelas de recompensas e claims
- Triggers para XP automático em ações do CRM


// @ts-nocheck
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Zap, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

interface GoalDisplay {
  label: string;
  current: number;
  target: number;
  percent: number;
  metric: string;
}

interface ClienteInicioGoalsProps {
  goalsDisplay: GoalDisplay[];
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 0 }).format(value);
}

export function ClienteInicioGoals({ goalsDisplay }: ClienteInicioGoalsProps) {
  const navigate = useNavigate();
  const now = new Date();

  return (
    <Card>
      <CardHeader className="px-5 pt-5 pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
              <Zap className="w-3.5 h-3.5 text-primary" />
            </div>
            <CardTitle className="text-sm font-semibold">Metas do Mês</CardTitle>
          </div>
          <span className="text-[10px] text-muted-foreground capitalize font-medium">{format(now, "MMMM yyyy", { locale: ptBR })}</span>
        </div>
      </CardHeader>
      <CardContent className="px-5 pb-5 space-y-4">
        {goalsDisplay.length === 0 ? (
          <div className="text-center py-4">
            <p className="text-xs text-muted-foreground mb-2">Nenhuma meta configurada</p>
            <Button variant="outline" size="sm" className="text-xs h-8 rounded-lg" onClick={() => navigate("/cliente/plano-vendas")}>
              Criar meta <ArrowRight className="w-3 h-3 ml-1" />
            </Button>
          </div>
        ) : goalsDisplay.map((goal, i) => {
          const pct = Math.min(goal.percent, 100);
          const isOnTrack = pct >= 70;
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 + i * 0.1 }}
              className="space-y-1.5"
            >
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-muted-foreground font-medium">{goal.label}</span>
                <span className="font-semibold tabular-nums">
                  {goal.metric === "revenue" ? formatCurrency(goal.current) : goal.current.toLocaleString("pt-BR")}
                  <span className="text-muted-foreground font-normal"> / {goal.metric === "revenue" ? formatCurrency(goal.target) : goal.target.toLocaleString("pt-BR")}</span>
                </span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden">
                <motion.div
                  className={`h-full rounded-full ${isOnTrack ? "bg-emerald-500" : "bg-amber-500"}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.8, delay: 0.5 + i * 0.1 }}
                />
              </div>
            </motion.div>
          );
        })}
        <Button variant="outline" size="sm" className="w-full text-xs h-9 mt-2 rounded-lg" onClick={() => navigate("/cliente/plano-vendas")}>
          Ver detalhes <ArrowRight className="w-3 h-3 ml-1" />
        </Button>
      </CardContent>
    </Card>
  );
}
